# 🗄️ DATABASE.md — Documentação do Banco de Dados (Marcadô)

Documentação técnica do schema PostgreSQL gerenciado no Supabase para o **Marcadô** (SaaS Multi-tenant para Nicho da Beleza e Cuidados Pessoais).

---

## 📌 Sumário
1. [Convenções & Decisões Arquiteturais](#1-convenções--decisões-arquiteturais)
2. [Execução da Migração](#2-execução-da-migração)
3. [Dicionário de Tabelas](#3-dicionário-de-tabelas)
4. [Triggers e Integridade de Negócio](#4-triggers-e-integridade-de-negócio)
5. [Funções Auxiliares de Segurança (SECURITY DEFINER)](#5-funções-auxiliares-de-segurança-security-definer)
6. [Views Públicas de Segurança](#6-views-públicas-de-segurança)
7. [Segurança e Row Level Security (RLS)](#7-segurança-e-row-level-security-rls)
8. [Storage Buckets & Realtime](#8-storage-buckets--realtime)
9. [Criação do Primeiro Administrador](#9-criação-do-primeiro-administrador)
10. [Consultas de Verificação](#10-consultas-de-verificação)

---

## 1. Convenções & Decisões Arquiteturais

- **Identificadores internos neutros**: `estabelecimentos` (em vez de barbearias) e `profissionais` (em vez de barbeiros). Suporte aos nichos: `'barbearia'`, `'salao'`, `'estetica'`, `'manicure'`, `'outro'`.
- **Multi-tenancy com isolamento**: Todas as entidades pertencem diretamente a um `estabelecimento_id` com exclusão em cascata (`ON DELETE CASCADE`), exceto clientes e serviços em agendamentos que usam `NO ACTION` para proteger o histórico financeiro.
- **Clientes isolados por estabelecimento**: Chave única `UNIQUE (estabelecimento_id, telefone)`. O mesmo cliente pode agendar em múltiplos estabelecimentos sem conflitos ou vazamento de dados.
- **Normalização canônica de telefone**: Trigger `normalize_cliente_phone` padroniza o telefone dos clientes em formato estritamente numérico com DDI 55 (`5585999991111`), garantindo integridade de busca e unicidade.
- **Anti-duplo agendamento no banco**: Extensão `btree_gist` com restrição de exclusão `no_overlapping_appointments` (`EXCLUDE USING gist`) sobre `(profissional_id, tstzrange(inicio_ts, fim_ts))` para status `pendente` e `confirmado`. A tentativa gera erro PostgreSQL `23P01` (convertido em HTTP 409 pela Edge Function).
- **Proteção do plano contra adulteração**: O dono não possui permissão de `UPDATE` direto na tabela `estabelecimentos`. Todas as edições de perfil passam pela Edge Function `update-establishment`, que impõe uma lista estrita de campos permitidos, impedindo a adulteração de `plano`, `status` ou `trial_*`.
- **Preservação de histórico financeiro**: `agendamentos` grava snapshot de `preco_cobrado` e `duracao_minutos` no momento da criação pelo trigger `prepare_agendamento`.
- **Autenticação e Papéis**: Papel (`role`) verificado exclusivamente em `app_metadata.role` (`'admin'`, `'estabelecimento'`, `'profissional'`). Nunca em `user_metadata`.

---

## 2. Execução da Migração

O banco é criado executando o arquivo consolidado:

* **`supabase/migrations/0001_schema_completo.sql`** — Contém todas as extensões, tabelas, índices, triggers, funções auxiliares, views públicas, políticas RLS, buckets de Storage, publicação Realtime e dados iniciais (Seed).

---

## 3. Dicionário de Tabelas

### `system_settings`
Configurações globais da plataforma SaaS. Garante uma única linha via constraint `CHECK (id = 1)`.
| Coluna | Tipo | Nulo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | INT | Não | 1 | Chave primária singleton |
| `system_name` | TEXT | Não | 'Marcadô' | Nome da plataforma |
| `support_email` | TEXT | Sim | 'suporte@marcado.app' | E-mail de suporte |
| `contact_email` | TEXT | Sim | 'contato@marcado.app' | E-mail de contato |
| `tos_link` | TEXT | Sim | NULL | Link dos termos de serviço |
| `logo_url` | TEXT | Sim | NULL | Logotipo global |
| `updated_at` | TIMESTAMPTZ | Sim | NOW() | Data de atualização |

### `planos`
Planos de assinatura do SaaS.
| Coluna | Tipo | Nulo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | UUID | Não | `gen_random_uuid()` | Chave primária |
| `nome` | TEXT | Não | UNIQUE | Nome do plano (Básico, Profissional, etc.) |
| `preco` | NUMERIC(10,2)| Não | 0.00 | Valor da mensalidade |
| `features` | TEXT[] | Sim | '{}' | Lista de benefícios |
| `ativo` | BOOLEAN | Não | true | Se está ativo para contratação |
| `popular` | BOOLEAN | Não | false | Destaque visual |
| `limite_profissionais`| INT | Sim | NULL | Limite de profissionais (NULL = ilimitado) |
| `created_at` | TIMESTAMPTZ | Sim | NOW() | Data de criação |

### `estabelecimentos`
Entidade central multi-tenant (clientes da plataforma SaaS).
| Coluna | Tipo | Nulo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | UUID | Não | `gen_random_uuid()` | Chave primária |
| `nome` | TEXT | Não | | Nome comercial |
| `dono_id` | UUID | Sim | UNIQUE, FK `auth.users` (`ON DELETE RESTRICT`) | Dono da conta |
| `dono_nome` | TEXT | Sim | NULL | Nome do responsável |
| `dono_email` | TEXT | Sim | NULL | E-mail do responsável |
| `nicho` | TEXT | Não | 'outro' | `CHECK (nicho IN ('barbearia', 'salao', 'estetica', 'manicure', 'outro'))` |
| `plano` | TEXT | Sim | NULL | Plano atual do estabelecimento |
| `link_personalizado` | TEXT | Não | UNIQUE | Slug da página pública (`/slug`) |
| `endereco` | TEXT | Sim | NULL | Endereço físico |
| `documento` | TEXT | Sim | NULL | CPF ou CNPJ |
| `telefone` | TEXT | Sim | NULL | Telefone do local |
| `status` | TEXT | Não | 'ativa' | `CHECK (status IN ('ativa', 'inativa'))` |
| `foto_url` | TEXT | Sim | NULL | Foto do estabelecimento |
| `instagram_url` | TEXT | Sim | NULL | Link do Instagram |
| `whatsapp_url` | TEXT | Sim | NULL | Link do WhatsApp |
| `hero_image_url` | TEXT | Sim | NULL | Imagem banner da página |
| `hero_title` / `hero_subtitle` | TEXT | Sim | NULL | Textos principais do topo da página |
| `services_title` | TEXT | Sim | 'Nossos Serviços' | Título da seção de serviços |
| `social_title` / `social_subtitle` | TEXT | Sim | 'Siga-nos nas Redes' | Seção de redes sociais |
| `operating_days` | INT[] | Sim | '{1,2,3,4,5,6}' | Dias de funcionamento (0 = Dom, 1 = Seg, ...) |
| `start_time` / `end_time` | TIME | Sim | '09:00' / '18:00' | Horários de funcionamento |
| `comissao_padrao` | NUMERIC(5,2)| Sim | 0.00 | Percentual de comissão padrão |
| `trial_started_at` | TIMESTAMPTZ | Sim | NULL | Início do período de teste |
| `trial_expires_at` | TIMESTAMPTZ | Sim | NULL | Término do período de teste |
| `criado_em` | TIMESTAMPTZ | Sim | NOW() | Data de cadastro |

### `tipos_profissional`
Cargos e categorias de comissão de profissionais.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | Chave primária (`gen_random_uuid()`) |
| `estabelecimento_id`| UUID | Não | FK `estabelecimentos` (`ON DELETE CASCADE`) |
| `nome` | TEXT | Não | Nome da categoria (ex: Barbeiro Sênior, Manicure Master) |
| `percentual_comissao`| NUMERIC(5,2)| Não | Percentual de comissão associado (padrão 0.00) |
| `created_at` | TIMESTAMPTZ | Sim | Data de criação |

### `profissionais`
Profissionais vinculados a um estabelecimento.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | Chave primária (`gen_random_uuid()`) |
| `user_id` | UUID | Sim | FK `auth.users` (`ON DELETE SET NULL`, UNIQUE) — NULL = sem login |
| `estabelecimento_id`| UUID | Não | FK `estabelecimentos` (`ON DELETE CASCADE`) |
| `nome` | TEXT | Não | Nome do profissional |
| `email` / `telefone` | TEXT | Sim | Contato direto |
| `especialidade` | TEXT | Sim | Especialidade |
| `foto_url` | TEXT | Sim | Foto de perfil |
| `ativo` | BOOLEAN | Não | `true` se disponível na página de agendamento |
| `tipo_profissional_id`| UUID | Sim | FK `tipos_profissional` (`ON DELETE SET NULL`) |
| `criado_em` | TIMESTAMPTZ | Sim | Data de criação |

### `servicos`
Catálogo de serviços oferecidos pelo estabelecimento.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | Chave primária (`gen_random_uuid()`) |
| `estabelecimento_id`| UUID | Não | FK `estabelecimentos` (`ON DELETE CASCADE`) |
| `nome` | TEXT | Não | Nome do serviço |
| `preco` | NUMERIC(10,2)| Não | Preço atual do serviço |
| `duracao` | INT | Não | Duração em minutos (`CHECK (duracao BETWEEN 1 AND 600)`) |
| `imagem_url` | TEXT | Sim | Imagem ilustrativa |
| `created_at` | TIMESTAMPTZ | Sim | Data de criação |

### `clientes`
Clientes cadastrados, isolados por estabelecimento.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | Chave primária (`gen_random_uuid()`) |
| `estabelecimento_id`| UUID | Não | FK `estabelecimentos` (`ON DELETE CASCADE`) |
| `nome` | TEXT | Não | Nome do cliente |
| `telefone` | TEXT | Não | Telefone normalizado com DDI 55 (`55...`) |
| `criado_em` | TIMESTAMPTZ | Sim | Data de cadastro |
| **Constraint** | UNIQUE | | `UNIQUE (estabelecimento_id, telefone)` |

### `agendamentos`
Registro de horários agendados.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | Chave primária (`gen_random_uuid()`) |
| `estabelecimento_id`| UUID | Não | FK `estabelecimentos` (`ON DELETE CASCADE`) |
| `cliente_id` | UUID | Não | FK `clientes` (`ON DELETE NO ACTION` — protege histórico) |
| `cliente_nome` / `cliente_telefone` | TEXT | Não | Dados do cliente no agendamento |
| `cliente_email` | TEXT | Sim | E-mail opcional do cliente |
| `profissional_id` | UUID | Não | FK `profissionais` (`ON DELETE CASCADE`) |
| `profissional_nome` | TEXT | Sim | Nome snapshot do profissional |
| `servico_id` | UUID | Não | FK `servicos` (`ON DELETE NO ACTION` — protege histórico) |
| `servico_nome` | TEXT | Não | Nome snapshot do serviço |
| `data` | DATE | Não | Data da sessão (`YYYY-MM-DD`) |
| `hora` | TIME | Não | Horário de início |
| `status` | TEXT | Não | `CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado'))` |
| `preco_cobrado` | NUMERIC(10,2)| Sim | Snapshot financeiro preenchido por trigger |
| `duracao_minutos` | INT | Sim | Duração efetiva preenchida por trigger |
| `inicio_ts` / `fim_ts` | TIMESTAMPTZ | Sim | Timestamps com timezone 'America/Fortaleza' calculados por trigger |
| `criado_em` | TIMESTAMPTZ | Sim | Data de registro |

### `profissional_disponibilidade`
Bloqueios, folgas e escalas especiais de profissionais.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | Chave primária (`gen_random_uuid()`) |
| `profissional_id` | UUID | Não | FK `profissionais` (`ON DELETE CASCADE`) |
| `data` | DATE | Não | Data da regra |
| `hora_inicio` / `hora_fim`| TIME | Sim | Faixa horária da disponibilidade/folga |
| `disponivel` | BOOLEAN | Não | `true` se dia livre, `false` se folga/bloqueio (padrão true) |
| **Constraint** | UNIQUE | | `UNIQUE (profissional_id, data)` para suporte a upsert |

### `gastos_saas`
Controle de despesas operacionais da plataforma SaaS (acesso restrito a administradores).
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | Chave primária (`gen_random_uuid()`) |
| `descricao` | TEXT | Não | Descrição da despesa |
| `valor` | NUMERIC(10,2)| Não | Valor em R$ |
| `data` | DATE | Não | Data do gasto |
| `user_id` | UUID | Sim | FK `auth.users` (`ON DELETE SET NULL`) |
| `created_at` | TIMESTAMPTZ | Sim | Data de registro |

---

## 4. Triggers e Integridade de Negócio

### 4.1 `trg_normalize_cliente_phone` (`normalize_cliente_phone`)
- **Evento**: `BEFORE INSERT OR UPDATE OF telefone ON clientes`
- **Comportamento**: Remove todos os caracteres não-dígitos (`\D`). Se o resultado tiver 10 ou 11 dígitos (formato padrão brasileiro com DDD), prefixa com `'55'`.
- **Efeito**: Garante que `(85) 99999-1111`, `85999991111` e `5585999991111` sejam unificados canonicamente para `5585999991111`, eliminando falsos duplicados e falhas de consulta no modal "Minha Conta".

### 4.2 `trg_prepare_agendamento` (`prepare_agendamento`)
- **Evento**: `BEFORE INSERT OR UPDATE ON agendamentos`
- **Comportamento**:
  1. Valida se `profissional_id`, `servico_id` e `cliente_id` pertencem comprovadamente ao mesmo `estabelecimento_id` (lança erro `23514` caso contrário).
  2. Grava snapshots imutáveis de `duracao_minutos` e `preco_cobrado` a partir de `servicos` (caso não venham especificados).
  3. Calcula `inicio_ts` a partir de `(NEW.data + NEW.hora) AT TIME ZONE 'America/Fortaleza'` e `fim_ts` somando o intervalo de `duracao_minutos`.

### 4.3 Restrição Anti-Duplo Agendamento (`no_overlapping_appointments`)
```sql
ALTER TABLE public.agendamentos
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  profissional_id WITH =,
  tstzrange(inicio_ts, fim_ts) WITH &&
)
WHERE (status IN ('pendente', 'confirmado'));
```
- Impede sobreposição temporal para o mesmo profissional.
- Agendamentos com status `cancelado` ou `concluido` não bloqueiam a grade.
- Violações disparam erro `23P01` (exclusion violation) traduzido em HTTP 409 pelas Edge Functions.

---

## 5. Funções Auxiliares de Segurança (SECURITY DEFINER)

Para evitar erros de recursão infinita (`infinite recursion detected in policy`) entre políticas RLS que se referenciam mutuamente, as seguintes funções auxiliares executam com privilégios de sistema (`SECURITY DEFINER`) com `search_path = public`:

| Função | Retorno | Descrição |
|---|---|---|
| `is_admin()` | `BOOLEAN` | Lê com segurança `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'` |
| `owner_estabelecimento_id()` | `UUID` | Retorna o `id` do estabelecimento cujo `dono_id = auth.uid()` |
| `meu_profissional_id()` | `UUID` | Retorna o `id` do profissional cujo `user_id = auth.uid()` |
| `meu_profissional_estabelecimento_id()`| `UUID` | Retorna o `estabelecimento_id` do profissional associado ao usuário atual |

> **Permissões**: O acesso a essas 3 funções foi revogado de `PUBLIC` e `anon`, ficando restrito exclusivamente a usuários com papel `authenticated`.

---

## 6. Views Públicas de Segurança

As páginas públicas de agendamento não consultam diretamente as tabelas `estabelecimentos` nem `agendamentos`, operando exclusivamente através de duas views públicas:

### 6.1 `estabelecimentos_publico`
- **Finalidade**: Consumida por `api.getEstabelecimentoBySlug(slug)`.
- **Filtro**: Apenas registros com `status = 'ativa'`.
- **Privacidade**: Oculta dados sensíveis como `documento`, `dono_email`, `dono_nome`, `plano` e datas de `trial`.

### 6.2 `agendamentos_ocupados`
- **Finalidade**: Consumida por `api.getBookingDataForMonth(estabelecimentoId, year, month)`.
- **Filtro**: Apenas agendamentos com `status IN ('pendente', 'confirmado')`.
- **Campos expostos**: Estritamente `estabelecimento_id`, `profissional_id`, `data`, `hora`, `duracao_minutos`.
- **Privacidade**: **Não expõe a coluna `id` do agendamento** nem dados pessoais dos clientes (`cliente_nome`, `cliente_telefone`, `cliente_email`), eliminando o risco de exposição ou tentativas anônimas de cancelamento.

---

## 7. Segurança e Row Level Security (RLS)

Todas as 10 tabelas têm `ROW LEVEL SECURITY` estritamente habilitada:

- `system_settings`: Leitura aberta (`anon`, `authenticated`), escrita exclusiva de administradores.
- `planos`: Leitura aberta para planos ativos (`ativo = true`), gerenciamento exclusivo de administradores.
- `estabelecimentos`: Leitura permitida ao dono (`dono_id = auth.uid()`) e profissionais vinculados. Modificações passam obrigatoriamente por Edge Function com credenciais de serviço.
- `tipos_profissional`: Dono gerencia os tipos do seu estabelecimento; profissionais vinculados podem consultar.
- `profissionais`: Público lê os profissionais ativos (`ativo = true`). Dono gerencia; profissional lê seu próprio registro.
- `servicos`: Público lê; dono gerencia os do seu estabelecimento.
- `clientes`: Dono gerencia; profissional lê apenas os clientes de sua unidade. Não há leitura anônima.
- `agendamentos`: Dono gerencia; profissional lê e atualiza os seus próprios; público não tem acesso direto (usa `agendamentos_ocupados`).
- `profissional_disponibilidade`: Público lê para cálculo de grade; profissional e dono gerenciam.
- `gastos_saas`: Acesso e gerenciamento restritos a administradores.

---

## 8. Storage Buckets & Realtime

### Buckets
1. **`fotos-estabelecimentos`**: Imagens e logos dos estabelecimentos (público para leitura, upload por autenticados, alteração/exclusão pelo proprietário do arquivo ou admin).
2. **`fotos-profissionais`**: Fotos de perfil de profissionais (público para leitura, upload por autenticados).
3. **`system-assets`**: Imagens do sistema gerenciadas exclusivamente por administradores.

### Realtime
- A tabela `agendamentos` opera com `REPLICA IDENTITY FULL` e está registrada na publicação `supabase_realtime` para atualização instantânea dos painéis do dono e do profissional.

---

## 9. Criação do Primeiro Administrador

1. Crie o usuário em **Authentication > Users > Add User** (marque *Auto Confirm User*).
2. No **SQL Editor**, execute com o e-mail cadastrado:
```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'seu_email@dominio.com';
```

---

## 10. Consultas de Verificação

### 10.1 Checar tabelas criadas (esperado: 10)
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1;
```

### 10.2 Checar se todas as tabelas têm RLS ativada
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
```

### 10.3 Teste de leitura anônima (esperado: 0 em ambas)
```sql
BEGIN;
SET LOCAL ROLE anon;
SELECT count(*) AS estabelecimentos_visiveis FROM public.estabelecimentos;
SELECT count(*) AS agendamentos_visiveis FROM public.agendamentos;
ROLLBACK;
```
