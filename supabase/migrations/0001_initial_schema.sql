-- ==============================================================================
-- 0001_initial_schema.sql
-- Marcadô SaaS - Schema do Banco de Dados
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==============================================================================
-- 2. TABELAS PRINCIPAIS
-- ==============================================================================

-- 2.1 Configurações Globais do Sistema (Linha única)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  system_name TEXT NOT NULL DEFAULT 'Marcadô',
  support_email TEXT DEFAULT 'suporte@marcado.app',
  contact_email TEXT DEFAULT 'contato@marcado.app',
  tos_link TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_settings CHECK (id = 1)
);

-- 2.2 Planos de Assinatura do SaaS
CREATE TABLE IF NOT EXISTS public.planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  features TEXT[] DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  popular BOOLEAN NOT NULL DEFAULT false,
  limite_profissionais INT DEFAULT NULL, -- NULL = ilimitado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Estabelecimentos (Multi-tenant principal)
CREATE TABLE IF NOT EXISTS public.estabelecimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  dono_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  dono_nome TEXT,
  dono_email TEXT,
  nicho TEXT NOT NULL DEFAULT 'outro' CHECK (nicho IN ('barbearia', 'salao', 'estetica', 'manicure', 'outro')),
  plano TEXT,
  link_personalizado TEXT NOT NULL UNIQUE,
  endereco TEXT,
  documento TEXT,
  telefone TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
  foto_url TEXT,
  instagram_url TEXT,
  whatsapp_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  services_title TEXT DEFAULT 'Nossos Serviços',
  social_title TEXT DEFAULT 'Siga-nos nas Redes',
  social_subtitle TEXT,
  operating_days INT[] DEFAULT '{1,2,3,4,5,6}',
  start_time TIME DEFAULT '09:00',
  end_time TIME DEFAULT '18:00',
  comissao_padrao NUMERIC(5, 2) DEFAULT 0.00,
  trial_started_at TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Tipos de Profissional (Categorias e comissões por cargo)
CREATE TABLE IF NOT EXISTS public.tipos_profissional (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  percentual_comissao NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL quando profissional sem login
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  especialidade TEXT,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  tipo_profissional_id UUID REFERENCES public.tipos_profissional(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Catálogo de Serviços
CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  duracao INT NOT NULL CHECK (duracao BETWEEN 1 AND 600), -- minutos
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Clientes (isolados por estabelecimento)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT clientes_estabelecimento_telefone_key UNIQUE (estabelecimento_id, telefone)
);

-- 2.8 Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT NOT NULL,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  profissional_nome TEXT,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE RESTRICT,
  servico_nome TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado')),
  preco_cobrado NUMERIC(10, 2),
  duracao_minutos INT,
  inicio_ts TIMESTAMPTZ,
  fim_ts TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Disponibilidade e Folgas dos Profissionais
CREATE TABLE IF NOT EXISTS public.profissional_disponibilidade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  disponivel BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT prof_disp_unique UNIQUE (profissional_id, data)
);

-- 2.10 Gastos Operacionais do SaaS
CREATE TABLE IF NOT EXISTS public.gastos_saas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TRIGGERS DE INTEGRIDADE & CANONICALIZAÇÃO
-- ==============================================================================

-- 3.1 Normalização de telefone (apenas dígitos)
CREATE OR REPLACE FUNCTION public.normalize_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.telefone IS NOT NULL THEN
    NEW.telefone := regexp_replace(NEW.telefone, '\D', '', 'g');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_phone_clientes
BEFORE INSERT OR UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.normalize_phone();

CREATE TRIGGER trg_normalize_phone_estabelecimentos
BEFORE INSERT OR UPDATE ON public.estabelecimentos
FOR EACH ROW EXECUTE FUNCTION public.normalize_phone();

-- 3.2 Prevenção de conflito de agendamento duplo no banco
CREATE OR REPLACE FUNCTION public.calculate_appointment_range()
RETURNS TRIGGER AS $$
DECLARE
  v_duracao INT;
  v_preco NUMERIC(10, 2);
BEGIN
  -- Snapshot de preço e duração se não fornecidos
  IF NEW.duracao_minutos IS NULL OR NEW.preco_cobrado IS NULL THEN
    SELECT duracao, preco INTO v_duracao, v_preco
    FROM public.servicos
    WHERE id = NEW.servico_id;

    NEW.duracao_minutos := COALESCE(NEW.duracao_minutos, v_duracao, 30);
    NEW.preco_cobrado := COALESCE(NEW.preco_cobrado, v_preco, 0.00);
  END IF;

  -- Calcula início e fim com fuso horário padrão (America/Fortaleza)
  NEW.inicio_ts := (NEW.data || ' ' || NEW.hora)::timestamp AT TIME ZONE 'America/Fortaleza';
  NEW.fim_ts := NEW.inicio_ts + (NEW.duracao_minutos || ' minutes')::interval;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_appointment_range
BEFORE INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.calculate_appointment_range();

-- Constraint de exclusão para evitar agendamento duplo sobreposto
ALTER TABLE public.agendamentos
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  profissional_id WITH =,
  tstzrange(inicio_ts, fim_ts) WITH &&
)
WHERE (status IN ('pendente', 'confirmado'));

