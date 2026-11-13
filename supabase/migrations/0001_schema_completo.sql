-- ==============================================================================
-- MARCADÔ — Banco de dados completo (Supabase / PostgreSQL)
--
-- COMO USAR
--   1. Crie um projeto Supabase NOVO e vazio.
--   2. Abra SQL Editor > New query, cole este arquivo inteiro e clique em Run.
--   3. Rode UMA vez só (não é feito para rodar duas vezes no mesmo projeto).
--   4. Depois, siga as seções 9 (primeiro admin) e 10 (verificação) no fim do arquivo.
--
-- Este arquivo substitui supabase/migrations/0001, 0002 e 0003 (que ainda não
-- foram executadas em nenhum banco). Corrige divergências entre elas e o código.
-- ==============================================================================


-- ==============================================================================
-- 1. EXTENSÕES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;


-- ==============================================================================
-- 2. TABELAS
-- ==============================================================================

-- 2.1 Configurações globais (linha única, id = 1)
CREATE TABLE public.system_settings (
  id            INT PRIMARY KEY DEFAULT 1,
  system_name   TEXT NOT NULL DEFAULT 'Marcadô',
  support_email TEXT DEFAULT 'suporte@marcado.app',
  contact_email TEXT DEFAULT 'contato@marcado.app',
  tos_link      TEXT,
  logo_url      TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_settings CHECK (id = 1)
);

-- 2.2 Planos do SaaS
CREATE TABLE public.planos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 TEXT NOT NULL UNIQUE,
  preco                NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  features             TEXT[] DEFAULT '{}',
  ativo                BOOLEAN NOT NULL DEFAULT true,
  popular              BOOLEAN NOT NULL DEFAULT false,
  limite_profissionais INT DEFAULT NULL,           -- NULL = ilimitado
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Estabelecimentos (cada linha é um cliente do SaaS)
CREATE TABLE public.estabelecimentos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome               TEXT NOT NULL,
  dono_id            UUID UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  dono_nome          TEXT,
  dono_email         TEXT,
  nicho              TEXT NOT NULL DEFAULT 'outro'
                       CHECK (nicho IN ('barbearia', 'salao', 'estetica', 'manicure', 'outro')),
  plano              TEXT,
  link_personalizado TEXT NOT NULL UNIQUE,
  endereco           TEXT,
  documento          TEXT,
  telefone           TEXT,
  status             TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
  foto_url           TEXT,
  instagram_url      TEXT,
  whatsapp_url       TEXT,
  hero_image_url     TEXT,
  hero_title         TEXT,
  hero_subtitle      TEXT,
  services_title     TEXT DEFAULT 'Nossos Serviços',
  social_title       TEXT DEFAULT 'Siga-nos nas Redes',
  social_subtitle    TEXT,
  operating_days     INT[] DEFAULT '{1,2,3,4,5,6}',   -- 0 = domingo
  start_time         TIME DEFAULT '09:00',
  end_time           TIME DEFAULT '18:00',
  comissao_padrao    NUMERIC(5, 2) DEFAULT 0.00,
  trial_started_at   TIMESTAMPTZ,
  trial_expires_at   TIMESTAMPTZ,
  criado_em          TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Tipos de profissional (cargo + comissão)
