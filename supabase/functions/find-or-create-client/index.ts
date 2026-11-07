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
    const { nome, telefone } = body;
    const estabelecimento_id = body.estabelecimento_id || body.barbearia_id;

    if (!nome || !telefone) {
      throw new Error('Nome e telefone são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabaseAdmin.from('clientes').select('*').eq('telefone', telefone);
    if (estabelecimento_id) {
      query = query.eq('estabelecimento_id', estabelecimento_id);
    }
    const { data: existingClient, error: findError } = await query.maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existingClient) {
      return new Response(JSON.stringify(existingClient), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const insertPayload: any = { nome, telefone };
    if (estabelecimento_id) {
      insertPayload.estabelecimento_id = estabelecimento_id;
    }

    const { data: newClient, error: createError } = await supabaseAdmin
      .from('clientes')
      .insert(insertPayload)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return new Response(JSON.stringify(newClient), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
