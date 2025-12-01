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
    if (user.user_metadata?.role !== 'barbearia') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const { barberId, userId, updates } = await req.json()

    if (!barberId || !updates) {
      throw new Error('Parâmetros obrigatórios ausentes: barberId ou updates.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. OWNERSHIP CHECK
    const { data: ownerBarbearia } = await supabaseAdmin
      .from('barbearias')
      .select('id')
      .eq('dono_id', user.id)
      .single();
    
    const { data: barberRecord } = await supabaseAdmin
      .from('barbeiros')
      .select('barbearia_id')
      .eq('id', barberId)
      .single();

    if (!barberRecord || barberRecord.barbearia_id !== ownerBarbearia?.id) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para editar este barbeiro.' }), { status: 403, headers: corsHeaders });
    }

    // 4. EXECUTION
    if (userId) {
      const authUpdates: { email?: string; user_metadata?: { full_name: string } } = {};
      if (updates.email) {
        authUpdates.email = updates.email;
      }
      if (updates.nome) {
        authUpdates.user_metadata = { full_name: updates.nome };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          authUpdates
        );
        if (authError) {
          console.error('Falha ao atualizar os dados do usuário no Auth:', authError.message);
          throw new Error(`Falha ao atualizar dados de autenticação: ${authError.message}`);
        }
      }
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('barbeiros')
      .update(updates)
      .eq('id', barberId)
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro ao atualizar barbeiro:', dbError);
      throw new Error(`Falha ao atualizar detalhes do barbeiro: ${dbError.message}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})