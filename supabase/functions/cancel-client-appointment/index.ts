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
    const { appointmentId, telefone } = await req.json();
    if (!appointmentId || !telefone) {
      throw new Error('ID do agendamento e telefone são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Encontra o cliente pelo telefone para obter o ID
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('telefone', telefone)
      .single();

    if (clientError || !client) {
      throw new Error('Cliente não encontrado.');
    }

    // 2. Atualiza o agendamento para 'cancelado', mas APENAS se o cliente_id corresponder.
    // Esta é a camada de segurança crucial.
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', appointmentId)
      .eq('cliente_id', client.id) // Garante que o cliente só pode cancelar o seu.
      .select()
      .single();

    if (error || !data) {
      throw new Error('Não foi possível cancelar o agendamento. Verifique se os dados estão corretos.');
    }

    return new Response(JSON.stringify({ success: true, appointment: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});