CREATE TABLE public.tipos_profissional (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id  UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL,
  percentual_comissao NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Profissionais
CREATE TABLE public.profissionais (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL = sem login
  estabelecimento_id   UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome                 TEXT NOT NULL,
  email                TEXT,
  telefone             TEXT,
  especialidade        TEXT,
  foto_url             TEXT,
  ativo                BOOLEAN NOT NULL DEFAULT true,
  tipo_profissional_id UUID REFERENCES public.tipos_profissional(id) ON DELETE SET NULL,
  criado_em            TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Serviços
CREATE TABLE public.servicos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome               TEXT NOT NULL,
  preco              NUMERIC(10, 2) NOT NULL,
  duracao            INT NOT NULL CHECK (duracao BETWEEN 1 AND 600),  -- minutos
  imagem_url         TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Clientes (isolados por estabelecimento)
CREATE TABLE public.clientes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome               TEXT NOT NULL,
  telefone           TEXT NOT NULL,
  criado_em          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT clientes_estabelecimento_telefone_key UNIQUE (estabelecimento_id, telefone)
);

-- 2.8 Agendamentos
-- cliente_id e servico_id usam NO ACTION (padrão): protegem o histórico quando
-- alguém tenta apagar um cliente/serviço com agendamentos, mas deixam o
-- DELETE do estabelecimento apagar tudo em cascata.
CREATE TABLE public.agendamentos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  cliente_id         UUID NOT NULL REFERENCES public.clientes(id),
  cliente_nome       TEXT NOT NULL,
  cliente_email      TEXT,
  cliente_telefone   TEXT NOT NULL,
  profissional_id    UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  profissional_nome  TEXT,
  servico_id         UUID NOT NULL REFERENCES public.servicos(id),
  servico_nome       TEXT NOT NULL,
  data               DATE NOT NULL,
  hora               TIME NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pendente'
                       CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado')),
  preco_cobrado      NUMERIC(10, 2),   -- preenchido por trigger
  duracao_minutos    INT,              -- preenchido por trigger
  inicio_ts          TIMESTAMPTZ,      -- preenchido por trigger
  fim_ts             TIMESTAMPTZ,      -- preenchido por trigger
  criado_em          TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Disponibilidade / folgas
CREATE TABLE public.profissional_disponibilidade (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data            DATE NOT NULL,
  hora_inicio     TIME,
  hora_fim        TIME,
  disponivel      BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT prof_disp_unique UNIQUE (profissional_id, data)   -- exigido pelo upsert do app
);

-- 2.10 Gastos do SaaS (só admin)
CREATE TABLE public.gastos_saas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao  TEXT NOT NULL,
  valor      NUMERIC(10, 2) NOT NULL,
  data       DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 3. ÍNDICES (as chaves estrangeiras do Postgres não criam índice sozinhas)
-- ==============================================================================
CREATE INDEX idx_tipos_prof_estab        ON public.tipos_profissional (estabelecimento_id);
CREATE INDEX idx_profissionais_estab     ON public.profissionais (estabelecimento_id);
CREATE INDEX idx_servicos_estab          ON public.servicos (estabelecimento_id);
CREATE INDEX idx_clientes_estab          ON public.clientes (estabelecimento_id);
CREATE INDEX idx_agend_estab_data        ON public.agendamentos (estabelecimento_id, data);
CREATE INDEX idx_agend_prof_data         ON public.agendamentos (profissional_id, data);
CREATE INDEX idx_agend_cliente           ON public.agendamentos (cliente_id);
CREATE INDEX idx_agend_servico           ON public.agendamentos (servico_id);


-- ==============================================================================
-- 4. TRIGGERS
-- ==============================================================================

-- 4.1 Telefone do cliente em formato canônico: só dígitos, com DDI 55.
--     "(85) 99999-1111", "85999991111" e "5585999991111" viram "5585999991111".
CREATE OR REPLACE FUNCTION public.normalize_cliente_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v TEXT;
BEGIN
  v := regexp_replace(COALESCE(NEW.telefone, ''), '\D', '', 'g');
  IF length(v) IN (10, 11) THEN
    v := '55' || v;
  END IF;
  NEW.telefone := v;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_cliente_phone
BEFORE INSERT OR UPDATE OF telefone ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.normalize_cliente_phone();

-- 4.2 Agendamento: valida vínculos, grava preço/duração do momento e calcula
--     início/fim (fuso America/Fortaleza) para a restrição anti-duplo-agendamento.
CREATE OR REPLACE FUNCTION public.prepare_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_duracao INT;
  v_preco   NUMERIC(10, 2);
BEGIN
  -- Profissional, serviço e cliente precisam ser do MESMO estabelecimento.
  IF NOT EXISTS (SELECT 1 FROM public.profissionais
                 WHERE id = NEW.profissional_id AND estabelecimento_id = NEW.estabelecimento_id) THEN
    RAISE EXCEPTION 'O profissional não pertence a este estabelecimento.' USING ERRCODE = '23514';
  END IF;

  SELECT duracao, preco INTO v_duracao, v_preco
  FROM public.servicos
  WHERE id = NEW.servico_id AND estabelecimento_id = NEW.estabelecimento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'O serviço não pertence a este estabelecimento.' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clientes
                 WHERE id = NEW.cliente_id AND estabelecimento_id = NEW.estabelecimento_id) THEN
    RAISE EXCEPTION 'O cliente não pertence a este estabelecimento.' USING ERRCODE = '23514';
  END IF;

  -- Preço e duração gravados no agendamento (mudar o serviço depois não altera o histórico).
  NEW.duracao_minutos := COALESCE(NEW.duracao_minutos, v_duracao, 30);
  NEW.preco_cobrado   := COALESCE(NEW.preco_cobrado, v_preco, 0.00);

  NEW.inicio_ts := (NEW.data + NEW.hora) AT TIME ZONE 'America/Fortaleza';
  NEW.fim_ts    := NEW.inicio_ts + make_interval(mins => NEW.duracao_minutos);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prepare_agendamento
