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
    const { barberId, userId, updates } = await req.json()

    if (!barberId || !userId || !updates) {
      throw new Error('Parâmetros obrigatórios ausentes: barberId, userId ou updates.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Update the user in Supabase Auth if name is changed
    if (updates.nome) {
      await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { user_metadata: { full_name: updates.nome } }
      )
    }

    // 2. Update the barber record in the database
    const { data, error: dbError } = await supabaseAdmin
      .from('barbeiros')
      .update(updates)
      .eq('id', barberId)
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro ao atualizar barbeiro:', dbError);
      throw new Error(`Falha ao atualizar detalhes do barbeiro: ${dbError.message}`);
    }

    return new Response(JSON.stringify(data), {
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