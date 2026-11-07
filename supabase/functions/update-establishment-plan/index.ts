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
    if (user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json();
    const estabelecimentoId = body.estabelecimentoId || body.barbeariaId;
    const { newPlanName } = body;

    if (!estabelecimentoId || !newPlanName) {
      throw new Error('ID do estabelecimento e nome do novo plano são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: targetPlan, error: planError } = await supabaseAdmin
      .from('planos')
      .select('limite_profissionais')
      .eq('nome', newPlanName)
      .single();

    if (planError) throw new Error(`Plano "${newPlanName}" não encontrado.`);

    const newLimit = targetPlan?.limite_profissionais;

    const { count: activeProfCount, error: countError } = await supabaseAdmin
      .from('profissionais')
      .select('*', { count: 'exact', head: true })
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('ativo', true);

    if (countError) throw new Error('Erro ao contar profissionais ativos.');

    if (newLimit !== null && newLimit !== undefined && activeProfCount !== null && activeProfCount > newLimit) {
      const excessCount = activeProfCount - newLimit;
      
      const { data: profsToRemove, error: fetchError } = await supabaseAdmin
        .from('profissionais')
        .select('id, user_id')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .order('criado_em', { ascending: true })
        .limit(excessCount);

      if (fetchError) throw new Error('Erro ao buscar profissionais para remover.');

      if (profsToRemove && profsToRemove.length > 0) {
        const profIdsToRemove = profsToRemove.map(p => p.id);
        const userIdsToRemove = profsToRemove.map(p => p.user_id).filter(Boolean);

        const { error: deleteProfsError } = await supabaseAdmin
          .from('profissionais')
          .delete()
          .in('id', profIdsToRemove);
        
        if (deleteProfsError) throw new Error('Erro ao remover registros de profissionais.');

        for (const userId of userIdsToRemove) {
          const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
          if (deleteUserError) {
              console.error(`Falha ao excluir usuário ${userId} durante o downgrade de plano:`, deleteUserError.message);
          }
        }
      }
    }

    const { data: updatedEstabelecimento, error: updateError } = await supabaseAdmin
      .from('estabelecimentos')
      .update({ plano: newPlanName })
      .eq('id', estabelecimentoId)
      .select()
      .single();

    if (updateError) throw new Error('Erro ao atualizar o plano do estabelecimento.');

    return new Response(JSON.stringify(updatedEstabelecimento), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
