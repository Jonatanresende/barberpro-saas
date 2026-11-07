# Glossário de Termos e Convenções - Projeto Marcadô

> Documento oficial de padronização arquitetural e nomenclatura para a migração do sistema para o nicho de beleza e bem-estar (Marcadô).

---

## 1. Decisões do Projeto

| # | Decisão | Valor Definido | Observações |
|---|---|---|---|
| 1 | **Nome do produto** | **Marcadô** | Identificador técnico: `marcado` (ex: `package.json`, subdomínios, slugs) |
| 2 | **Entidade do negócio** | `estabelecimento` / `Estabelecimento` | Substitui "barbearia" / "barbershop" |
| 3 | **Entidade do atendente** | `profissional` / `Profissional` | Substitui "barbeiro" / "barber" |
| 4 | **Nichos suportados inicialmente** | `barbearia`, `salao`, `estetica`, `manicure`, `outro` | Valores em minúsculas, sem acento |
| 5 | **Clientes** | Separados por estabelecimento | `clientes` possui `estabelecimento_id`; isolamento estrito via RLS e APIs |
| 6 | **Preços na Landing Page** | Escondida temporariamente | Até definição da nova infraestrutura de pagamento |

---

## 2. Tabela de Nomenclatura e Mapeamento

### 2.1 Banco de Dados, Tabelas e Colunas

| Termo Anterior | Novo Nome Padronizado | Contexto / Escopo |
|---|---|---|
| `barbearia`, `barbearias` | `estabelecimento`, `estabelecimentos` | Nome da tabela e referências |
| `barbershop`, `barbershop_id` | `estabelecimento`, `estabelecimento_id` | Chaves estrangeiras e identificadores |
| `barbearia_id` | `estabelecimento_id` | Em `profissionais`, `servicos`, `agendamentos`, `tipos_profissional`, `clientes` |
| `barbeiro`, `barbeiros` | `profissional`, `profissionais` | Nome da tabela e referências |
| `barbeiro_id` | `profissional_id` | Chaves estrangeiras |
| `barbeiro_nome` | `profissional_nome` | Em `agendamentos` |
| `barbeiro_disponibilidade` | `profissional_disponibilidade` | Nome da tabela de disponibilidade |
| `professional_types` | `tipos_profissional` | Nome da tabela de tipos de profissionais |
| `professional_types.name` | `tipos_profissional.nome` | Coluna |
| `professional_types.commission_percent` | `tipos_profissional.percentual_comissao` | Coluna |
| `professional_types.barbershop_id` | `tipos_profissional.estabelecimento_id` | Coluna / FK |
| `barbeiros.professional_type_id` | `profissionais.tipo_profissional_id` | Coluna / FK |
| `fotos-barbearias` | `fotos-estabelecimentos` | Bucket do Supabase Storage |
| `fotos-barbeiros` | `fotos-profissionais` | Bucket do Supabase Storage |

### 2.2 Estruturas que se Mantêm Neutras

As seguintes tabelas e colunas já são neutras e permanecem inalteradas:
- `servicos`, `clientes`, `agendamentos`, `planos`, `gastos_saas`, `system_settings`, `system-assets`
- `dono_id`, `dono_nome`, `dono_email`, `trial_started_at`, `trial_expires_at`, `comissao_padrao`
- `AppointmentStatus`: `'pendente'`, `'confirmado'`, `'concluido'` (sempre sem acento), `'cancelado'`

---

## 3. Código TypeScript e Aplicação Frontend

### 3.1 Tipos e Interfaces

| Tipo Anterior | Novo Tipo |
|---|---|
| `Barbearia` | `Estabelecimento` (inclui obrigatoriamente `nicho: Nicho`) |
| `Barbeiro` | `Profissional` |
| `BarbeiroDisponibilidade` | `ProfissionalDisponibilidade` |
| `ProfessionalType` | `TipoProfissional` |

### 3.2 Papéis de Usuário (`UserRole`)

- Gravados exclusivamente em `app_metadata.role` (JWT do Supabase Auth).
- `UserRole.BARBEARIA` (`'barbearia'`) $\rightarrow$ `UserRole.ESTABELECIMENTO` (`'estabelecimento'`)
- `UserRole.BARBEIRO` (`'barbeiro'`) $\rightarrow$ `UserRole.PROFISSIONAL` (`'profissional'`)
- Mantidos: `UserRole.ADMIN` (`'admin'`), `UserRole.CLIENTE` (`'cliente'`)

### 3.3 Propriedades do Objeto `User`

- `user.barbeariaId` $\rightarrow$ `user.estabelecimentoId`
- `user.barbeariaNome` $\rightarrow$ `user.estabelecimentoNome`
- `user.barbeiroId` $\rightarrow$ `user.profissionalId`

---

## 4. Slugs de Edge Functions (Supabase)

Convenção: slugs em inglês, com termos neutros:

| Slug Anterior | Novo Slug Padronizado |
|---|---|
| `create-barber-user` | `create-professional-user` |
| `update-barber-user` | `update-professional-user` |
| `delete-barber-user` | `delete-professional-user` |
| `get-barber-dashboard` | `get-professional-dashboard` |
| `get-barber-performance` | `get-professional-performance` |
| `create-barbershop` | `create-establishment` |
| `update-barbershop` | `update-establishment` |
| `update-barbershop-plan` | `update-establishment-plan` |
| `delete-barbershop` | `delete-establishment` |
| `get-barbershop-dashboard` | `get-establishment-dashboard` |

*Nota:* Funções mantidas com o mesmo nome: `create-appointment`, `cancel-client-appointment`, `get-client-appointment`, `get-client-appointments-history`, `find-or-create-client`, `get-admin-dashboard`, `get-admin-users`, `create-admin-user`, `update-admin-user`, `delete-admin-user`, `keep-alive`, `payment-webhook-*`.

---

## 5. Convenções Gerais de Idioma e Nicho

1. **Banco de dados e mensagens de interface:** Português do Brasil (PT-BR).
2. **Identificadores internos de código:** Podem manter verbos em inglês (`getEstabelecimentoBySlug`, `createProfissional`, etc.).
3. **Valores do enum `Nicho`:** `'barbearia'`, `'salao'`, `'estetica'`, `'manicure'`, `'outro'`.
4. **Artigos e plurais:** Devem seguir rigorosamente o dicionário do nicho configurado via `src/config/vocabulario.ts`.

