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

    if (!barberData.email || !password || !barberData.barbearia_id) {
        throw new Error('Dados essenciais (e-mail, senha, ID da barbearia) estão faltando.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- VALIDAÇÃO DO LIMITE DE BARBEIROS ---
    // 1. Buscar o plano da barbearia
    const { data: barbearia, error: barbeariaError } = await supabaseAdmin
      .from('barbearias')
      .select('plano')
      .eq('id', barberData.barbearia_id)
      .single();
    
    if (barbeariaError) throw new Error(`Barbearia não encontrada: ${barbeariaError.message}`);

    // 2. Buscar os detalhes do plano
    const { data: plano, error: planoError } = await supabaseAdmin
      .from('planos')
      .select('limite_barbeiros')
      .eq('nome', barbearia.plano)
      .single();

    if (planoError) throw new Error(`Plano "${barbearia.plano}" não encontrado: ${planoError.message}`);

    // 3. Se o plano tiver um limite, verificar
    if (plano.limite_barbeiros) {
      const { count, error: countError } = await supabaseAdmin
        .from('barbeiros')
        .select('*', { count: 'exact', head: true })
        .eq('barbearia_id', barberData.barbearia_id)
        .eq('ativo', true);

      if (countError) throw new Error(`Erro ao contar barbeiros: ${countError.message}`);

      if (count !== null && count >= plano.limite_barbeiros) {
        return new Response(JSON.stringify({ error: 'Você atingiu o limite de barbeiros do seu plano. Faça um upgrade para adicionar mais.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403, // Forbidden
        });
      }
    }
    // --- FIM DA VALIDAÇÃO ---

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