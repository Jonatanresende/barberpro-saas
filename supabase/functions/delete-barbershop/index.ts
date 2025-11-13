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
    const { barbeariaId, ownerId } = await req.json()

    if (!barbeariaId || !ownerId) {
      throw new Error('Parâmetros obrigatórios ausentes: barbeariaId ou ownerId.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Exclui o registro da barbearia do banco de dados.
    const { error: dbError } = await supabaseAdmin
      .from('barbearias')
      .delete()
      .eq('id', barbeariaId);

    if (dbError) {
      console.error('Erro ao excluir barbearia do BD:', dbError);
      throw new Error(`Falha ao excluir barbearia: ${dbError.message}`);
    }

    // 2. Exclui a conta de usuário do proprietário do Supabase Auth.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(ownerId);

    if (authError) {
      // Lança um erro para o admin saber que a conta do usuário não foi excluída.
      throw new Error(`Registro da barbearia excluído, mas falha ao excluir a conta do proprietário: ${authError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})