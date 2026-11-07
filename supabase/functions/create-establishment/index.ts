import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

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
    const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), { status: 401, headers: corsHeaders });
    }
    if (authUser.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json()
    const estabelecimentoData = body.estabelecimentoData || body.barbeariaData
    const { password, photoUrl } = body

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: estabelecimentoData.dono_email,
      password: password,
      app_metadata: {
        role: 'estabelecimento',
      },
      user_metadata: {
        full_name: estabelecimentoData.dono_nome,
      },
    })

    if (createError) {
      console.error('Erro na criação do usuário:', createError.message)
      const errorMessage = createError.message.includes('unique constraint')
        ? 'Este e-mail já está em uso.'
        : `Falha ao criar usuário: ${createError.message}`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (!createData.user) throw new Error('Criação do usuário falhou silenciosamente.');
    const userId = createData.user.id;

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    )

    if (updateError) {
        console.error('Erro ao confirmar e-mail do usuário:', updateError.message);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ error: `Falha ao confirmar e-mail do novo usuário: ${updateError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    
    const user = updateData.user;
    const slug = generateSlug(estabelecimentoData.nome);

    const { data: estabelecimento, error: dbError } = await supabaseAdmin
      .from('estabelecimentos')
      .insert([{ 
        ...estabelecimentoData, 
        dono_id: user.id,
        foto_url: photoUrl,
        link_personalizado: slug,
      }])
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro de banco de dados:', dbError)
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return new Response(JSON.stringify({ error: `Falha ao criar estabelecimento no banco de dados: ${dbError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify(estabelecimento), {
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
