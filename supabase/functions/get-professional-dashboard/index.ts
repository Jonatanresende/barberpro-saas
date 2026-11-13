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
    if (role !== 'profissional' && role !== 'barbeiro' && role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json();
    const profissionalId = body.profissionalId || body.barbeiroId;
    if (!profissionalId) {
      throw new Error('O ID do profissional é obrigatório.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. OWNERSHIP CHECK & FETCH PROFISSIONAL INFO
    const { data: profProfile, error: profileError } = await supabaseAdmin
      .from('profissionais')
      .select('id, estabelecimento_id, user_id, tipos_profissional(nome, percentual_comissao)')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profProfile || profProfile.id !== profissionalId) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para ver este dashboard.' }), { status: 403, headers: corsHeaders });
    }

    const profissional = profProfile;

    // 4. FETCH ESTABELECIMENTO INFO (for default commission if type is missing)
    const { data: estabelecimento, error: estError } = await supabaseAdmin
      .from('estabelecimentos')
      .select('comissao_padrao, status')
      .eq('id', profissional.estabelecimento_id)
      .single();
    if (estError) throw estError;
    if (estabelecimento?.status !== 'ativa') {
      return new Response(JSON.stringify({ error: 'Estabelecimento suspenso.' }), { status: 403, headers: corsHeaders });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    // 5. FETCH APPOINTMENTS
    const { data: agendamentos, error: agendamentosError } = await supabaseAdmin
      .from('agendamentos')
      .select('status, servicos(preco)')
      .eq('profissional_id', profissionalId)
      .gte('data', startOfMonth)
      .lte('data', endOfMonth);
    if (agendamentosError) throw agendamentosError;

    const tipoProf = (profissional.tipos_profissional as any);
    const commissionRate = tipoProf?.percentual_comissao ?? estabelecimento?.comissao_padrao;
    const comissaoPercentual = (commissionRate || 0) / 100;

    let comissaoDoMes = 0;
    let totalGeradoNoMes = 0;
    let agendamentosConcluidos = 0;

    for (const ag of (agendamentos || [])) {
      if (ag.status === 'concluido') {
        const preco = (ag.servicos as any)?.preco || 0;
        totalGeradoNoMes += preco;
        comissaoDoMes += preco * comissaoPercentual;
        agendamentosConcluidos++;
      }
    }

    const response = {
      comissaoDoMes,
      totalGeradoNoMes,
      agendamentosConcluidos,
      totalAgendamentosMes: (agendamentos || []).length,
      professionalTypeName: tipoProf?.nome,
      commissionRate: commissionRate,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados do dashboard do profissional:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
