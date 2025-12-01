import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const aggregateByMonth = (items: any[], dateField: string, valueField?: string, valueMap?: { [key: string]: number }) => {
  const monthlyData: { [key: string]: { value: number, date: Date } } = {};

  items.forEach(item => {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; 
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { value: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
    }
    
    let valueToAdd = 1;
    if (valueField && valueMap && item[valueField]) {
      valueToAdd = valueMap[item[valueField]] || 0;
    }
    
    monthlyData[monthKey].value += valueToAdd;
  });

  return Object.values(monthlyData)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(d => ({
      name: d.date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
      value: d.value
    }));
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
    if (user.user_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 10000 });
    if (usersError) throw usersError;

    const barbershopUsers = users.filter(u => u.user_metadata?.role === 'barbearia');
    const totalBarbershopUsers = barbershopUsers.length;

    const { data: barbearias, error: barbeariasError } = await supabaseAdmin.from('barbearias').select('nome, plano, status, criado_em');
    if (barbeariasError) throw barbeariasError;
    
    const { data: planos, error: planosError } = await supabaseAdmin.from('planos').select('nome, preco');
    if (planosError) throw planosError;

    const totalBarbearias = barbearias.length;
    const activeBarbearias = barbearias.filter(b => b.status === 'ativa').length;

    const planPricesMap = planos.reduce((acc, plan) => {
      acc[plan.nome] = plan.preco;
      return acc;
    }, {} as { [key: string]: number });

    const totalRevenue = barbearias.reduce((sum, b) => sum + (planPricesMap[b.plano] || 0), 0);

    const latestBarbershops = barbearias
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      .slice(0, 5)
      .map(b => ({ nome: b.nome, criado_em: b.criado_em }));

    const userGrowthChartData = aggregateByMonth(barbershopUsers, 'created_at').map(d => ({ name: d.name, Usuários: d.value }));
    const monthlyRevenueChartData = aggregateByMonth(barbearias, 'criado_em', 'plano', planPricesMap).map(d => ({ name: d.name, Receita: d.value }));

    const response = {
      totalRevenue,
      totalBarbershopUsers,
      totalBarbearias,
      activeBarbearias,
      latestBarbershops,
      userGrowthChartData,
      monthlyRevenueChartData,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})