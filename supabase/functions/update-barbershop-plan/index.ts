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
    const { barbeariaId, newPlanName } = await req.json();
    if (!barbeariaId || !newPlanName) {
      throw new Error('ID da barbearia e nome do novo plano são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar detalhes do novo plano
    const { data: targetPlan, error: planError } = await supabaseAdmin
      .from('planos')
      .select('limite_barbeiros')
      .eq('nome', newPlanName)
      .single();

    if (planError) throw new Error(`Plano "${newPlanName}" não encontrado.`);

    const newLimit = targetPlan.limite_barbeiros;

    // 2. Contar barbeiros ativos
    const { count: activeBarberCount, error: countError } = await supabaseAdmin
      .from('barbeiros')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaId)
      .eq('ativo', true);

    if (countError) throw new Error('Erro ao contar barbeiros ativos.');

    // 3. Se o limite for excedido, remover os mais antigos
    if (newLimit !== null && activeBarberCount > newLimit) {
      const excessCount = activeBarberCount - newLimit;
      
      // Encontrar os barbeiros mais antigos para remover
      const { data: barbersToRemove, error: fetchError } = await supabaseAdmin
        .from('barbeiros')
        .select('id, user_id')
        .eq('barbearia_id', barbeariaId)
        .eq('ativo', true)
        .order('criado_em', { ascending: true })
        .limit(excessCount);

      if (fetchError) throw new Error('Erro ao buscar barbeiros para remover.');

      const barberIdsToRemove = barbersToRemove.map(b => b.id);
      const userIdsToRemove = barbersToRemove.map(b => b.user_id).filter(Boolean); // Filtra IDs nulos

      // Remover registros da tabela 'barbeiros'
      const { error: deleteBarbersError } = await supabaseAdmin
        .from('barbeiros')
        .delete()
        .in('id', barberIdsToRemove);
      
      if (deleteBarbersError) throw new Error('Erro ao remover registros de barbeiros.');

      // Remover contas de usuário do Supabase Auth
      for (const userId of userIdsToRemove) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
    }

    // 4. Atualizar o plano da barbearia
    const { data: updatedBarbearia, error: updateError } = await supabaseAdmin
      .from('barbearias')
      .update({ plano: newPlanName })
      .eq('id', barbeariaId)
      .select()
      .single();

    if (updateError) throw new Error('Erro ao atualizar o plano da barbearia.');

    return new Response(JSON.stringify(updatedBarbearia), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});