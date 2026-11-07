-- ==============================================================================
-- 0003_seed_data.sql
-- Marcadô SaaS - Dados Iniciais (Seed)
-- ==============================================================================

-- 1. CONFIGURAÇÕES GLOBAIS
INSERT INTO public.system_settings (id, system_name, support_email, contact_email, tos_link, logo_url)
VALUES (
  1,
  'Marcadô',
  'suporte@marcado.app',
  'contato@marcado.app',
  '/termos-de-uso',
  '/landing/images/logo.png'
)
ON CONFLICT (id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  support_email = EXCLUDED.support_email,
  contact_email = EXCLUDED.contact_email;

-- 2. PLANOS DE ASSINATURA
INSERT INTO public.planos (nome, preco, features, ativo, popular, limite_profissionais)
VALUES
  (
    'Básico',
    47.00,
    ARRAY[
      'Até 2 profissionais cadastrados',
      'Agendamentos online ilimitados',
      'Página exclusiva de agendamento',
      'Controle financeiro diário e mensal',
      'Notificações no WhatsApp (manual)'
    ],
    true,
    false,
    2
  ),
  (
    'Profissional',
    97.00,
    ARRAY[
      'Profissionais ilimitados',
      'Acesso individual ao painel para profissionais',
      'Gestão de comissões por categoria de cargo',
      'Relatórios detalhados de desempenho de 30 dias',
      'Página exclusiva e personalizada com sua marca',
      'Suporte prioritário via WhatsApp'
    ],
    true,
    true,
    NULL -- Ilimitado
  ),
  (
    'Trial',
    0.00,
    ARRAY[
      'Período de teste gratuito por 7 dias',
      'Até 2 profissionais',
      'Agendamentos online'
    ],
    false, -- Não exibido na landing, usado para onboarding temporário
    false,
    2
  )
ON CONFLICT (nome) DO UPDATE SET
  preco = EXCLUDED.preco,
  features = EXCLUDED.features,
  ativo = EXCLUDED.ativo,
  popular = EXCLUDED.popular,
  limite_profissionais = EXCLUDED.limite_profissionais;

