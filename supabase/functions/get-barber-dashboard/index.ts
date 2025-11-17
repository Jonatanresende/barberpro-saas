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
    const { barbeiroId } = await req.json();
    if (!barbeiroId) {
      throw new Error('O ID do barbeiro é obrigatório.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Buscar dados essenciais ---
    const { data: barbeiro, error: barbeiroError } = await supabase
      .from('barbeiros')
      .select('barbearia_id')
      .eq('id', barbeiroId)
      .single();
    if (barbeiroError) throw barbeiroError;

    const { data: barbearia, error: barbeariaError } = await supabase
      .from('barbearias')
      .select('comissao_padrao')
      .eq('id', barbeiro.barbearia_id)
      .single();
    if (barbeariaError) throw barbeariaError;

    // --- Buscar agendamentos do mês atual ---
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('status, servicos(preco)')
      .eq('barbeiro_id', barbeiroId)
      .gte('data', startOfMonth)
      .lte('data', endOfMonth);
    if (agendamentosError) throw agendamentosError;

    // --- Calcular métricas ---
    const comissaoPercentual = (barbearia.comissao_padrao || 0) / 100;
    let comissaoDoMes = 0;
    let totalGeradoNoMes = 0;
    let agendamentosConcluidos = 0;

    for (const ag of agendamentos) {
      if (ag.status === 'concluído') {
        const preco = ag.servicos?.preco || 0;
        totalGeradoNoMes += preco;
        comissaoDoMes += preco * comissaoPercentual;
        agendamentosConcluidos++;
      }
    }

    const response = {
      comissaoDoMes,
      totalGeradoNoMes,
      agendamentosConcluidos,
      totalAgendamentosMes: agendamentos.length,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard do barbeiro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});