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
    const { Product, Customer } = body;

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
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- ETAPA 1: Tentar encontrar o usuário existente ---
    const { data: { user: existingUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    let userId: string;
    let barbearia: any;

    if (existingUser) {
      // --- CENÁRIO DE UPGRADE/DOWNGRADE ---
      userId = existingUser.id;
      console.log(`INFO: Usuário existente encontrado (ID: ${userId}). Atualizando plano.`);

      // 1. Buscar a barbearia associada
      const { data: existingBarbearia, error: fetchBarbeariaError } = await supabaseAdmin
        .from('barbearias')
        .select('*')
        .eq('dono_id', userId)
        .single();

      if (fetchBarbeariaError && fetchBarbeariaError.code !== 'PGRST116') {
        throw new Error(`Falha ao buscar barbearia existente: ${fetchBarbeariaError.message}`);
      }

      if (existingBarbearia) {
        // 2. Atualizar o plano da barbearia existente
        const { data: updatedBarbearia, error: updateError } = await supabaseAdmin
          .from('barbearias')
          .update({ plano: planoNome })
          .eq('id', existingBarbearia.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Falha ao atualizar plano da barbearia: ${updateError.message}`);
        }
        barbearia = updatedBarbearia;
      } else {
        // Se o usuário existe, mas a barbearia não (caso raro), criamos a barbearia
        console.warn("WARN: Usuário existe, mas barbearia não. Criando novo registro de barbearia.");
        const nomeBarbearia = `Barbearia de ${nomeCompleto}`;
        const slugBase = generateSlug(nomeBarbearia);
        const slug = `${slugBase}-${userId.substring(0, 8)}`;

        const { data: newBarbearia, error: dbError } = await supabaseAdmin
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
        
        if (dbError) throw new Error(`Falha ao criar barbearia no banco de dados: ${dbError.message}`);
        barbearia = newBarbearia;
      }

    } else {
      // --- CENÁRIO DE PRIMEIRA COMPRA (Criação de Novo Usuário) ---
      if (getUserError && getUserError.status !== 404) throw getUserError;

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
      userId = createUserData.user.id;

      // GERAÇÃO DE NOME TEMPORÁRIO
      const nomeBarbearia = `Barbearia de ${nomeCompleto}`;
      const slugBase = generateSlug(nomeBarbearia);
      const slug = `${slugBase}-${userId.substring(0, 8)}`;

      const { data: newBarbearia, error: dbError } = await supabaseAdmin
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
      barbearia = newBarbearia;
    }

    return new Response(JSON.stringify({ success: true, barbearia }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro no webhook de pagamento:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});