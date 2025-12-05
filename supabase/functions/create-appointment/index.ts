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
    const { agendamentoData } = await req.json();
    const { cliente_nome, cliente_telefone } = agendamentoData;

    if (!cliente_nome || !cliente_telefone) {
      throw new Error('Nome e telefone do cliente são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- ETAPA 1: Encontrar ou Criar o Cliente ---
    let { data: client, error: findError } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('telefone', cliente_telefone)
      .single();

    if (findError && findError.code !== 'PGRST116') throw findError;

    if (!client) {
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clientes')
        .insert({ nome: cliente_nome, telefone: cliente_telefone })
        .select('id')
        .single();
      if (createError) throw createError;
      client = newClient;
    }

    // --- ETAPA 2: Criar o Agendamento ---
    const finalAgendamentoData = {
      ...agendamentoData,
      cliente_id: client.id,
    };

    // Selecionamos explicitamente todos os campos necessários para o frontend
    const { data: newAppointment, error: appointmentError } = await supabaseAdmin
      .from('agendamentos')
      .insert(finalAgendamentoData)
      .select('id, barbeiro_nome, servico_nome, data, hora, barbearia_id')
      .single();

    if (appointmentError) {
      throw appointmentError;
    }

    // O frontend espera o objeto completo, incluindo data e hora
    if (!newAppointment.data || !newAppointment.hora) {
        throw new Error("Falha interna: Agendamento criado, mas data/hora ausentes no retorno.");
    }

    return new Response(JSON.stringify(newAppointment), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});