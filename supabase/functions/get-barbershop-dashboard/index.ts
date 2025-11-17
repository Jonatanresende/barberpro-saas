import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to get start of week (Monday)
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { barbeariaId } = await req.json();
    if (!barbeariaId) {
      throw new Error('O ID da barbearia é obrigatório.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Fetch all necessary data in parallel ---
    const [
      { data: barbeariaData, error: barbeariaError },
      { data: servicos, error: servicosError },
      { data: agendamentos, error: agendamentosError },
      { data: barbeiros, error: barbeirosError },
    ] = await Promise.all([
      supabase.from('barbearias').select('comissao_padrao').eq('id', barbeariaId).single(),
      supabase.from('servicos').select('id, preco').eq('barbearia_id', barbeariaId),
      supabase.from('agendamentos').select('servico_id, data, status, cliente_id, barbeiro_id').eq('barbearia_id', barbeariaId),
      supabase.from('barbeiros').select('id, nome').eq('barbearia_id', barbeariaId),
    ]);

    if (barbeariaError) throw barbeariaError;
    if (servicosError) throw servicosError;
    if (agendamentosError) throw agendamentosError;
    if (barbeirosError) throw barbeirosError;

    // --- Process Data ---
    const servicePriceMap = new Map(servicos.map(s => [s.id, s.preco]));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = new Date().toISOString().split('T')[0];

    const startOfWeek = getStartOfWeek(new Date());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    let rendaDiaria = 0;
    let rendaSemanal = 0;
    let rendaMensal = 0;
    
    const comissaoPercentual = (barbeariaData.comissao_padrao || 0) / 100;
    const comissoesPorBarbeiro: { [key: string]: { nome: string, valor: number } } = {};
    barbeiros.forEach(b => {
        comissoesPorBarbeiro[b.id] = { nome: b.nome, valor: 0 };
    });

    const completedAppointmentsThisMonth = agendamentos.filter(a => {
        const appointmentDate = new Date(`${a.data}T00:00:00`);
        return a.status === 'concluído' && appointmentDate >= startOfMonth;
    });

    for (const ag of agendamentos) {
      const appointmentDate = new Date(`${ag.data}T00:00:00`);
      const price = servicePriceMap.get(ag.servico_id) || 0;

      if (ag.status === 'concluído') {
        if (appointmentDate.getTime() === today.getTime()) rendaDiaria += price;
        if (appointmentDate >= startOfWeek) rendaSemanal += price;
        if (appointmentDate >= startOfMonth) {
            rendaMensal += price;
            if (comissoesPorBarbeiro[ag.barbeiro_id]) {
                comissoesPorBarbeiro[ag.barbeiro_id].valor += price * comissaoPercentual;
            }
        }
      }
    }

    const totalAgendamentosHoje = agendamentos.filter(a => a.data === todayISO).length;
    const uniqueClients = new Set(agendamentos.map(a => a.cliente_id));

    // --- Final Response ---
    const response = {
      rendaDiaria,
      rendaSemanal,
      rendaMensal,
      totalAgendamentosHoje,
      totalBarbeiros: barbeiros.length,
      totalClientes: uniqueClients.size,
      comissoes: Object.values(comissoesPorBarbeiro),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard da barbearia:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});