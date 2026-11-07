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

    // 2. LOGIC
    const body = await req.json()
    const estabelecimentoId = body.estabelecimentoId || body.barbeariaId
    const { ownerId, updates } = body

    if (!estabelecimentoId || !ownerId || !updates) {
      throw new Error('Parâmetros obrigatórios ausentes: estabelecimentoId, ownerId ou updates.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. OWNERSHIP CHECK
    const userRole = user.app_metadata?.role;
    if (userRole !== 'admin') {
      if (userRole !== 'estabelecimento' || user.id !== ownerId) {
        return new Response(JSON.stringify({ error: 'Acesso proibido.' }), { status: 403, headers: corsHeaders });
      }
      const { data: ownerEstabelecimento, error: ownerError } = await supabaseAdmin
        .from('estabelecimentos')
        .select('id')
        .eq('id', estabelecimentoId)
        .eq('dono_id', user.id)
        .single();
      if (ownerError || !ownerEstabelecimento) {
        return new Response(JSON.stringify({ error: 'Você não tem permissão para editar este estabelecimento.' }), { status: 403, headers: corsHeaders });
      }
    }

    // 4. EXECUTION
    const { dono_email, ...rawDbUpdates } = updates;
    let dbUpdates: Record<string, any> = { ...rawDbUpdates };

    // Se não for admin, o dono só pode alterar campos permitidos
    // plano, status, trial_* e dono_id ficam só para admin e webhook
    if (userRole !== 'admin') {
      const allowedOwnerFields = [
        'nome',
        'endereco',
        'documento',
        'telefone',
        'link_personalizado',
        'dono_nome',
        'nicho',
        'foto_url',
        'instagram_url',
        'whatsapp_url',
        'hero_image_url',
        'hero_title',
        'hero_subtitle',
        'services_title',
        'social_title',
        'social_subtitle',
        'operating_days',
        'start_time',
        'end_time',
        'comissao_padrao',
      ];

      const filteredUpdates: Record<string, any> = {};
      for (const field of allowedOwnerFields) {
        if (field in dbUpdates) {
          filteredUpdates[field] = dbUpdates[field];
        }
      }
      dbUpdates = filteredUpdates;
    }

    if (dono_email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        ownerId,
        { email: dono_email }
      )
      if (authError) {
        console.error('Erro ao atualizar e-mail do usuário:', authError);
        throw new Error(`Falha ao atualizar o e-mail do proprietário: ${authError.message}`);
      }
      dbUpdates.dono_email = dono_email;
    }

    if (dbUpdates.dono_nome) {
        const { error: authNameError } = await supabaseAdmin.auth.admin.updateUserById(
            ownerId,
            { user_metadata: { full_name: dbUpdates.dono_nome } }
        );
        if (authNameError) {
            console.error('Erro ao atualizar nome do usuário no Auth:', authNameError);
        }
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('estabelecimentos')
      .update(dbUpdates)
      .eq('id', estabelecimentoId)
      .select()
      .single();
      
    if (dbError) {
      console.error('Erro ao atualizar estabelecimento:', dbError);
      throw new Error(`Falha ao atualizar detalhes do estabelecimento: ${dbError.message}`);
    }

    return new Response(JSON.stringify(data), {
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
