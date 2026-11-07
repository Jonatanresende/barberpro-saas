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
    const body = await req.json();
    const { appointmentId, telefone } = body;
    const estId = body.estabelecimento_id || body.barbearia_id;

    if (!appointmentId || !telefone) {
      throw new Error('ID do agendamento e telefone são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Encontra o cliente pelo telefone (e estabelecimento se fornecido)
    let clientQuery = supabaseAdmin.from('clientes').select('id').eq('telefone', telefone);
    if (estId) {
      clientQuery = clientQuery.eq('estabelecimento_id', estId);
    }
    const { data: client, error: clientError } = await clientQuery.maybeSingle();

    if (clientError || !client) {
      throw new Error('Cliente não encontrado.');
    }

    // 2. Atualiza o agendamento para 'cancelado' garantindo que pertence ao cliente
    let updateQuery = supabaseAdmin
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', appointmentId)
      .eq('cliente_id', client.id);

    if (estId) {
      updateQuery = updateQuery.eq('estabelecimento_id', estId);
    }

    const { data, error } = await updateQuery.select().single();

    if (error || !data) {
      throw new Error('Não foi possível cancelar o agendamento. Verifique se os dados estão corretos.');
    }

    return new Response(JSON.stringify({ success: true, appointment: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
