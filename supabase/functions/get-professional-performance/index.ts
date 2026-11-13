import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. AUTHENTICATION & AUTHORIZATION
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), { status: 401, headers: corsHeaders });
    }
    const role = user.app_metadata?.role;
    const isOwner = role === 'estabelecimento' || role === 'barbearia';
    const isProf = role === 'profissional' || role === 'barbeiro';
    if (!isOwner && !isProf && role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json();
    const profissionalId = body.profissionalId || body.barberId;
    if (!profissionalId) {
      throw new Error('O ID do profissional é obrigatório.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. FETCH PROFISSIONAL PROFILE AND OWNERSHIP CHECK
    const { data: profRecord, error: profError } = await supabaseAdmin
      .from('profissionais')
      .select('nome, tipos_profissional(percentual_comissao), estabelecimento_id, user_id')
      .eq('id', profissionalId)
      .single();

    if (profError || !profRecord) throw new Error(`Profissional não encontrado: ${profError?.message || ''}`);

    if (isProf && user.id !== profRecord.user_id) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para ver o desempenho deste profissional.' }), { status: 403, headers: corsHeaders });
    }
    if (!profRecord.estabelecimento_id) throw new Error('ID do estabelecimento ausente no perfil do profissional.');

    // 4. DATE RANGE (Last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    // 5. FETCH DEPENDENT DATA
    const [
      { data: estabelecimento, error: estError },
      { data: agendamentos, error: agendamentosError }
    ] = await Promise.all([
      supabaseAdmin
        .from('estabelecimentos')
        .select('comissao_padrao, status, dono_id')
        .eq('id', profRecord.estabelecimento_id)
        .single(),
      supabaseAdmin
        .from('agendamentos')
        .select('data, servico_nome, servicos(preco)')
        .eq('profissional_id', profissionalId)
        .eq('status', 'concluido')
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: false })
    ]);

    if (estError) throw estError;
    if (agendamentosError) throw agendamentosError;

    if (role !== 'admin' && estabelecimento?.status !== 'ativa') {
      return new Response(JSON.stringify({ error: 'Estabelecimento suspenso.' }), { status: 403, headers: corsHeaders });
    }
    if (isOwner && estabelecimento?.dono_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para ver o desempenho deste profissional.' }), { status: 403, headers: corsHeaders });
    }

    // 6. CALCULATE PERFORMANCE
    const tipoProf = (profRecord.tipos_profissional as any);
    const commissionRate = tipoProf?.percentual_comissao ?? estabelecimento?.comissao_padrao;
    const comissaoPercentual = (commissionRate || 0) / 100;

    let totalGerado = 0;
    let totalComissao = 0;

    const servicesList = (agendamentos || []).map((ag: any) => {
      const preco = ag.servicos?.preco || 0;
      const comissao = preco * comissaoPercentual;
      totalGerado += preco;
      totalComissao += comissao;

      return {
        data: ag.data,
        servico: ag.servico_nome,
        valor: preco,
        comissao: comissao,
      };
    });

    const response = {
      professionalName: profRecord.nome,
      barberName: profRecord.nome,
      commissionRate: commissionRate,
      totalGenerated: totalGerado,
      totalCommission: totalComissao,
      services: servicesList,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Erro ao buscar desempenho do profissional:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
