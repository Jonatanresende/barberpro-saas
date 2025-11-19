import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fullName, barbershopName, email, password, phone } = body ?? {};

    if (!fullName || !barbershopName || !email || !password || !phone) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios ausentes.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const trialDurationDays = Number(Deno.env.get('TRIAL_DURATION_DAYS') ?? 7);
    const trialStartedAt = new Date();
    const trialExpiresAt = new Date(trialStartedAt);
    trialExpiresAt.setDate(trialStartedAt.getDate() + trialDurationDays);

    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        role: 'barbearia',
        full_name: fullName,
        phone,
        trial_started_at: trialStartedAt.toISOString(),
        trial_expires_at: trialExpiresAt.toISOString(),
      },
    });

    if (createUserError) {
      console.error('Erro ao criar usuário trial:', createUserError);
      const message = createUserError.message.includes('unique constraint')
        ? 'Este e-mail já está em uso.'
        : createUserError.message;
      return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!createUserData.user) {
      throw new Error('Falha ao criar usuário trial.');
    }

    const userId = createUserData.user.id;
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (confirmError) {
      console.error('Erro ao confirmar usuário trial:', confirmError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: 'Não foi possível confirmar o e-mail do usuário.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const slug = generateSlug(barbershopName);
    const { data: barbearia, error: barbeariaError } = await supabaseAdmin
      .from('barbearias')
      .insert([{
        nome: barbershopName,
        plano: 'trial',
        dono_id: userId,
        dono_nome: fullName,
        dono_email: email,
        telefone: phone,
        link_personalizado: slug,
        status: 'ativa',
        trial_started_at: trialStartedAt.toISOString(),
        trial_expires_at: trialExpiresAt.toISOString(),
      }])
      .select()
      .single();

    if (barbeariaError) {
      console.error('Erro ao criar barbearia trial:', barbeariaError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: 'Não foi possível salvar os dados da barbearia.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      barbearia,
      trial_started_at: trialStartedAt.toISOString(),
      trial_expires_at: trialExpiresAt.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro inesperado start-trial-signup:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});