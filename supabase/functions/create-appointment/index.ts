import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const normalizarTelefone = (t: string) => {
  const d = (t || '').replace(/\D/g, '');
  return d.length === 10 || d.length === 11 ? '55' + d : d;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agendamentoData } = await req.json();
    const { cliente_nome, cliente_telefone } = agendamentoData || {};

    if (!cliente_nome || !cliente_telefone) {
      throw new Error('Nome e telefone do cliente são obrigatórios.');
    }

    const estId = agendamentoData.estabelecimento_id || agendamentoData.barbearia_id;
    const profId = agendamentoData.profissional_id || agendamentoData.barbeiro_id;
    const servicoId = agendamentoData.servico_id;

    if (!estId) {
      throw new Error('O ID do estabelecimento é obrigatório.');
    }

    const telNormalizado = normalizarTelefone(cliente_telefone);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validação: profissional e serviço devem pertencer ao mesmo estabelecimento
    if (profId) {
      const { data: profCheck } = await supabaseAdmin
        .from('profissionais')
        .select('id, estabelecimento_id')
        .eq('id', profId)
        .maybeSingle();

      if (profCheck && profCheck.estabelecimento_id !== estId) {
        return new Response(JSON.stringify({ error: 'O profissional selecionado não pertence a este estabelecimento.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (servicoId) {
      const { data: servCheck } = await supabaseAdmin
        .from('servicos')
        .select('id, estabelecimento_id, preco, duracao')
        .eq('id', servicoId)
        .maybeSingle();

      if (servCheck && servCheck.estabelecimento_id !== estId) {
        return new Response(JSON.stringify({ error: 'O serviço selecionado não pertence a este estabelecimento.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // --- ETAPA 1: Encontrar ou Criar o Cliente por estabelecimento ---
    let { data: client, error: findError } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('estabelecimento_id', estId)
      .eq('telefone', telNormalizado)
      .maybeSingle();

    if (findError) throw findError;

    if (!client) {
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clientes')
        .insert({
          estabelecimento_id: estId,
          nome: cliente_nome,
          telefone: telNormalizado,
        })
        .select('id')
        .single();
      if (createError) throw createError;
      client = newClient;
    }

    // --- ETAPA 2: Criar o Agendamento (apenas colunas da tabela) ---
    const profNome = agendamentoData.profissional_nome || agendamentoData.barbeiro_nome;

    const finalAgendamentoData = {
      estabelecimento_id: estId,
      cliente_id: client.id,
      cliente_nome,
      cliente_email: agendamentoData.cliente_email || null,
      cliente_telefone: telNormalizado,
      profissional_id: profId,
      profissional_nome: profNome || null,
      servico_id: servicoId,
      servico_nome: agendamentoData.servico_nome,
      data: agendamentoData.data,
      hora: agendamentoData.hora,
      status: 'pendente', // nunca confiar no status vindo do navegador
    };

    const { data: newAppointment, error: appointmentError } = await supabaseAdmin
      .from('agendamentos')
      .insert(finalAgendamentoData)
      .select('*')
      .single();

    if (appointmentError) {
      // 23P01 = exclusion_violation (conflito de horário)
      if (appointmentError.code === '23P01') {
        return new Response(JSON.stringify({ error: 'Este horário acabou de ser ocupado. Por favor, escolha outro horário.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }
      throw appointmentError;
    }

    if (!newAppointment.data || !newAppointment.hora) {
        throw new Error("Falha interna: Agendamento criado, mas data/hora ausentes no retorno.");
    }

    return new Response(JSON.stringify(newAppointment), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
