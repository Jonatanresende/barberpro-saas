# 🗄️ DATABASE.md — Documentação do Banco de Dados (Marcadô)

Documentação técnica do schema PostgreSQL gerenciado no Supabase para o **Marcadô** (SaaS Multi-tenant para Nicho da Beleza e Cuidados Pessoais).

---

## 📌 Sumário
1. [Convenções & Decisões Arquiteturais](#1-convenções--decisões-arquiteturais)
2. [Execução da Migração](#2-execução-da-migração)
3. [Dicionário de Tabelas](#3-dicionário-de-tabelas)
4. [Triggers e Integridade de Negócio](#4-triggers-e-integridade-de-negócio)
5. [Views Públicas de Segurança](#5-views-públicas-de-segurança)
6. [Segurança e Row Level Security (RLS)](#6-segurança-e-row-level-security-rls)
7. [Storage Buckets](#7-storage-buckets)
8. [Criação do Primeiro Administrador](#8-criação-do-primeiro-administrador)
9. [Consultas de Verificação](#9-consultas-de-verificação)

---

## 1. Convenções & Decisões Arquiteturais

- **Identificadores internos neutros**: `estabelecimentos` (em vez de barbearias) e `profissionais` (em vez de barbeiros).
- **Multi-tenancy com isolamento**: Todas as entidades pertencem diretamente a um `estabelecimento_id` com exclusão em cascata (`ON DELETE CASCADE`).
- **Clientes isolados por estabelecimento**: Chave única `UNIQUE (estabelecimento_id, telefone)`. O mesmo cliente pode agendar em múltiplos estabelecimentos sem misturar dados ou históricos.
- **Prevenção de agendamento duplo a nível de banco**: Usando extensão `btree_gist` e constraint `EXCLUDE USING gist` sobre `(profissional_id, tstzrange(inicio_ts, fim_ts))` para status `pendente` ou `confirmado`. A violação gera erro `23P01` tratado como HTTP 409 pelas Edge Functions.
- **Proteção do plano contra adulteração**: O dono do estabelecimento não possui permissão de `UPDATE` direto na tabela `estabelecimentos`. Todas as edições do perfil são processadas pela Edge Function `update-establishment`, que impõe uma lista estrita de campos permitidos (nome, endereço, telefone, nicho, horários, imagens), impedindo a alteração de `plano`, `status` ou `trial_*` por não-administradores.
- **Preservação de histórico financeiro**: `agendamentos` grava snapshot de `preco_cobrado` e `duracao_minutos` no momento da criação.
- **Autenticação e Papéis**: Papel (`role`) gravado **exclusivamente** em `app_metadata.role` (`'admin'`, `'estabelecimento'`, `'profissional'`). Nunca em `user_metadata`.

---

## 2. Execução da Migração

O banco é criado executando o arquivo consolidado:

* **`supabase/migrations/0001_schema_completo.sql`** — Contém todas as extensões, tabelas, triggers, views públicas, políticas RLS, buckets de Storage, publicação Realtime e dados iniciais (Seed).

---

## 3. Dicionário de Tabelas

### `system_settings`
Configurações da plataforma SaaS. Garante uma única linha via constraint `id = 1`.
| Coluna | Tipo | Nulo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | INT | Não | 1 | Chave primária singleton |
| `system_name` | TEXT | Não | 'Marcadô' | Nome da plataforma |
| `support_email` | TEXT | Sim | NULL | E-mail de suporte |
| `contact_email` | TEXT | Sim | NULL | E-mail de contato |
| `tos_link` | TEXT | Sim | NULL | Link dos termos de serviço |
| `logo_url` | TEXT | Sim | NULL | Logotipo global |
| `updated_at` | TIMESTAMPTZ | Sim | NOW() | Última alteração |

### `planos`
Planos de assinatura disponíveis para os estabelecimentos.
| Coluna | Tipo | Nulo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | UUID | Não | uuid_generate_v4() | ID do plano |
| `nome` | TEXT | Não | UNIQUE | Nome (Básico, Profissional, etc.) |
| `preco` | NUMERIC(10,2)| Não | 0.00 | Valor da mensalidade |
| `features` | TEXT[] | Sim | '{}' | Lista de recursos |
| `ativo` | BOOLEAN | Não | true | Se está visível |
| `popular` | BOOLEAN | Não | false | Destaque visual |
| `limite_profissionais`| INT | Sim | NULL | Limite de profissionais (NULL = ilimitado) |

### `estabelecimentos`
Entidade central multi-tenant.
| Coluna | Tipo | Nulo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | UUID | Não | uuid_generate_v4() | ID do estabelecimento |
| `nome` | TEXT | Não | | Nome comercial |
| `dono_id` | UUID | Não | UNIQUE, FK `auth.users` | Dono do estabelecimento |
| `nicho` | TEXT | Não | 'outro' | `CHECK ('barbearia', 'salao', 'estetica', 'manicure', 'outro')` |
| `plano` | TEXT | Não | 'Trial' | Plano ativo |
| `link_personalizado` | TEXT | Não | UNIQUE | Slug da página pública (`/slug`) |
| `status` | TEXT | Não | 'ativa' | `CHECK ('ativa', 'inativa')` |
| `comissao_padrao` | NUMERIC(5,2)| Não | 0.00 | Percentual de comissão padrão |
| `operating_days` | INT[] | Sim | '{1,2,3,4,5,6}' | Dias de funcionamento (0=Dom, 1=Seg) |
| `start_time` / `end_time` | TIME | Sim | '08:00' / '19:00' | Horários padrão de abertura e fechamento |
| `trial_started_at` | TIMESTAMPTZ | Sim | NOW() | Início do teste |
| `trial_expires_at` | TIMESTAMPTZ | Sim | NOW() + 7 days | Expiração do teste |

### `tipos_profissional`
Categorias e cargos de profissionais vinculados a comissões diferenciadas.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | ID do tipo |
| `estabelecimento_id`| UUID | Não | FK estabelecimentos (CASCADE) |
| `nome` | TEXT | Não | Ex.: Barbeiro Sênior, Manicure Master |
| `percentual_comissao`| NUMERIC(5,2)| Não | Percentual de comissão |

### `profissionais`
Profissionais que prestam serviços.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | ID do profissional |
| `user_id` | UUID | Sim | FK `auth.users` (NULL se não tiver login no app) |
| `estabelecimento_id`| UUID | Não | FK estabelecimentos (CASCADE) |
| `nome` | TEXT | Não | Nome do profissional |
| `ativo` | BOOLEAN | Não | `true` para exibir na página de agendamento |
| `tipo_profissional_id`| UUID | Sim | FK tipos_profissional |

### `servicos`
Catálogo de serviços oferecidos.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | ID do serviço |
| `estabelecimento_id`| UUID | Não | FK estabelecimentos (CASCADE) |
| `nome` | TEXT | Não | Nome do serviço |
| `preco` | NUMERIC(10,2)| Não | Preço sugerido |
| `duracao` | INT | Não | Duração em minutos (`CHECK 1..600`) |

### `clientes`
Clientes cadastrados por estabelecimento.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | ID do cliente |
| `estabelecimento_id`| UUID | Não | FK estabelecimentos (CASCADE) |
| `nome` | TEXT | Não | Nome do cliente |
| `telefone` | TEXT | Não | Telefone normalizado com DDI |
| Constraint | UNIQUE (`estabelecimento_id`, `telefone`) |

### `agendamentos`
Reservas e agendamentos realizados.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | ID do agendamento |
| `estabelecimento_id`| UUID | Não | FK estabelecimentos (CASCADE) |
| `cliente_id` | UUID | Não | FK clientes (RESTRICT) |
| `profissional_id` | UUID | Não | FK profissionais (CASCADE) |
| `servico_id` | UUID | Não | FK servicos (RESTRICT) |
| `data` | DATE | Não | Data da reserva (YYYY-MM-DD) |
| `hora` | TIME | Não | Horário de início |
| `status` | TEXT | Não | `CHECK ('pendente', 'confirmado', 'concluido', 'cancelado')` |
| `preco_cobrado` | NUMERIC(10,2)| Sim | Snapshot do valor |
| `duracao_minutos`| INT | Sim | Snapshot da duração |
| `inicio_ts` | TIMESTAMPTZ | Sim | Calculado por trigger |
| `fim_ts` | TIMESTAMPTZ | Sim | Calculado por trigger |

### `profissional_disponibilidade`
Disponibilidade e folgas pontuais por profissional e data.
| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | UUID | Não | ID do registro |
| `profissional_id` | UUID | Não | FK profissionais (CASCADE) |
| `data` | DATE | Não | Data específica |
| `disponivel` | BOOLEAN | Não | `false` indica dia de folga |
| Constraint | UNIQUE (`profissional_id`, `data`) |

---

## 4. Triggers e Integridade de Negócio

1. **`trg_normalize_phone`**: Remove caracteres não numéricos antes de salvar clientes e estabelecimentos.
2. **`trg_calculate_appointment_range`**:
   - Salva snapshot de `preco_cobrado` e `duracao_minutos` a partir do serviço selecionado.
   - Calcula os instantes `inicio_ts` e `fim_ts` com fuso de Fortaleza (`America/Fortaleza`).
3. **`no_overlapping_appointments`**: Constraint de exclusão GIST que rejeita automaticamente sobreposição de horários para o mesmo profissional quando o status for `pendente` ou `confirmado`.

---

## 5. Views Públicas de Segurança

### `estabelecimentos_publico`
Expõe apenas os campos visuais públicos para a página de agendamento do cliente, protegendo documentos, e-mails de faturamento e dados administrativos.
```sql
SELECT * FROM public.estabelecimentos_publico WHERE link_personalizado = 'meu-salao';
```

### `agendamentos_ocupados`
Expõe apenas os horários ocupados para o calendário de reserva pública, sem expor `id` do agendamento, nomes, telefones ou e-mails de clientes.
```sql
SELECT data, hora, profissional_id FROM public.agendamentos_ocupados WHERE estabelecimento_id = 'uuid';
```

---

## 6. Segurança e Row Level Security (RLS)

O papel é verificado via função segura:
```sql
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$ LANGUAGE sql STABLE;
```
- **Admin (`role = 'admin'`)**: Acesso irrestrito a todas as tabelas.
- **Estabelecimento (`role = 'estabelecimento'`)**: Acessa e gerencia exclusivamente registros onde `dono_id = auth.uid()`.
- **Profissional (`role = 'profissional'`)**: Acessa seus próprios agendamentos e horários onde `user_id = auth.uid()`.
- **Anon**: Somente leitura nas views `estabelecimentos_publico` e `agendamentos_ocupados`, e nas tabelas `servicos`, `profissionais` (ativos) e `profissional_disponibilidade`. Mutações e agendamentos de clientes são processados via Edge Functions protegidas com `service_role`.

---

## 7. Storage Buckets

| Bucket | Acesso | Descrição |
|---|---|---|
| `fotos-estabelecimentos` | Público (Leitura) / Auth (Escrita) | Logotipos e fotos de capa |
| `fotos-profissionais` | Público (Leitura) / Auth (Escrita) | Fotos de perfil dos profissionais |
| `system-assets` | Público (Leitura) / Admin (Escrita) | Logotipo global da plataforma |

---

## 8. Criação do Primeiro Administrador

No painel do Supabase novo:
1. Vá em **Authentication** → **Users** → **Add User** (marcando *Auto Confirm User*).
2. No **SQL Editor**, execute:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
WHERE email = 'seu_email_admin@exemplo.com';
```

---

## 9. Consultas de Verificação

Execute para certificar a integridade do banco instalado:

```sql
-- 1. Contagem de tabelas públicas (deve retornar 10)
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 2. Testar que anon não tem acesso direto à tabela de estabelecimentos
SET ROLE anon;
SELECT * FROM public.estabelecimentos; -- Deve retornar 0 linhas ou erro de RLS
SELECT count(*) FROM public.estabelecimentos_publico; -- Deve funcionar normalmente
SELECT * FROM public.agendamentos_ocupados; -- Sem coluna ID, apenas ocupação
RESET ROLE;

-- 3. Confirmar que a publicação do Realtime inclui agendamentos
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