BEFORE INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.prepare_agendamento();

-- 4.3 Impede agendamento duplo/sobreposto do mesmo profissional.
--     Violação => erro 23P01 (a Edge Function traduz em HTTP 409).
--     Cancelados e concluídos não bloqueiam o horário.
ALTER TABLE public.agendamentos
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  profissional_id WITH =,
  tstzrange(inicio_ts, fim_ts) WITH &&
)
WHERE (status IN ('pendente', 'confirmado'));


-- ==============================================================================
-- 5. FUNÇÕES AUXILIARES DE SEGURANÇA
-- ==============================================================================
-- O papel vem de app_metadata (só o servidor altera). NUNCA de user_metadata.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- Estas três usam SECURITY DEFINER para consultar sem passar pela RLS.
-- Isso evita "infinite recursion" entre políticas que se referenciam.
CREATE OR REPLACE FUNCTION public.owner_estabelecimento_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.estabelecimentos
  WHERE dono_id = auth.uid() AND status = 'ativa' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.meu_profissional_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id FROM public.profissionais p
  JOIN public.estabelecimentos e ON e.id = p.estabelecimento_id
  WHERE p.user_id = auth.uid() AND e.status = 'ativa' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.meu_profissional_estabelecimento_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.estabelecimento_id FROM public.profissionais p
  JOIN public.estabelecimentos e ON e.id = p.estabelecimento_id
  WHERE p.user_id = auth.uid() AND e.status = 'ativa' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.owner_estabelecimento_id()            FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.meu_profissional_id()                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.meu_profissional_estabelecimento_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_estabelecimento_id()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.meu_profissional_id()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.meu_profissional_estabelecimento_id() TO authenticated;


-- ==============================================================================
-- 6. VIEWS PÚBLICAS (a página de agendamento do cliente lê SÓ por aqui)
-- ==============================================================================
-- 6.1 Dados públicos do estabelecimento. Sem documento, e-mail do dono, plano, trial.
--     O app deve ler ESTA view em getEstabelecimentoBySlug (não a tabela).
CREATE VIEW public.estabelecimentos_publico AS
SELECT
  id, nome, nicho, link_personalizado, endereco, telefone, status,
  foto_url, instagram_url, whatsapp_url,
  hero_image_url, hero_title, hero_subtitle,
  services_title, social_title, social_subtitle,
  operating_days, start_time, end_time
FROM public.estabelecimentos
WHERE status = 'ativa';

-- 6.2 Horários já ocupados, SEM nome/telefone de cliente.
--     O app deve ler ESTA view em getBookingDataForMonth (não a tabela agendamentos).
CREATE VIEW public.agendamentos_ocupados AS
SELECT
  estabelecimento_id, profissional_id, data, hora, duracao_minutos
FROM public.agendamentos
WHERE status IN ('pendente', 'confirmado');

