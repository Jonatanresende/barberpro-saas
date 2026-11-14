import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getTodayISOInFortaleza = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

const getStartOfWeekISO = (todayISO: string) => {
  const d = new Date(`${todayISO}T00:00:00Z`);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1)); // segunda-feira
  return d.toISOString().split('T')[0];
};

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
    if (role !== 'estabelecimento' && role !== 'barbearia' && role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json();
    const estabelecimentoId = body.estabelecimentoId || body.barbeariaId;
    if (!estabelecimentoId) {
      throw new Error('O ID do estabelecimento é obrigatório.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. OWNERSHIP CHECK (admin tem acesso direto)
    if (role !== 'admin') {
      const { data: ownerEstabelecimento, error: ownerError } = await supabaseAdmin
        .from('estabelecimentos')
        .select('id, status')
        .eq('dono_id', user.id)
        .single();

      if (ownerError || !ownerEstabelecimento || ownerEstabelecimento.id !== estabelecimentoId) {
        return new Response(JSON.stringify({ error: 'Você não tem permissão para ver este dashboard.' }), { status: 403, headers: corsHeaders });
      }

      if (ownerEstabelecimento.status !== 'ativa') {
        return new Response(JSON.stringify({ error: 'Estabelecimento suspenso.' }), { status: 403, headers: corsHeaders });
      }
    }

    // 4. EXECUTION
    const todayISO = getTodayISOInFortaleza();

    const [
      { data: estData, error: estError },
      { data: servicos, error: servicosError },
      { data: agendamentos, error: agendamentosError },
      { data: profissionais, error: profsError },
      { data: disponibilidadesHoje, error: dispError }
    ] = await Promise.all([
      supabaseAdmin.from('estabelecimentos').select('comissao_padrao').eq('id', estabelecimentoId).single(),
      supabaseAdmin.from('servicos').select('id, preco').eq('estabelecimento_id', estabelecimentoId),
      supabaseAdmin.from('agendamentos').select('servico_id, data, status, cliente_id, profissional_id').eq('estabelecimento_id', estabelecimentoId),
      supabaseAdmin.from('profissionais').select('id, nome, foto_url').eq('estabelecimento_id', estabelecimentoId),
      supabaseAdmin.from('profissional_disponibilidade').select('profissional_id, disponivel').eq('data', todayISO)
    ]);

    if (estError) throw estError;
    if (servicosError) throw servicosError;
    if (agendamentosError) throw agendamentosError;
    if (profsError) throw profsError;
    if (dispError) throw dispError;

    const servicePriceMap = new Map((servicos || []).map((s: any) => [s.id, s.preco]));

    const startOfWeek = getStartOfWeekISO(todayISO);
    const startOfMonth = `${todayISO.slice(0, 7)}-01`;

    let rendaDiaria = 0;
    let rendaSemanal = 0;
    let rendaMensal = 0;

    const comissaoPercentual = (estData?.comissao_padrao || 0) / 100;
    const comissoesPorProfissional: { [key: string]: { nome: string, valor: number } } = {};
    (profissionais || []).forEach((p: any) => {
      comissoesPorProfissional[p.id] = { nome: p.nome, valor: 0 };
    });

    for (const ag of (agendamentos || [])) {
      const price = servicePriceMap.get(ag.servico_id) || 0;

      if (ag.status === 'concluido') {
        if (ag.data === todayISO) rendaDiaria += price;
        if (ag.data >= startOfWeek) rendaSemanal += price;
        if (ag.data >= startOfMonth) {
          rendaMensal += price;
          if (ag.profissional_id && comissoesPorProfissional[ag.profissional_id]) {
            comissoesPorProfissional[ag.profissional_id].valor += price * comissaoPercentual;
          }
        }
      }
    }

    const totalAgendamentosHoje = (agendamentos || []).filter((a: any) => a.data === todayISO).length;
    const uniqueClients = new Set((agendamentos || []).map((a: any) => a.cliente_id));

    const availabilityMap = new Map((disponibilidadesHoje || []).map((d: any) => [d.profissional_id, d.disponivel]));
    const professionalStatusList = (profissionais || []).map((prof: any) => ({
      id: prof.id,
      nome: prof.nome,
      foto_url: prof.foto_url,
      isAvailableToday: availabilityMap.has(prof.id) ? availabilityMap.get(prof.id) : true,
    }));

    const response = {
      rendaDiaria,
      rendaSemanal,
      rendaMensal,
      totalAgendamentosHoje,
      totalProfissionais: (profissionais || []).length,
      totalBarbeiros: (profissionais || []).length,
      totalClientes: uniqueClients.size,
      comissoes: Object.values(comissoesPorProfissional),
      professionalStatusList,
      barberStatusList: professionalStatusList,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados do dashboard do estabelecimento:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
