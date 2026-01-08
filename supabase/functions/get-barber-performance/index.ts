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
    // Permite acesso para Barbearia (proprietário) e Barbeiro (para ver o próprio desempenho)
    if (user.user_metadata?.role !== 'barbearia' && user.user_metadata?.role !== 'barbeiro') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const { barbeiroId } = await req.json();
    if (!barbeiroId) {
      throw new Error('O ID do barbeiro é obrigatório.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. OWNERSHIP CHECK (Se for barbeiro, verifica se é o próprio ID)
    if (user.user_metadata?.role === 'barbeiro') {
        const { data: barberProfile } = await supabaseAdmin
            .from('barbeiros')
            .select('id')
            .eq('user_id', user.id)
            .single();
        if (!barberProfile || barberProfile.id !== barbeiroId) {
            return new Response(JSON.stringify({ error: 'Você não tem permissão para ver o desempenho deste barbeiro.' }), { status: 403, headers: corsHeaders });
        }
    }
    // Se for barbearia, a RLS deve garantir que só veja barbeiros da sua barbearia.

    // 4. DATE RANGE (Last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    // 5. FETCH DATA
    const [
        { data: barbeiro, error: barberError },
        { data: barbearia, error: barbeariaError },
        { data: agendamentos, error: agendamentosError }
    ] = await Promise.all([
        supabaseAdmin
            .from('barbeiros')
            .select('nome, professional_types(commission_percent), barbearia_id')
            .eq('id', barbeiroId)
            .single(),
        supabaseAdmin
            .from('barbearias')
            .select('comissao_padrao')
            .eq('id', barbeiro?.barbearia_id)
            .single(),
        supabaseAdmin
            .from('agendamentos')
            .select('data, servico_nome, servicos(preco)')
            .eq('barbeiro_id', barbeiroId)
            .eq('status', 'concluido')
            .gte('data', startDate)
            .lte('data', endDate)
            .order('data', { ascending: false })
    ]);

    if (barberError) throw barberError;
    if (barbeariaError) throw barbeariaError;
    if (agendamentosError) throw agendamentosError;

    // 6. CALCULATE PERFORMANCE
    const commissionRate = barbeiro.professional_types?.commission_percent ?? barbearia.comissao_padrao;
    const comissaoPercentual = (commissionRate || 0) / 100;
    
    let totalGerado = 0;
    let totalComissao = 0;

    const servicesList = agendamentos.map(ag => {
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
        barberName: barbeiro.nome,
        commissionRate: commissionRate,
        totalGenerated: totalGerado,
        totalCommission: totalComissao,
        services: servicesList,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro ao buscar desempenho do barbeiro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});