-- ==============================================================================
-- 4. VIEW PÚBLICA SEGURA (Sem dados sensíveis como CPF ou email do dono)
-- ==============================================================================
CREATE OR REPLACE VIEW public.estabelecimentos_publico AS
SELECT 
  id,
  nome,
  nicho,
  link_personalizado,
  endereco,
  telefone,
  status,
  foto_url,
  instagram_url,
  whatsapp_url,
  hero_image_url,
  hero_title,
  hero_subtitle,
  services_title,
  social_title,
  social_subtitle,
  operating_days,
  start_time,
  end_time
FROM public.estabelecimentos
WHERE status = 'ativa';

GRANT SELECT ON public.estabelecimentos_publico TO anon, authenticated;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_profissional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissional_disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_saas ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares para leitura segura do papel via app_metadata
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.jwt_role() = 'admin';
$$ LANGUAGE sql STABLE;

-- 5.1 system_settings: leitura pública, edição só admin
CREATE POLICY "system_settings_select_all" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "system_settings_admin_all" ON public.system_settings FOR ALL USING (public.is_admin());

-- 5.2 planos: leitura pública dos ativos, admin gerencia
CREATE POLICY "planos_select_all" ON public.planos FOR SELECT USING (ativo = true OR public.is_admin());
CREATE POLICY "planos_admin_all" ON public.planos FOR ALL USING (public.is_admin());

-- 5.3 estabelecimentos: dono vê o seu, admin vê tudo. (Anon lê pela view!)
CREATE POLICY "estabelecimentos_admin_all" ON public.estabelecimentos FOR ALL USING (public.is_admin());
CREATE POLICY "estabelecimentos_owner_select" ON public.estabelecimentos FOR SELECT USING (dono_id = auth.uid());
CREATE POLICY "estabelecimentos_owner_update" ON public.estabelecimentos FOR UPDATE USING (dono_id = auth.uid());

-- 5.4 tipos_profissional: dono gerencia do seu estabelecimento, admin tudo
CREATE POLICY "tipos_prof_admin_all" ON public.tipos_profissional FOR ALL USING (public.is_admin());
CREATE POLICY "tipos_prof_owner_all" ON public.tipos_profissional FOR ALL USING (
  EXISTS (SELECT 1 FROM public.estabelecimentos e WHERE e.id = tipos_profissional.estabelecimento_id AND e.dono_id = auth.uid())
);

-- 5.5 profissionais: público lê ativos, dono gerencia do seu estabelecimento, prof lê a si mesmo
CREATE POLICY "profissionais_public_select" ON public.profissionais FOR SELECT USING (ativo = true);
CREATE POLICY "profissionais_admin_all" ON public.profissionais FOR ALL USING (public.is_admin());
CREATE POLICY "profissionais_owner_all" ON public.profissionais FOR ALL USING (
  EXISTS (SELECT 1 FROM public.estabelecimentos e WHERE e.id = profissionais.estabelecimento_id AND e.dono_id = auth.uid())
);
CREATE POLICY "profissionais_self_select" ON public.profissionais FOR SELECT USING (user_id = auth.uid());

-- 5.6 servicos: público lê, dono gerencia
CREATE POLICY "servicos_public_select" ON public.servicos FOR SELECT USING (true);
CREATE POLICY "servicos_admin_all" ON public.servicos FOR ALL USING (public.is_admin());
CREATE POLICY "servicos_owner_all" ON public.servicos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.estabelecimentos e WHERE e.id = servicos.estabelecimento_id AND e.dono_id = auth.uid())
);

-- 5.7 clientes: dono gerencia os do seu estabelecimento, prof lê, service_role/Edge Functions criam
CREATE POLICY "clientes_admin_all" ON public.clientes FOR ALL USING (public.is_admin());
CREATE POLICY "clientes_owner_all" ON public.clientes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.estabelecimentos e WHERE e.id = clientes.estabelecimento_id AND e.dono_id = auth.uid())
);
CREATE POLICY "clientes_prof_select" ON public.clientes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profissionais p WHERE p.estabelecimento_id = clientes.estabelecimento_id AND p.user_id = auth.uid())
);

-- 5.8 agendamentos: dono gerencia do seu estabelecimento, profissional gerencia os seus, admin tudo
CREATE POLICY "agendamentos_admin_all" ON public.agendamentos FOR ALL USING (public.is_admin());
CREATE POLICY "agendamentos_owner_all" ON public.agendamentos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.estabelecimentos e WHERE e.id = agendamentos.estabelecimento_id AND e.dono_id = auth.uid())
);
CREATE POLICY "agendamentos_prof_select" ON public.agendamentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = agendamentos.profissional_id AND p.user_id = auth.uid())
);
CREATE POLICY "agendamentos_prof_update" ON public.agendamentos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = agendamentos.profissional_id AND p.user_id = auth.uid())
);

-- 5.9 profissional_disponibilidade: público lê para agendamento, prof e dono gerenciam
CREATE POLICY "disp_public_select" ON public.profissional_disponibilidade FOR SELECT USING (true);
CREATE POLICY "disp_admin_all" ON public.profissional_disponibilidade FOR ALL USING (public.is_admin());
CREATE POLICY "disp_prof_all" ON public.profissional_disponibilidade FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = profissional_disponibilidade.profissional_id AND p.user_id = auth.uid())
);
CREATE POLICY "disp_owner_all" ON public.profissional_disponibilidade FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profissionais p
    JOIN public.estabelecimentos e ON e.id = p.estabelecimento_id
    WHERE p.id = profissional_disponibilidade.profissional_id AND e.dono_id = auth.uid()
  )
);

-- 5.10 gastos_saas: exclusivo admin
CREATE POLICY "gastos_admin_all" ON public.gastos_saas FOR ALL USING (public.is_admin());
