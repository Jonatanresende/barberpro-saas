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
    const { email, password, fullName } = await req.json();
    if (!email || !password || !fullName) {
      throw new Error('E-mail, senha e nome completo são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Já confirma o e-mail
      user_metadata: {
        role: 'admin', // Atribui a permissão de administrador
        full_name: fullName,
      },
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