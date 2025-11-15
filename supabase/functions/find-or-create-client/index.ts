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
    const { nome, telefone } = await req.json();
    if (!nome || !telefone) {
      throw new Error('Nome e telefone são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Tenta encontrar um cliente com o mesmo telefone
    let { data: existingClient, error: findError } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('telefone', telefone)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw findError;
    }

    if (existingClient) {
      return new Response(JSON.stringify(existingClient), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Se não encontrar, cria um novo cliente
    const { data: newClient, error: createError } = await supabaseAdmin
      .from('clientes')
      .insert({ nome, telefone })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return new Response(JSON.stringify(newClient), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // 201 Created
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});