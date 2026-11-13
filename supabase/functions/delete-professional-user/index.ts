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
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), { status: 401, headers: corsHeaders });
    }
    const role = user.app_metadata?.role;
    if (role !== 'estabelecimento' && role !== 'barbearia') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
    }

    // 2. LOGIC
    const body = await req.json();
    const profissionalId = body.profissionalId || body.barberId;

    if (!profissionalId) {
      throw new Error('O ID do profissional é obrigatório.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. OWNERSHIP CHECK
    const { data: ownerEstabelecimento } = await supabaseAdmin
      .from('estabelecimentos')
      .select('id, status')
      .eq('dono_id', user.id)
      .single();

    const { data: profRecord } = await supabaseAdmin
      .from('profissionais')
      .select('estabelecimento_id, user_id')
      .eq('id', profissionalId)
      .single();

    if (!profRecord || !ownerEstabelecimento || profRecord.estabelecimento_id !== ownerEstabelecimento.id) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para excluir este profissional.' }), { status: 403, headers: corsHeaders });
    }
    if (ownerEstabelecimento.status !== 'ativa') {
      return new Response(JSON.stringify({ error: 'Estabelecimento suspenso.' }), { status: 403, headers: corsHeaders });
    }

    // 4. EXECUTION
    const { error: dbError } = await supabaseAdmin
      .from('profissionais')
      .delete()
      .eq('id', profissionalId);

    if (dbError) {
      throw new Error(`Falha ao excluir profissional: ${dbError.message}`);
    }

    // usa o user_id gravado no banco, nunca o que veio do navegador
    if (profRecord.user_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profRecord.user_id);
      if (authError) {
        console.error(`Registro do profissional excluído, mas falha ao excluir a conta do usuário: ${authError.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});