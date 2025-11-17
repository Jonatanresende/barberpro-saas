import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("INFO: Executando a função keep-alive do Supabase...");

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Consulta leve para manter o banco de dados ativo.
    const { error } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log("SUCCESS: A consulta keep-alive foi bem-sucedida.");

    return new Response(JSON.stringify({ success: true, message: "Instância do Supabase mantida ativa." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(`ERROR: Falha na função keep-alive: ${error.message}`);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});