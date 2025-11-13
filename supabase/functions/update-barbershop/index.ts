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
    const { barbeariaId, ownerId, updates } = await req.json()

    if (!barbeariaId || !ownerId || !updates) {
      throw new Error('Parâmetros obrigatórios ausentes: barbeariaId, ownerId ou updates.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Separa as atualizações de autenticação das de banco de dados
    const { dono_email, ...dbUpdates } = updates;

    // 1. Atualiza o e-mail do usuário no Supabase Auth se ele foi alterado
    if (dono_email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        ownerId,
        { email: dono_email }
      )
      if (authError) {
        console.error('Erro ao atualizar e-mail do usuário:', authError);
        throw new Error(`Falha ao atualizar o e-mail do proprietário: ${authError.message}`);
      }
      // Também atualiza o e-mail desnormalizado na tabela barbearias
      dbUpdates.dono_email = dono_email;
    }

    // 2. Atualiza o registro da barbearia no banco de dados
    const { data, error: dbError } = await supabaseAdmin
      .from('barbearias')
      .update(dbUpdates)
      .eq('id', barbeariaId)
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro ao atualizar barbearia:', dbError);
      throw new Error(`Falha ao atualizar detalhes da barbearia: ${dbError.message}`);
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