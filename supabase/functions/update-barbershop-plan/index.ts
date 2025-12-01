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
    if (user.user_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const { barbeariaId, newPlanName } = await req.json();
    if (!barbeariaId || !newPlanName) {
      throw new Error('ID da barbearia e nome do novo plano são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: targetPlan, error: planError } = await supabaseAdmin
      .from('planos')
      .select('limite_barbeiros')
      .eq('nome', newPlanName)
      .single();

    if (planError) throw new Error(`Plano "${newPlanName}" não encontrado.`);

    const newLimit = targetPlan.limite_barbeiros;

    const { count: activeBarberCount, error: countError } = await supabaseAdmin
      .from('barbeiros')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaId)
      .eq('ativo', true);

    if (countError) throw new Error('Erro ao contar barbeiros ativos.');

    if (newLimit !== null && activeBarberCount > newLimit) {
      const excessCount = activeBarberCount - newLimit;
      
      const { data: barbersToRemove, error: fetchError } = await supabaseAdmin
        .from('barbeiros')
        .select('id, user_id')
        .eq('barbearia_id', barbeariaId)
        .eq('ativo', true)
        .order('criado_em', { ascending: true })
        .limit(excessCount);

      if (fetchError) throw new Error('Erro ao buscar barbeiros para remover.');

      if (barbersToRemove && barbersToRemove.length > 0) {
        const barberIdsToRemove = barbersToRemove.map(b => b.id);
        const userIdsToRemove = barbersToRemove.map(b => b.user_id).filter(Boolean);

        const { error: deleteBarbersError } = await supabaseAdmin
          .from('barbeiros')
          .delete()
          .in('id', barberIdsToRemove);
        
        if (deleteBarbersError) throw new Error('Erro ao remover registros de barbeiros.');

        for (const userId of userIdsToRemove) {
          const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
          if (deleteUserError) {
              console.error(`Falha ao excluir usuário ${userId} durante o downgrade de plano:`, deleteUserError.message);
          }
        }
      }
    }

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