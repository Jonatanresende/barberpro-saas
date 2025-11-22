import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  // Lida com a requisição de pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- CAMADA DE SEGURANÇA ---
    // Verifica se o segredo do webhook foi enviado no cabeçalho
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const authHeader = req.headers.get('Authorization');
    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // --- PROCESSAMENTO DOS DADOS ---
    // A estrutura de dados pode ser ajustada quando você me enviar o formato final
    const { 
      email, 
      documento, 
      nomeCompleto, 
      nomeBarbearia, 
      planoNome, 
      telefone 
    } = await req.json();

    if (!email || !documento || !nomeCompleto || !nomeBarbearia || !planoNome) {
      throw new Error('Dados obrigatórios ausentes no corpo da requisição.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Cria o usuário no Supabase Auth
    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: documento, // Senha temporária
      email_confirm: true, // E-mail já confirmado pelo pagamento
      user_metadata: {
        role: 'barbearia',
        full_name: nomeCompleto,
        phone: telefone,
      },
    });

    if (createUserError) {
      const message = createUserError.message.includes('unique constraint')
        ? 'Este e-mail já está em uso.'
        : `Falha ao criar usuário: ${createUserError.message}`;
      throw new Error(message);
    }
    if (!createUserData.user) throw new Error('Criação do usuário falhou silenciosamente.');
    const userId = createUserData.user.id;

    // 2. Cria o registro da barbearia no banco de dados
    const slug = generateSlug(nomeBarbearia);
    const { data: barbearia, error: dbError } = await supabaseAdmin
      .from('barbearias')
      .insert([{ 
        nome: nomeBarbearia,
        plano: planoNome,
        dono_id: userId,
        dono_nome: nomeCompleto,
        dono_email: email,
        telefone: telefone,
        documento: documento,
        link_personalizado: slug,
        status: 'ativa',
      }])
      .select()
      .single();
      
    if (dbError) {
      // Limpeza: se a criação da barbearia falhar, exclui o usuário para evitar inconsistência.
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Falha ao criar barbearia no banco de dados: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ success: true, barbearia }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro no webhook de criação de usuário:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Erro de cliente (dados inválidos, etc.)
    });
  }
});