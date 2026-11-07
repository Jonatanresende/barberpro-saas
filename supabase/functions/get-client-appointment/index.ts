import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getTodayISOInFortaleza = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { telefone } = body;
    const estId = body.estabelecimento_id || body.barbearia_id;

    if (!telefone) throw new Error('Telefone é obrigatório.');

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

    if (clientError) throw clientError;
    
    if (!client) {
      return new Response(JSON.stringify(null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Busca o próximo agendamento (não cancelado)
    const today = getTodayISOInFortaleza();
    let appQuery = supabaseAdmin
      .from('agendamentos')
      .select('*')
      .eq('cliente_id', client.id)
      .gte('data', today)
      .not('status', 'eq', 'cancelado');

    if (estId) {
      appQuery = appQuery.eq('estabelecimento_id', estId);
    }

    const { data: appointment, error: appointmentError } = await appQuery
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (appointmentError) throw appointmentError;

    return new Response(JSON.stringify(appointment || null), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Erro ao buscar agendamento do cliente:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
