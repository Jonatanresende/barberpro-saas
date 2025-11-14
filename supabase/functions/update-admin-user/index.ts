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
    const { userId, email, fullName } = await req.json();
    if (!userId || !email || !fullName) {
      throw new Error('userId, email e fullName são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Camada de segurança: Busca o usuário alvo para verificar o e-mail
    const { data: { user: targetUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError) throw getUserError;

    // Impede a alteração se for o admin principal
    if (targetUser && targetUser.email === 'jonne.obr@gmail.com') {
      throw new Error('A conta de administrador principal não pode ser modificada por esta função.');
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: email,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data.user), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});