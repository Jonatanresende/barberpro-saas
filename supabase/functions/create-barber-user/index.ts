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
    const { barberData, password, photoUrl } = await req.json()

    if (!barberData.email || !password || !barberData.barbearia_id) {
        throw new Error('Dados essenciais (e-mail, senha, ID da barbearia) estão faltando.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. OWNERSHIP CHECK
    const { data: ownerBarbearia, error: ownerError } = await supabaseAdmin
      .from('barbearias')
      .select('id, plano')
      .eq('dono_id', user.id)
      .single();

    if (ownerError || !ownerBarbearia) {
        return new Response(JSON.stringify({ error: 'Barbearia do proprietário não encontrada.' }), { status: 403, headers: corsHeaders });
    }
    if (ownerBarbearia.id !== barberData.barbearia_id) {
        return new Response(JSON.stringify({ error: 'Você não tem permissão para adicionar barbeiros a esta barbearia.' }), { status: 403, headers: corsHeaders });
    }

    // --- VALIDAÇÃO DO LIMITE DE BARBEIROS ---
    const { data: plano, error: planoError } = await supabaseAdmin
      .from('planos')
      .select('limite_barbeiros')
      .eq('nome', ownerBarbearia.plano)
      .single();

    if (planoError) throw new Error(`Plano "${ownerBarbearia.plano}" não encontrado: ${planoError.message}`);

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