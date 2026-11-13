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
    const userRole = user.app_metadata?.role;
    if (userRole !== 'estabelecimento' && userRole !== 'barbearia') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json()
    const profissionalData = body.profissionalData || body.barberData
    const { password, photoUrl } = body

    const estId = profissionalData?.estabelecimento_id || profissionalData?.barbearia_id;

    if (!profissionalData?.email || !password || !estId) {
      throw new Error('Dados essenciais (e-mail, senha, ID do estabelecimento) estão faltando.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. OWNERSHIP CHECK
    const { data: ownerEstabelecimento, error: ownerError } = await supabaseAdmin
      .from('estabelecimentos')
      .select('id, plano, status')
      .eq('dono_id', user.id)
      .single();

    if (ownerError || !ownerEstabelecimento) {
      return new Response(JSON.stringify({ error: 'Estabelecimento do proprietário não encontrado.' }), { status: 403, headers: corsHeaders });
    }
    if (ownerEstabelecimento.status !== 'ativa') {
      return new Response(JSON.stringify({ error: 'Estabelecimento suspenso.' }), { status: 403, headers: corsHeaders });
    }
    if (ownerEstabelecimento.id !== estId) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para adicionar profissionais a este estabelecimento.' }), { status: 403, headers: corsHeaders });
    }

    // --- VALIDAÇÃO DO LIMITE DE PROFISSIONAIS ---
    const { data: plano, error: planoError } = await supabaseAdmin
      .from('planos')
      .select('limite_profissionais')
      .eq('nome', ownerEstabelecimento.plano)
      .single();

    if (planoError) throw new Error(`Plano "${ownerEstabelecimento.plano}" não encontrado: ${planoError.message}`);

    const limit = plano?.limite_profissionais;

    if (limit !== null && limit !== undefined) {
      const { count, error: countError } = await supabaseAdmin
        .from('profissionais')
        .select('*', { count: 'exact', head: true })
        .eq('estabelecimento_id', estId)
        .eq('ativo', true);

      if (countError) throw new Error(`Erro ao contar profissionais: ${countError.message}`);

      if (count !== null && count >= limit) {
        return new Response(JSON.stringify({ error: 'Você atingiu o limite de profissionais do seu plano. Faça um upgrade para adicionar mais.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }
    // --- FIM DA VALIDAÇÃO ---

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: profissionalData.email,
      password: password,
      email_confirm: true,
      app_metadata: {
        role: 'profissional',
      },
      user_metadata: {
        full_name: profissionalData.nome,
      },
    })

    if (authError) {
      console.error('Erro na criação do usuário do profissional:', authError.message)
      const errorMessage = authError.message.includes('unique constraint')
        ? 'Este e-mail já está em uso.'
        : `Falha ao criar usuário: ${authError.message}`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (!authData.user) throw new Error('Criação do usuário do profissional falhou silenciosamente.');
    const userId = authData.user.id;

    // Normalização dos campos para o insert no banco
    const dbPayload = {
      ...profissionalData,
      estabelecimento_id: estId,
      user_id: userId,
      foto_url: photoUrl,
    };
    delete dbPayload.barbearia_id;

    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('profissionais')
      .insert([dbPayload])
      .select()
      .single();

    if (dbError) {
      console.error('Erro de banco de dados ao criar profissional:', dbError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: `Falha ao criar profissional no banco de dados: ${dbError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify(dbData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
