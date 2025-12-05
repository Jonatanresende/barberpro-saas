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
    const { telefone } = await req.json();
    if (!telefone) throw new Error('Telefone é obrigatório.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Encontra o cliente pelo telefone
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome')
      .eq('telefone', telefone)
      .single();

    if (clientError && clientError.code !== 'PGRST116') throw clientError;
    
    if (!client) {
      // Cliente não existe, retorna null
      return new Response(JSON.stringify(null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Busca todos os agendamentos do cliente
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('agendamentos')
      .select('*')
      .eq('cliente_id', client.id)
      .order('data', { ascending: false })
      .order('hora', { ascending: false });

    if (appointmentsError) throw appointmentsError;

    return new Response(JSON.stringify({ clientName: client.nome, appointments }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro ao buscar histórico do cliente:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});