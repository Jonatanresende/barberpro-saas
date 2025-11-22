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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBodyText = await req.text();
    console.log("--- INÍCIO DO PAYLOAD DO WEBHOOK ---");
    console.log(requestBodyText);
    console.log("--- FIM DO PAYLOAD DO WEBHOOK ---");
    const body = JSON.parse(requestBodyText);

    const expectedToken = 'mnhxo6jrjll';
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: 'Token de autenticação inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Extraindo dados da estrutura aninhada do JSON
    const { Product, Customer, nomeBarbearia } = body; // Assumindo que nomeBarbearia virá no corpo principal

    if (!Product || !Customer) {
      throw new Error('Estrutura do JSON inválida. Faltando "Product" ou "Customer".');
    }

    const email = Customer.email;
    const documento = Customer.CPF;
    const nomeCompleto = Customer.full_name;
    const planoNome = Product.product_name;
    const telefone = Customer.mobile;

    if (!email || !documento || !nomeCompleto || !planoNome) {
      throw new Error('Dados obrigatórios (email, CPF, nome, plano) ausentes no payload.');
    }
    
    if (!nomeBarbearia) {
        throw new Error('O campo "nomeBarbearia" é obrigatório e não foi encontrado no payload.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: documento, // Senha temporária
      email_confirm: true,
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
      status: 400,
    });
  }
});