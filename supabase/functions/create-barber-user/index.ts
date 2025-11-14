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
    const { barberData, password, photoUrl } = await req.json()

    if (!barberData.email || !password) {
        throw new Error('E-mail e senha são obrigatórios para criar um barbeiro.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: barberData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'barbeiro',
        full_name: barberData.nome,
      },
    })

    if (authError) {
      console.error('Erro na criação do usuário do barbeiro:', authError.message)
      const errorMessage = authError.message.includes('unique constraint')
        ? 'Este e-mail já está em uso.'
        : `Falha ao criar usuário: ${authError.message}`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (!authData.user) throw new Error('Criação do usuário do barbeiro falhou silenciosamente.');
    const userId = authData.user.id;

    // 2. Create the barber record in the database
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('barbeiros')
      .insert([{ 
        ...barberData, 
        user_id: userId,
        foto_url: photoUrl,
      }])
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro de banco de dados ao criar barbeiro:', dbError)
      // Cleanup: if creating the barber record fails, delete the auth user.
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: `Falha ao criar barbeiro no banco de dados: ${dbError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify(dbData), {
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