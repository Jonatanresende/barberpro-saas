import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Função auxiliar para gerar um link amigável (slug)
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
  // Lida com a requisição de pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { barbeariaData, password, photoUrl } = await req.json()

    // Cria um cliente Supabase com permissões de administrador (seguro para usar no backend)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Cria o usuário (dono da barbearia)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: barbeariaData.dono_email,
      password: password,
      email_confirm: true, // A CORREÇÃO PRINCIPAL: O e-mail já vem confirmado!
      user_metadata: {
        role: 'barbearia',
        full_name: barbeariaData.dono_nome,
      },
    })

    if (authError) {
      console.error('Erro de autenticação:', authError.message)
      const errorMessage = authError.message.includes('unique constraint')
        ? 'Este e-mail já está em uso.'
        : `Falha ao criar usuário: ${authError.message}`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!authData.user) {
      throw new Error('Criação do usuário falhou silenciosamente.');
    }

    // 2. Gera o link personalizado
    const slug = generateSlug(barbeariaData.nome);

    // 3. Cria o registro da barbearia no banco de dados
    const { data: barbearia, error: dbError } = await supabaseAdmin
      .from('barbearias')
      .insert([{ 
        ...barbeariaData, 
        dono_id: authData.user.id,
        foto_url: photoUrl,
        link_personalizado: slug,
      }])
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro de banco de dados:', dbError)
      // Se a criação da barbearia falhar, remove o usuário criado para não deixar lixo
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(JSON.stringify({ error: `Falha ao criar barbearia no banco de dados: ${dbError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify(barbearia), {
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