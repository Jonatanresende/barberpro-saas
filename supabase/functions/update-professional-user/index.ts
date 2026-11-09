import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  let newlyCreatedUserId: string | null = null;
  let supabaseAdmin: any = null;

  try {
    // 1. AUTHENTICATION & AUTHORIZATION
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const role = user.app_metadata?.role;
    if (role !== 'estabelecimento' && role !== 'barbearia') {
      return new Response(JSON.stringify({ error: 'Acesso proibido.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. PARSE BODY
    const body = await req.json()
    const profissionalId = body.profissionalId || body.barberId
    const { updates } = body
    const password = body.password || body.senha

    if (!profissionalId || !updates) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios ausentes: profissionalId ou updates.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. OWNERSHIP CHECK
    const { data: ownerEstabelecimento, error: ownerError } = await supabaseAdmin
      .from('estabelecimentos')
      .select('id, plano')
      .eq('dono_id', user.id)
      .single();

    if (ownerError || !ownerEstabelecimento) {
      return new Response(JSON.stringify({ error: 'Estabelecimento do proprietário não encontrado.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profRecord, error: profError } = await supabaseAdmin
      .from('profissionais')
      .select('id, estabelecimento_id, user_id, email, nome')
      .eq('id', profissionalId)
      .single();

    if (profError || !profRecord || profRecord.estabelecimento_id !== ownerEstabelecimento.id) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para editar este profissional.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. VERIFICA SE O PLANO LIBERA ACESSO AO PAINEL
    let planoPermiteAcesso = false;
    if (ownerEstabelecimento.plano) {
      if (ownerEstabelecimento.plano.toLowerCase() === 'profissional') {
        planoPermiteAcesso = true;
      } else {
        const { data: planoRow } = await supabaseAdmin
          .from('planos')
          .select('features')
          .ilike('nome', ownerEstabelecimento.plano)
          .maybeSingle();

        if (planoRow?.features) {
          planoPermiteAcesso = planoRow.features.some((f: string) =>
            f.toLowerCase().includes('acesso individual ao painel') ||
            f.toLowerCase().includes('painel para profissionais')
          );
        }
      }
    }

    const currentUserId = profRecord.user_id || null;

    // 5. GESTÃO DE ACESSO / AUTENTICAÇÃO
    if (currentUserId) {
      // CAMINHO 1: Se existe userId e veio senha, incluí-la no updateUserById (mínimo de 6 caracteres)
      const authUpdates: { email?: string; password?: string; user_metadata?: { full_name: string } } = {};
      if (updates.email) {
        authUpdates.email = updates.email;
      }
      if (updates.nome) {
        authUpdates.user_metadata = { full_name: updates.nome };
      }

      if (password) {
        if (!planoPermiteAcesso) {
          return new Response(JSON.stringify({
            error: 'O plano atual não permite gerenciar senhas ou acesso ao painel de profissionais. Faça upgrade para o Plano Profissional.',
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (typeof password !== 'string' || password.length < 6) {
          return new Response(JSON.stringify({ error: 'A senha deve ter no mínimo 6 caracteres.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        authUpdates.password = password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          currentUserId,
          authUpdates
        );
        if (authError) {
          console.error('Falha ao atualizar os dados do usuário no Auth:', authError.message);
          const msg = authError.message.includes('unique constraint') || authError.message.includes('already registered')
            ? 'Este e-mail já está em uso.'
            : `Falha ao atualizar dados de autenticação: ${authError.message}`;
          return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } else {
      // CAMINHO 2: Se não existe userId e vieram e-mail e senha, criar o usuário
      const emailToUse = updates.email || profRecord.email;
      if (password) {
        if (!planoPermiteAcesso) {
          return new Response(JSON.stringify({
            error: 'O plano atual não permite criar acesso ao painel para profissionais. Faça upgrade para o Plano Profissional.',
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!emailToUse) {
          return new Response(JSON.stringify({ error: 'E-mail é obrigatório para criar o acesso ao painel.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (typeof password !== 'string' || password.length < 6) {
          return new Response(JSON.stringify({ error: 'A senha deve ter no mínimo 6 caracteres.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: emailToUse,
          password: password,
          email_confirm: true,
          app_metadata: {
            role: 'profissional',
          },
          user_metadata: {
            full_name: updates.nome || profRecord.nome || '',
          },
        });

        if (authError || !authData?.user) {
          console.error('Erro na criação do usuário do profissional:', authError?.message);
          const errorMessage = authError?.message?.includes('unique constraint') || authError?.message?.includes('already registered')
            ? 'Este e-mail já está em uso.'
            : `Falha ao criar acesso do profissional: ${authError?.message}`;
          return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        newlyCreatedUserId = authData.user.id;
      }
    }

    // 6. ATUALIZAÇÃO NO BANCO (APENAS CAMPOS PERMITIDOS + NOVO USER_ID, NUNCA GRAVAR PASSWORD)
    const allowedFields = [
      'nome',
      'email',
      'telefone',
      'especialidade',
      'foto_url',
      'ativo',
      'tipo_profissional_id',
    ] as const;

    const dbUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in updates) {
        dbUpdates[field] = updates[field];
      }
    }

    if (newlyCreatedUserId) {
      dbUpdates.user_id = newlyCreatedUserId;
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('profissionais')
      .update(dbUpdates)
      .eq('id', profissionalId)
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao atualizar profissional:', dbError);
      if (newlyCreatedUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(newlyCreatedUserId);
        } catch (cleanupErr: any) {
          console.error('Falha ao limpar usuário auth após erro no banco:', cleanupErr?.message);
        }
      }
      throw new Error(`Falha ao atualizar detalhes do profissional: ${dbError.message}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    if (newlyCreatedUserId && supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(newlyCreatedUserId);
      } catch (cleanupErr: any) {
        console.error('Falha ao limpar usuário auth no catch:', cleanupErr?.message);
      }
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
