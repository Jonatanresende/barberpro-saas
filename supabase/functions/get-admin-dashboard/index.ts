import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Filtra para obter apenas usuários donos de barbearia
    const barbershopUsers = users.filter(u => u.user_metadata?.role === 'barbearia');
    const totalBarbershopUsers = barbershopUsers.length;

    // --- Busca de Dados de Barbearias e Planos ---
    const { data: barbearias, error: barbeariasError } = await supabaseAdmin.from('barbearias').select('plano, status, criado_em');
    if (barbeariasError) throw barbeariasError;
    
    const { data: planos, error: planosError } = await supabaseAdmin.from('planos').select('nome, preco');
    if (planosError) throw planosError;

    // --- Cálculos das Métricas ---
    const totalBarbearias = barbearias.length;
    const activeBarbearias = barbearias.filter(b => b.status === 'ativa').length;

    // Cria um mapa de preços a partir da tabela de planos para o cálculo da receita
    const planPricesMap = planos.reduce((acc, plan) => {
      acc[plan.nome] = plan.preco;
      return acc;
    }, {} as { [key: string]: number });

    const totalRevenue = barbearias.reduce((sum, b) => sum + (planPricesMap[b.plano] || 0), 0);

    // --- Dados Adicionais ---
    const latestUsers = users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(u => ({ email: u.email, created_at: u.created_at }));

    // --- Preparação dos Dados para Gráficos ---
    const userGrowthChartData = aggregateByMonth(barbershopUsers, 'created_at').map(d => ({ name: d.name, Usuários: d.value }));
    const monthlyRevenueChartData = aggregateByMonth(barbearias, 'criado_em', 'plano', planPricesMap).map(d => ({ name: d.name, Receita: d.value }));

    // --- Resposta Final ---
    const response = {
      totalRevenue,
      totalBarbershopUsers,
      totalBarbearias,
      activeBarbearias,
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