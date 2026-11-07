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
    // 1. AUTHENTICATION & AUTHORIZATION
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), { status: 401, headers: corsHeaders });
    }
    if (user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json()
    const estabelecimentoId = body.estabelecimentoId || body.barbeariaId
    const { ownerId } = body

    if (!estabelecimentoId || !ownerId) {
      throw new Error('Parâmetros obrigatórios ausentes: estabelecimentoId ou ownerId.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabaseAdmin
      .from('estabelecimentos')
      .delete()
      .eq('id', estabelecimentoId);

    if (dbError) {
      console.error('Erro ao excluir estabelecimento do BD:', dbError);
      throw new Error(`Falha ao excluir estabelecimento: ${dbError.message}`);
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(ownerId);

    if (authError) {
      throw new Error(`Registro do estabelecimento excluído, mas falha ao excluir a conta do proprietário: ${authError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