GRANT SELECT ON public.estabelecimentos_publico TO anon, authenticated;
GRANT SELECT ON public.agendamentos_ocupados    TO anon, authenticated;

CREATE VIEW public.profissionais_publico AS
SELECT p.id, p.estabelecimento_id, p.nome, p.especialidade, p.foto_url
FROM public.profissionais p
JOIN public.estabelecimentos e ON e.id = p.estabelecimento_id
WHERE p.ativo = true AND e.status = 'ativa';

GRANT SELECT ON public.profissionais_publico TO anon, authenticated;


-- ==============================================================================
-- 7. ROW LEVEL SECURITY
-- ==============================================================================
ALTER TABLE public.system_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estabelecimentos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_profissional           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissional_disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_saas                  ENABLE ROW LEVEL SECURITY;

-- As Edge Functions usam a service_role, que ignora a RLS.
-- Gravações sensíveis (criar estabelecimento, trocar plano/status, criar
-- agendamento público) passam SEMPRE por Edge Function, nunca direto.

-- system_settings: leitura pública, edição só admin
CREATE POLICY system_settings_read  ON public.system_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY system_settings_admin ON public.system_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- planos: público vê os ativos; admin gerencia todos
CREATE POLICY planos_read  ON public.planos FOR SELECT TO anon, authenticated USING (ativo = true);
CREATE POLICY planos_admin ON public.planos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- estabelecimentos: admin tudo; dono e profissional só LEEM o seu.
-- Não existe UPDATE para o dono: quem edita é a Edge Function update-establishment,
CREATE POLICY estab_owner_read ON public.estabelecimentos FOR SELECT TO authenticated
  USING (dono_id = auth.uid());
CREATE POLICY estab_prof_read  ON public.estabelecimentos FOR SELECT TO authenticated
  USING (id IN (SELECT estabelecimento_id FROM public.profissionais WHERE user_id = auth.uid()));
  CREATE POLICY estab_prof_read  ON public.estabelecimentos FOR SELECT TO authenticated
  USING (id IN (SELECT estabelecimento_id FROM public.profissionais WHERE user_id = auth.uid()));
  USING (id = public.meu_profissional_estabelecimento_id());

-- tipos_profissional
CREATE POLICY tipos_admin      ON public.tipos_profissional FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY tipos_owner      ON public.tipos_profissional FOR ALL TO authenticated
  USING (estabelecimento_id = public.owner_estabelecimento_id())
  WITH CHECK (estabelecimento_id = public.owner_estabelecimento_id());
CREATE POLICY tipos_prof_read  ON public.tipos_profissional FOR SELECT TO authenticated
  USING (estabelecimento_id = public.meu_profissional_estabelecimento_id());

-- profissionais: o público lê pela view profissionais_publico

CREATE POLICY prof_admin       ON public.profissionais FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY prof_owner       ON public.profissionais FOR ALL TO authenticated
  USING (estabelecimento_id = public.owner_estabelecimento_id())
  WITH CHECK (estabelecimento_id = public.owner_estabelecimento_id());
CREATE POLICY prof_self_read   ON public.profissionais FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- servicos: público lê; dono gerencia os seus
CREATE POLICY serv_public_read ON public.servicos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY serv_admin       ON public.servicos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY serv_owner       ON public.servicos FOR ALL TO authenticated
  USING (estabelecimento_id = public.owner_estabelecimento_id())
  WITH CHECK (estabelecimento_id = public.owner_estabelecimento_id());

-- clientes: dono gerencia os seus; profissional só lê os do seu estabelecimento
CREATE POLICY cli_admin     ON public.clientes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY cli_owner     ON public.clientes FOR ALL TO authenticated
  USING (estabelecimento_id = public.owner_estabelecimento_id())
  WITH CHECK (estabelecimento_id = public.owner_estabelecimento_id());
CREATE POLICY cli_prof_read ON public.clientes FOR SELECT TO authenticated
  USING (estabelecimento_id = public.meu_profissional_estabelecimento_id());

