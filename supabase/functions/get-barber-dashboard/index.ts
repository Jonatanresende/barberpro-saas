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
    if (user.user_metadata?.role !== 'barbeiro') {
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

    // 3. OWNERSHIP CHECK & FETCH BARBER INFO
    const { data: barberProfile, error: profileError } = await supabaseAdmin
      .from('barbeiros')
      .select('id, barbearia_id, user_id, professional_types(name, commission_percent)') // Incluindo user_id
      .eq('user_id', user.id)
      .single();

    if (profileError || !barberProfile || barberProfile.id !== barbeiroId) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para ver este dashboard.' }), { status: 403, headers: corsHeaders });
    }
    
    const barbeiro = barberProfile;

    // 4. FETCH BARBERSHOP INFO (for default commission if type is missing)
    const { data: barbearia, error: barbeariaError } = await supabaseAdmin
      .from('barbearias')
      .select('comissao_padrao')
      .eq('id', barbeiro.barbearia_id)
      .single();
    if (barbeariaError) throw barbeariaError;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    // 5. FETCH APPOINTMENTS
    const { data: agendamentos, error: agendamentosError } = await supabaseAdmin
      .from('agendamentos')
      .select('status, servicos(preco)')
      .eq('barbeiro_id', barbeiroId)
      .gte('data', startOfMonth)
      .lte('data', endOfMonth);
    if (agendamentosError) throw agendamentosError;

    // Determine the commission rate: use professional type commission if available, otherwise use barbershop default.
    const commissionRate = barbeiro.professional_types?.commission_percent ?? barbearia.comissao_padrao;
    const comissaoPercentual = (commissionRate || 0) / 100;
    
    let comissaoDoMes = 0;
    let totalGeradoNoMes = 0;
    let agendamentosConcluidos = 0;

    for (const ag of agendamentos) {
      if (ag.status === 'concluido') {
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
      professionalTypeName: barbeiro.professional_types?.name,
      commissionRate: commissionRate,
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