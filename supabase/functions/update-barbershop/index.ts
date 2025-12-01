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

    // 2. LOGIC
    const { barbeariaId, ownerId, updates } = await req.json()

    if (!barbeariaId || !ownerId || !updates) {
      throw new Error('Parâmetros obrigatórios ausentes: barbeariaId, ownerId ou updates.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. OWNERSHIP CHECK
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      if (userRole !== 'barbearia' || user.id !== ownerId) {
        return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
      }
      const { data: ownerBarbearia, error: ownerError } = await supabaseAdmin
        .from('barbearias')
        .select('id')
        .eq('id', barbeariaId)
        .eq('dono_id', user.id)
        .single();
      if (ownerError || !ownerBarbearia) {
        return new Response(JSON.stringify({ error: 'Você não tem permissão para editar esta barbearia.' }), { status: 403, headers: corsHeaders });
      }
    }

    // 4. EXECUTION
    const { dono_email, ...dbUpdates } = updates;

    if (dono_email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        ownerId,
        { email: dono_email }
      )
      if (authError) {
        console.error('Erro ao atualizar e-mail do usuário:', authError);
        throw new Error(`Falha ao atualizar o e-mail do proprietário: ${authError.message}`);
      }
      dbUpdates.dono_email = dono_email;
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('barbearias')
      .update(dbUpdates)
      .eq('id', barbeariaId)
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro ao atualizar barbearia:', dbError);
      throw new Error(`Falha ao atualizar detalhes da barbearia: ${dbError.message}`);
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