-- agendamentos: dono gerencia os do seu estabelecimento; profissional lê/atualiza os seus.
-- O público NÃO lê esta tabela (usa a view agendamentos_ocupados).
CREATE POLICY agend_admin       ON public.agendamentos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY agend_owner       ON public.agendamentos FOR ALL TO authenticated
  USING (estabelecimento_id = public.owner_estabelecimento_id())
  WITH CHECK (estabelecimento_id = public.owner_estabelecimento_id());
CREATE POLICY agend_prof_read   ON public.agendamentos FOR SELECT TO authenticated
  USING (profissional_id = public.meu_profissional_id());
CREATE POLICY agend_prof_update ON public.agendamentos FOR UPDATE TO authenticated
  USING (profissional_id = public.meu_profissional_id())
  WITH CHECK (profissional_id = public.meu_profissional_id());

-- profissional_disponibilidade: público lê (monta a agenda); profissional e dono gerenciam
CREATE POLICY disp_public_read ON public.profissional_disponibilidade FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY disp_admin       ON public.profissional_disponibilidade FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY disp_prof        ON public.profissional_disponibilidade FOR ALL TO authenticated
  USING (profissional_id = public.meu_profissional_id())
  WITH CHECK (profissional_id = public.meu_profissional_id());
CREATE POLICY disp_owner       ON public.profissional_disponibilidade FOR ALL TO authenticated
  USING (profissional_id IN (SELECT id FROM public.profissionais
                             WHERE estabelecimento_id = public.owner_estabelecimento_id()))
  WITH CHECK (profissional_id IN (SELECT id FROM public.profissionais
                                  WHERE estabelecimento_id = public.owner_estabelecimento_id()));

-- gastos_saas: só admin
CREATE POLICY gastos_admin ON public.gastos_saas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ==============================================================================
-- 8. STORAGE, REALTIME E DADOS INICIAIS
-- ==============================================================================

-- 8.1 Buckets públicos (leitura aberta; escrita só autenticado)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('fotos-estabelecimentos', 'fotos-estabelecimentos', true),
  ('fotos-profissionais',    'fotos-profissionais',    true),
  ('system-assets',          'system-assets',          true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "fotos-estab leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-estabelecimentos');
CREATE POLICY "fotos-prof leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-profissionais');
CREATE POLICY "system-assets leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'system-assets');

-- Upload: qualquer usuário logado. Alterar/apagar: só quem enviou o arquivo (ou admin).
CREATE POLICY "fotos-estab upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos-estabelecimentos');
CREATE POLICY "fotos-estab alterar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos-estabelecimentos' AND (owner_id = auth.uid()::text OR public.is_admin()));
CREATE POLICY "fotos-estab apagar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fotos-estabelecimentos' AND (owner_id = auth.uid()::text OR public.is_admin()));

CREATE POLICY "fotos-prof upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos-profissionais');
CREATE POLICY "fotos-prof alterar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos-profissionais' AND (owner_id = auth.uid()::text OR public.is_admin()));
CREATE POLICY "fotos-prof apagar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fotos-profissionais' AND (owner_id = auth.uid()::text OR public.is_admin()));

CREATE POLICY "system-assets admin" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'system-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'system-assets' AND public.is_admin());

-- 8.2 Realtime: notificações de novos agendamentos e mudanças de status
ALTER TABLE public.agendamentos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;

-- 8.3 Configurações globais
INSERT INTO public.system_settings (id, system_name, support_email, contact_email, tos_link, logo_url)
VALUES (1, 'Marcadô', 'suporte@marcado.app', 'contato@marcado.app',
        '/termos-de-uso', '/landing/images/logo.png');

-- 8.4 Planos (pagamento ainda não definido; preços são só referência)
INSERT INTO public.planos (nome, preco, features, ativo, popular, limite_profissionais) VALUES
  ('Básico', 47.00,
    ARRAY['Até 2 profissionais cadastrados',
          'Agendamentos online ilimitados',
          'Página exclusiva de agendamento',
          'Controle financeiro diário e mensal',
          'Notificações no WhatsApp (manual)'],
    true, false, 2),
  ('Profissional', 97.00,
    ARRAY['Profissionais ilimitados',
          'Acesso individual ao painel para profissionais',
          'Gestão de comissões por categoria de cargo',
          'Relatórios detalhados de desempenho de 30 dias',
          'Página exclusiva e personalizada com sua marca',
          'Suporte prioritário via WhatsApp'],
    true, true, NULL),
  ('Trial', 0.00,
    ARRAY['Período de teste gratuito por 7 dias',
          'Até 2 profissionais',
          'Agendamentos online'],
    false, false, 2);


-- ==============================================================================
-- 9. PRIMEIRO ADMIN (passo manual, NÃO rode junto com o resto)
-- ==============================================================================
-- 1) Authentication > Users > Add user > Create new user
--    (informe e-mail e senha e marque "Auto Confirm User").
-- 2) Rode o comando abaixo, trocando o e-mail:
--
--   UPDATE auth.users
--   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--   WHERE email = 'SEU_EMAIL_AQUI';
--
-- 3) Saia e entre de novo no app (o papel vai dentro do token de login).


