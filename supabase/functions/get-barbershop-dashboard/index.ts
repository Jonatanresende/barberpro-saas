import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
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
    if (user.user_metadata?.role !== 'barbearia') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const { barbeariaId } = await req.json();
    if (!barbeariaId) {
      throw new Error('O ID da barbearia é obrigatório.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. OWNERSHIP CHECK
    const { data: ownerBarbearia, error: ownerError } = await supabaseAdmin
      .from('barbearias')
      .select('id')
      .eq('dono_id', user.id)
      .single();

    if (ownerError || !ownerBarbearia || ownerBarbearia.id !== barbeariaId) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para ver este dashboard.' }), { status: 403, headers: corsHeaders });
    }
    
    // 4. EXECUTION
    const todayISO = new Date().toISOString().split('T')[0];

    const [
      { data: barbeariaData, error: barbeariaError },
      { data: servicos, error: servicosError },
      { data: agendamentos, error: agendamentosError },
      { data: barbeiros, error: barbeirosError },
      { data: disponibilidadesHoje, error: dispError }
    ] = await Promise.all([
      supabaseAdmin.from('barbearias').select('comissao_padrao').eq('id', barbeariaId).single(),
      supabaseAdmin.from('servicos').select('id, preco').eq('barbearia_id', barbeariaId),
      supabaseAdmin.from('agendamentos').select('servico_id, data, status, cliente_id, barbeiro_id').eq('barbearia_id', barbeariaId),
      supabaseAdmin.from('barbeiros').select('id, nome, foto_url').eq('barbearia_id', barbeariaId),
      supabaseAdmin.from('barbeiro_disponibilidade').select('barbeiro_id, disponivel').eq('data', todayISO)
    ]);

    if (barbeariaError) throw barbeariaError;
    if (servicosError) throw servicosError;
    if (agendamentosError) throw agendamentosError;
    if (barbeirosError) throw barbeirosError;
    if (dispError) throw dispError;

    const servicePriceMap = new Map(servicos.map(s => [s.id, s.preco]));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const availabilityMap = new Map(disponibilidadesHoje.map(d => [d.barbeiro_id, d.disponivel]));
    const barberStatusList = barbeiros.map(barbeiro => ({
        id: barbeiro.id,
        nome: barbeiro.nome,
        foto_url: barbeiro.foto_url,
        isAvailableToday: availabilityMap.has(barbeiro.id) ? availabilityMap.get(barbeiro.id) : true,
    }));

    const response = {
      rendaDiaria,
      rendaSemanal,
      rendaMensal,
      totalAgendamentosHoje,
      totalBarbeiros: barbeiros.length,
      totalClientes: uniqueClients.size,
      comissoes: Object.values(comissoesPorBarbeiro),
      barberStatusList,
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