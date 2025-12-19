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
    const requestBodyText = await req.text();
    console.log("--- INÍCIO DO PAYLOAD DO WEBHOOK DE STATUS ---");
    console.log(requestBodyText);
    console.log("--- FIM DO PAYLOAD DO WEBHOOK DE STATUS ---");
    const body = JSON.parse(requestBodyText);

    // O token deve ser o mesmo configurado na Kiwify para este webhook
    const expectedToken = 'mnhxo6jrjll'; 
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: 'Token de autenticação inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { Customer, Status } = body;

    if (!Customer || !Status) {
      throw new Error('Estrutura do JSON inválida. Faltando ' + (!Customer ? '"Customer"' : '"Status"'));
    }

    const email = Customer.email;
    const status = Status.status; // Ex: 'canceled', 'delayed', 'paid'

    if (!email || !status) {
      throw new Error('Dados obrigatórios (email ou status) ausentes no payload.');
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Encontrar o usuário pelo e-mail
    const { data: { user: existingUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (getUserError || !existingUser) {
        console.warn(`WARN: Usuário não encontrado para o e-mail: ${email}`);
        return new Response(JSON.stringify({ success: false, message: 'Usuário não encontrado.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    const userId = existingUser.id;
    let newBarbershopStatus: 'ativa' | 'inativa';
    let logMessage: string;

    switch (status) {
        case 'canceled':
        case 'delayed':
        case 'refunded':
            newBarbershopStatus = 'inativa';
            logMessage = `Plano do usuário ${email} foi ${status}. Status da barbearia definido para INATIVA.`;
            break;
        case 'paid':
        case 'approved':
            newBarbershopStatus = 'ativa';
            logMessage = `Pagamento do usuário ${email} foi ${status}. Status da barbearia definido para ATIVA.`;
            break;
        default:
            logMessage = `Status Kiwify desconhecido: ${status}. Nenhuma ação tomada.`;
            return new Response(JSON.stringify({ success: true, message: logMessage }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
    }

    // 2. Atualizar o status da barbearia
    const { data: updatedBarbearia, error: updateError } = await supabaseAdmin
        .from('barbearias')
        .update({ status: newBarbershopStatus })
        .eq('dono_id', userId)
        .select()
        .single();

    if (updateError) {
        throw new Error(`Falha ao atualizar status da barbearia: ${updateError.message}`);
    }

    console.log(`SUCCESS: ${logMessage}`);

    return new Response(JSON.stringify({ success: true, barbearia: updatedBarbearia }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro no webhook de status de pagamento:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});