-- ==============================================================================
-- 10. VERIFICAÇÃO (rode separadamente depois do script acima)
-- ==============================================================================
-- 10.1 Tabelas: devem aparecer 10
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1;
--
-- 10.2 Todas com RLS ligada: nenhuma linha com rowsecurity = false
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
--
-- 10.3 O anônimo NÃO pode ler estabelecimentos nem agendamentos (esperado: 0 e 0)
--   BEGIN;
--   SET LOCAL ROLE anon;
--   SELECT count(*) AS estabelecimentos_visiveis FROM public.estabelecimentos;
--   SELECT count(*) AS agendamentos_visiveis     FROM public.agendamentos;
--   ROLLBACK;
--
-- 10.4 Teste automático: duplo agendamento bloqueado + exclusão em cascata.
--      Deve terminar com "NOTICE: OK ..." e não deixar dados para trás.
--
--   DO $$
--   DECLARE e UUID := gen_random_uuid(); p UUID := gen_random_uuid();
--           s UUID := gen_random_uuid(); c UUID := gen_random_uuid();
--   BEGIN
--     INSERT INTO public.estabelecimentos (id, nome, link_personalizado) VALUES (e, 'Teste', 'teste-' || e);
--     INSERT INTO public.profissionais (id, estabelecimento_id, nome) VALUES (p, e, 'Prof');
--     INSERT INTO public.servicos (id, estabelecimento_id, nome, preco, duracao) VALUES (s, e, 'Corte', 50, 30);
--     INSERT INTO public.clientes (id, estabelecimento_id, nome, telefone) VALUES (c, e, 'Ana', '(85) 99999-1111');
--     INSERT INTO public.agendamentos (estabelecimento_id, cliente_id, cliente_nome, cliente_telefone,
--                                      profissional_id, servico_id, servico_nome, data, hora)
--       VALUES (e, c, 'Ana', '85999991111', p, s, 'Corte', '2030-01-10', '10:00');
--     BEGIN
--       INSERT INTO public.agendamentos (estabelecimento_id, cliente_id, cliente_nome, cliente_telefone,
--                                        profissional_id, servico_id, servico_nome, data, hora)
--         VALUES (e, c, 'Ana', '85999991111', p, s, 'Corte', '2030-01-10', '10:15');
--       RAISE EXCEPTION 'FALHOU: permitiu agendamento duplo';
--     EXCEPTION WHEN exclusion_violation THEN
--       RAISE NOTICE 'OK: agendamento duplo bloqueado';
--     END;
--     IF (SELECT telefone FROM public.clientes WHERE id = c) <> '5585999991111' THEN
--       RAISE EXCEPTION 'FALHOU: telefone não normalizado';
--     END IF;
--     DELETE FROM public.estabelecimentos WHERE id = e;   -- testa a cascata
--     RAISE NOTICE 'OK: telefone normalizado e exclusão em cascata funcionou';
--   END $$;
