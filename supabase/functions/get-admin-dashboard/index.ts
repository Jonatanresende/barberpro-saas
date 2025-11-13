import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Definição de preços dos planos para cálculo da receita
const PLAN_PRICES: { [key: string]: number } = {
  'Básico': 49,
  'Premium': 99,
  'Pro': 99, // Baseado no componente de Planos existente
};

// Função auxiliar para agregar dados por mês de forma ordenada
const aggregateByMonth = (items: any[], dateField: string, valueField?: string, valueMap?: { [key: string]: number }) => {
  const monthlyData: { [key: string]: { value: number, date: Date } } = {};

  items.forEach(item => {
    const date = new Date(item[dateField]);
    // Chave no formato YYYY-MM para ordenação correta
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; 
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { value: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
    }
    
    let valueToAdd = 1; // Padrão para contagem (ex: novos usuários)
    if (valueField && valueMap && item[valueField]) {
      valueToAdd = valueMap[item[valueField]] || 0; // Para somar valores (ex: receita)
    }
    
    monthlyData[monthKey].value += valueToAdd;
  });

  return Object.values(monthlyData)
    .sort((a, b) => a.date.getTime() - b.date.getTime()) // Ordena por data
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- Busca de Dados de Usuários ---
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 10000 });
    if (usersError) throw usersError;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const activeUsersLastMonth = users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > oneMonthAgo).length;

    const latestUsers = users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(u => ({ email: u.email, created_at: u.created_at }));

    // --- Busca de Dados de Barbearias e Receita ---
    const { data: barbearias, error: barbeariasError } = await supabaseAdmin.from('barbearias').select('plano, criado_em');
    if (barbeariasError) throw barbeariasError;

    const totalRevenue = barbearias.reduce((sum, b) => sum + (PLAN_PRICES[b.plano] || 0), 0);

    // --- Preparação dos Dados para Gráficos ---
    const userGrowthChartData = aggregateByMonth(users, 'created_at').map(d => ({ name: d.name, Usuários: d.value }));
    const monthlyRevenueChartData = aggregateByMonth(barbearias, 'criado_em', 'plano', PLAN_PRICES).map(d => ({ name: d.name, Receita: d.value }));

    // --- Resposta Final ---
    const response = {
      totalUsers: users.length,
      activeUsersLastMonth,
      totalPlansSold: barbearias.length,
      totalRevenue,
      latestUsers,
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