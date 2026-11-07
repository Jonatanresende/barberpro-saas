# PROMPT: Migrar o BarberPro para um sistema aberto ao nicho de beleza e bem-estar

> Cole este arquivo inteiro na IA da sua IDE (Claude Code, Cursor, Codex) com o repositório aberto.
> Ela deve executar **uma fase por vez**, parar ao fim de cada fase e esperar o seu "ok".

---

## 0. Contexto e objetivo

O projeto `barberpro-saas` (React + Vite + TypeScript + Supabase) foi feito só para **barbearias**. O objetivo agora é abri-lo para o **nicho de beleza e cuidados pessoais**: barbearia, salão de beleza, estúdio de estética, manicure, depilação e afins.

Isso significa duas coisas, e as duas são obrigatórias:

1. **Nomes internos neutros**: arquivos, pastas, tipos, variáveis, rotas, Edge Functions, tabelas, colunas, buckets e papéis deixam de dizer "barbearia/barbeiro".
2. **Vocabulário da tela configurável por nicho**: cada estabelecimento tem um campo `nicho`, e os textos que o usuário vê ("Barbeiro", "Cabeleireira", "Esteticista") saem de um único mapa. Um cliente final de um salão nunca pode ver a palavra "barbearia".

**Fora do escopo agora: saúde clínica** (consultório, fisioterapia, etc.). Dado de saúde é dado pessoal sensível na LGPD e exige consentimento, controle de acesso e prontuário. Fica para uma fase futura.

### Situação importante do banco

O projeto Supabase antigo **foi perdido**. O banco será **recriado do zero** numa conta nova, então **não existe migração de dados**: renomear tabelas e colunas custa quase nada. Por isso o SQL da Fase 8 já nasce com os nomes finais.

### Pagamentos: não mexer

O sistema de pagamento **não será a Kiwify** (talvez Stripe, mas só no futuro). Portanto:

- **Não** altere a lógica de autenticação, token ou assinatura de `payment-webhook-user-creation` e `payment-webhook-status-update`.
- Apenas renomeie o vocabulário dentro delas (Fase 7) e deixe-as **fora do deploy**.
- Não crie nada novo de pagamento.

---

## Regras de execução (valem para todas as fases)

1. **Trabalhe numa branch** (`git switch -c refactor/nicho-beleza`). Nunca na `main`.
2. **Um commit por etapa**, com mensagem clara. Isso permite desfazer uma etapa sem perder as outras.
3. **Renomeie arquivos com `git mv`**, para manter o histórico.
4. **É proibido usar localizar-e-substituir global** para "barb" ou "barbearia". O português muda artigo e plural: "a barbearia" vira "o estabelecimento"; "barbeiros" vira "profissionais" (e não "profissionals"). Textos de tela são revisados **um a um** (Fase 6).
5. **Se precisar substituir em massa**, vá do mais específico ao mais geral e respeite a caixa: `barbearias` → `barbearia` → `barbeiros` → `barbeiro` → `barbershop` → `barber`. Rode `git diff` e leia antes de commitar.
6. **Strings do Supabase não são vistas pelo TypeScript.** `.from('barbearias')`, `.select('barbeiros(...)')`, `.eq('barbearia_id', ...)`, nomes de canal Realtime, chaves de `localStorage` e `functions.invoke('...')` são texto. O `tsc` **não** avisa quando você erra uma delas. Toda fase que renomear algo termina com um `git grep` para achar o que sobrou.
7. **Nunca escreva chaves, tokens ou senhas** em arquivo versionado. Só em `.env` (ignorado pelo Git) e em secrets do Supabase.
8. **Pare e pergunte** quando faltar uma decisão que não esteja na Fase 1. O nome do produto é **Marcadô**.
9. Ao fim de cada fase, **liste** o que mudou, o que sobrou e o resultado das verificações.

---

## Fase 0: Preparação e linha de base

**Objetivo:** ter uma régua para saber se a refatoração quebrou algo.

1. Crie a branch `refactor/nicho-beleza`.
2. **Corrija o alias do TypeScript.** O `tsconfig.json` tem `"paths": { "@/*": ["./*"] }`, mas o Vite aponta `@` para `./src`. Ajuste para `"@/*": ["./src/*"]`, e garanta `"types": ["vite/client"]` para o `import.meta.env`. Sem isso, o editor e o `tsc` não resolvem os imports e o "renomear símbolo" falha.
3. Adicione o script `"typecheck": "tsc --noEmit"` ao `package.json`.
4. Rode `npm install`, `npm run typecheck` e `npm run build`. **Anote o número de erros** do typecheck como linha de base (o projeto não tem `strict`, então pode haver erros antigos; eles não são problema desta tarefa, mas o número não pode piorar).
5. As Edge Functions rodam em Deno e **não entram** no `tsc`. Se o Deno estiver instalado, rode `deno check supabase/functions/*/index.ts` e anote o resultado também.
6. Registre a contagem inicial do vocabulário antigo:
   ```bash
   git grep -ihoE "barb" -- . ':!package-lock.json' ':!pnpm-lock.yaml' | wc -l
   ```
   (Hoje: cerca de 1.400 ocorrências em 46 arquivos.)

**Verificação:** typecheck e build rodam; números anotados. **Commit:** `chore: alias @ e script typecheck`.

---

## Fase 1: Glossário e decisões

### 1.1 Decisões que a IA deve pedir ao dono do projeto antes de seguir

| # | Decisão | Padrão sugerido |
|---|---|---|
| 1 | **Nome do produto** (hoje "BarberPro") | **Marcadô** (decidido) |
| 2 | Nome interno do estabelecimento | `estabelecimento` (decidido) |
| 3 | Nome interno de quem atende | `profissional` (decidido) |
| 4 | Nichos iniciais | `barbearia`, `salao`, `estetica`, `manicure`, `outro` |
| 5 | Clientes | **separados por estabelecimento** (decidido) |
| 6 | Seção de preços da landing | **escondida** até definir o pagamento (decidido) |

O nome do produto é **Marcadô**. Use esse nome em títulos, textos, README, `package.json` e e-mails. Para o identificador técnico (`package.json` → `name`, slug, domínio), use `marcado` (minúsculas, sem acento). Esta fase não precisa mais perguntar nada ao dono, apenas confirmar o glossário.

### 1.2 Glossário (congelar antes de tocar em qualquer arquivo)

| Hoje | Nome interno novo | Observação |
|---|---|---|
| `barbearia`, `barbearias` | `estabelecimento`, `estabelecimentos` | tabela e tipos |
| `Barbearia` (tipo/interface) | `Estabelecimento` | |
| `barbershop`, `barbershop_id` | `estabelecimento`, `estabelecimento_id` | |
| `barbearia_id` | `estabelecimento_id` | em `barbeiros`, `servicos`, `agendamentos` |
| `barbeiro`, `barbeiros` | `profissional`, `profissionais` | tabela e tipos |
| `Barbeiro` (tipo/interface) | `Profissional` | |
| `barbeiro_id` | `profissional_id` | |
| `barbeiro_nome` | `profissional_nome` | em `agendamentos` |
| `barbeiro_disponibilidade` | `profissional_disponibilidade` | |
| `professional_types` | `tipos_profissional` | colunas abaixo |
| `professional_types.name` | `tipos_profissional.nome` | |
| `professional_types.commission_percent` | `tipos_profissional.percentual_comissao` | |
| `professional_types.barbershop_id` | `tipos_profissional.estabelecimento_id` | |
| `barbeiros.professional_type_id` | `profissionais.tipo_profissional_id` | |
| `UserRole.BARBEARIA` (`'barbearia'`) | `UserRole.ESTABELECIMENTO` (`'estabelecimento'`) | valor gravado em `app_metadata.role` |
| `UserRole.BARBEIRO` (`'barbeiro'`) | `UserRole.PROFISSIONAL` (`'profissional'`) | |
| `UserRole.ADMIN`, `UserRole.CLIENTE` | **ficam** | |
| `user.barbeariaId`, `barbeariaNome`, `barbeiroId` | `estabelecimentoId`, `estabelecimentoNome`, `profissionalId` | tipo `User` |
| `fotos-barbearias`, `fotos-barbeiros` | `fotos-estabelecimentos`, `fotos-profissionais` | buckets |
| `system-assets` | fica | |
| `servicos`, `clientes`, `agendamentos`, `planos`, `gastos_saas`, `system_settings` | **ficam** | já são neutros |
| `dono_id`, `dono_nome`, `dono_email`, `trial_*`, `comissao_padrao` | **ficam** | já são neutros |
| `AppointmentStatus` (`pendente`, `confirmado`, `concluido`, `cancelado`) | **fica** | sem acento em `concluido` |

### 1.3 Convenções

- **Banco e textos de tela em português.** Identificadores de código (verbos) podem continuar em inglês.
- **Slugs de Edge Functions em inglês:** `create-professional-user`, `create-establishment`, etc. (lista na Fase 7).
- **Valores de `nicho`** em minúsculas, sem acento: `barbearia`, `salao`, `estetica`, `manicure`, `outro`.

**Entregável:** salve este glossário em `docs/GLOSSARIO.md` (a IA deve criar esse arquivo na fase, pois ele é parte do projeto) e **peça o ok** antes da Fase 2. **Commit:** `docs: glossario de nomes`.

---

## Fase 2: Renomear arquivos e pastas (`git mv`)

Antes, rode `git ls-files | grep -iE 'barb'` e confira a lista atual. Esperado:

**Em `src/pages/`:**

| De | Para |
|---|---|
| `pages/barbearia/` (pasta) | `pages/estabelecimento/` |
| `barbearia/BarbeariaPage.tsx` | `estabelecimento/EstabelecimentoPage.tsx` |
| `barbearia/BarberModal.tsx` | `estabelecimento/ProfissionalModal.tsx` |
| `barbearia/BarberPerformanceModal.tsx` | `estabelecimento/ProfissionalDesempenhoModal.tsx` |
| `barbeiro/` (pasta) | `profissional/` |
| `barbeiro/BarbeiroPage.tsx` | `profissional/ProfissionalPage.tsx` |
| `admin/BarbershopModal.tsx` | `admin/EstabelecimentoModal.tsx` |

Os demais arquivos de `pages/barbearia/` (`ClientEditModal`, `ClientHistoryModal`, `InitialSetupPage`, `ManageProfessionalTypes`, `ProfessionalTypeModal`, `ProfilePage`, `ServiceModal`) mudam só de pasta; renomeie `ManageProfessionalTypes` → `GerenciarTiposProfissional` e `ProfessionalTypeModal` → `TipoProfissionalModal`.

**Em `supabase/functions/`** (a renomeação do conteúdo é na Fase 7; aqui só as pastas):

| De | Para |
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

As demais funções (`create-appointment`, `cancel-client-appointment`, `get-client-appointment`, `get-client-appointments-history`, `find-or-create-client`, `get-admin-dashboard`, `get-admin-users`, `create/update/delete-admin-user`, `keep-alive`, `payment-webhook-*`) **mantêm o nome**.

Depois de mover, **atualize todos os imports** dos arquivos movidos e as rotas. Rode `npm run typecheck` e compare com a linha de base.

**Verificação:** `git ls-files | grep -iE 'barb'` volta vazio. **Commit:** `refactor: renomeia arquivos e pastas`.

---

## Fase 3: Tipos, enums e constantes (`src/types.ts` e vizinhos)

1. `UserRole`: `BARBEARIA`/`'barbearia'` → `ESTABELECIMENTO`/`'estabelecimento'`; `BARBEIRO`/`'barbeiro'` → `PROFISSIONAL`/`'profissional'`.
2. Interfaces: `Barbearia` → `Estabelecimento`; `Barbeiro` → `Profissional`; `BarbeiroDisponibilidade` → `ProfissionalDisponibilidade`; `ProfessionalType` → `TipoProfissional`.
3. Campos, conforme o glossário: `barbearia_id` → `estabelecimento_id`, `barbeiro_id` → `profissional_id`, `barbeiro_nome` → `profissional_nome`, `professional_type_id` → `tipo_profissional_id`, `professional_types` → `tipos_profissional` (join), `barbershop_id` → `estabelecimento_id`, `commission_percent` → `percentual_comissao`, `name` (do tipo profissional) → `nome`.
4. `User`: `barbeariaId`, `barbeariaNome`, `barbeiroId` → `estabelecimentoId`, `estabelecimentoNome`, `profissionalId`.
5. **Adicione o campo `nicho`** à interface `Estabelecimento`:
   ```ts
   export type Nicho = 'barbearia' | 'salao' | 'estetica' | 'manicure' | 'outro';
   // em Estabelecimento:
   nicho: Nicho;
   ```
6. Use o renomear-símbolo do editor (F2) sempre que possível, e depois rode `npm run typecheck`.

**Verificação:** o typecheck não pode ter mais erros que a linha de base **além** dos que apontam para arquivos ainda não migrados. **Commit:** `refactor: tipos e enums`.

---

## Fase 4: Camada de serviços (`src/services/api.ts` e `src/integrations`)

1. Renomeie os métodos (`getBarbeariaBySlug` → `getEstabelecimentoBySlug`, `createBarbeiro...` → `createProfissional...`, `updateBarbearia` → `updateEstabelecimento`, etc.). Liste os métodos atuais com `grep -nE "^\s+(async )?[a-zA-Z]+\(|: async" src/services/api.ts` antes.
2. Atualize **todas as strings** do Supabase:
   - `.from('barbearias')` → `.from('estabelecimentos')`, `.from('barbeiros')` → `.from('profissionais')`, `.from('professional_types')` → `.from('tipos_profissional')`, `.from('barbeiro_disponibilidade')` → `.from('profissional_disponibilidade')`.
   - Colunas em `.eq(...)`, `.select(...)`, `.insert(...)`, `.upsert(...)`, `.order(...)`, `.in(...)`.
   - Joins no `select`, como `professional_types(commission_percent)`.
   - `onConflict` de `upsert` (hoje usa `barbeiro_id,data`).
3. Atualize `supabase.functions.invoke('...')` para os novos slugs da Fase 2.
4. Atualize os nomes dos buckets nas chamadas de upload (`uploadPhoto(file, 'fotos-estabelecimentos')` e `'fotos-profissionais'`).
5. Atualize o canal Realtime em `NotificationProvider` (nome do canal e filtros `estabelecimento_id=eq.` e `profissional_id=eq.`; a tabela `agendamentos` não muda).
6. Atualize `AuthProvider` e `ProtectedRoute` para os novos valores de papel e campos do `User`.

**Verificação:**
```bash
git grep -nE "barbearia|barbeiro|barbershop|professional_type|commission_percent" -- src/services src/providers src/integrations
```
deve voltar vazio. **Commit:** `refactor: api, providers e strings do supabase`.

---

## Fase 5: Páginas e componentes (identificadores e rotas)

Arquivos mais pesados: `EstabelecimentoPage.tsx` (~182 ocorrências), `PublicBookingPage.tsx` (~64), `AdminPage.tsx` (~46), `ProfissionalModal.tsx` (~40), `ProfissionalPage.tsx` (~34).

1. Renomeie **variáveis, estados, props, funções e nomes de componentes** (ex.: `barbearia` → `estabelecimento`, `setBarbearia` → `setEstabelecimento`, `barbeiros` → `profissionais`, `BarberModal` → `ProfissionalModal`). **Textos exibidos não são mexidos aqui**: ficam para a Fase 6.
2. **Rotas** (`App.tsx`): troque os caminhos e os redirecionamentos por papel (`/barbeiro` → `/profissional`, o painel do dono → `/estabelecimento`, etc.). Antes de trocar, **liste as rotas atuais** e confira se algum link externo ou do `index.html` depende delas.
3. `localStorage`/`sessionStorage`: procure chaves com "barb" ou "barbearia" (`git grep -nE "(local|session)Storage" src`) e renomeie, mantendo o `try/catch` em volta.
4. Classes CSS, `id`s e `data-testid` com "barb" também entram.
5. Não deixe nenhum comentário com o vocabulário antigo.

**Verificação:** `npm run typecheck` volta ao número da linha de base (ou menos) e `npm run build` passa. `git grep -inE "barb" -- src` deve listar **apenas textos visíveis** (que a Fase 6 trata) e o tipo `Nicho`. **Commit:** `refactor: paginas e componentes`.

---

## Fase 6: Vocabulário por nicho (o que torna o sistema realmente "aberto")

### 6.1 Criar o mapa

Crie `src/config/vocabulario.ts`:

```ts
import type { Nicho } from '@/types';

export interface Termo {
  singular: string;
  plural: string;
  artigo: 'o' | 'a';          // "o barbeiro" / "a cabeleireira"
}

export interface Vocabulario {
  estabelecimento: Termo;      // "Barbearia", "Salão", "Estúdio"
  profissional: Termo;         // "Barbeiro", "Cabeleireira", "Esteticista"
  tituloAgendamento: string;   // ex.: "Agende seu horário"
}

export const VOCABULARIO: Record<Nicho, Vocabulario> = {
  barbearia: {
    estabelecimento: { singular: 'Barbearia', plural: 'Barbearias', artigo: 'a' },
    profissional:    { singular: 'Barbeiro',  plural: 'Barbeiros',  artigo: 'o' },
    tituloAgendamento: 'Agende seu horário',
  },
  salao: {
    estabelecimento: { singular: 'Salão',       plural: 'Salões',        artigo: 'o' },
    profissional:    { singular: 'Profissional', plural: 'Profissionais', artigo: 'o' },
    tituloAgendamento: 'Agende seu horário',
  },
  estetica: {
    estabelecimento: { singular: 'Estúdio',     plural: 'Estúdios',      artigo: 'o' },
    profissional:    { singular: 'Esteticista', plural: 'Esteticistas',  artigo: 'a' },
    tituloAgendamento: 'Agende seu atendimento',
  },
  manicure: {
    estabelecimento: { singular: 'Espaço',    plural: 'Espaços',    artigo: 'o' },
    profissional:    { singular: 'Manicure',  plural: 'Manicures',  artigo: 'a' },
    tituloAgendamento: 'Agende seu horário',
  },
  outro: {
    estabelecimento: { singular: 'Estabelecimento', plural: 'Estabelecimentos', artigo: 'o' },
    profissional:    { singular: 'Profissional',    plural: 'Profissionais',    artigo: 'o' },
    tituloAgendamento: 'Agende seu horário',
  },
};

export const vocabularioDe = (nicho?: Nicho): Vocabulario =>
  VOCABULARIO[nicho ?? 'outro'] ?? VOCABULARIO.outro;
```

Crie também um hook `useVocabulario()` em `src/hooks/` que devolve `vocabularioDe(estabelecimento.nicho)` para as telas do dono, do profissional e da página pública.

### 6.2 Aplicar nos textos

1. Percorra **cada arquivo** que ainda tenha texto visível com o vocabulário antigo (`git grep -nE "[Bb]arb" -- src index.html`).
2. Para cada texto, decida **um a um**:
   - **Telas do dono, do profissional e página pública de agendamento:** use o vocabulário do nicho do estabelecimento. Cuidado com **artigo e plural**: use `termo.artigo` e `termo.plural`, nunca concatene "s".
   - **Painel do administrador do SaaS** (que gerencia todos os estabelecimentos): use o vocabulário **genérico** ("Estabelecimentos", "Profissionais"), sem depender de nicho.
   - **Mensagens de erro e toasts** (`toast.error(...)`, `toast.success(...)`): mesma regra.
3. **Cadastro e edição do estabelecimento:** adicione um **seletor de nicho** (admin ao criar; dono em "Perfil"). `InitialSetupPage` também pergunta o nicho.
4. **Onboarding por nicho (opcional nesta fase, recomendado):** ao escolher o nicho no `InitialSetupPage`, ofereça uma lista de **serviços de exemplo** daquele nicho, que o dono confirma ou edita antes de salvar. Crie `src/config/servicosExemplo.ts` com 4 a 6 serviços por nicho (nome, duração em minutos, preço sugerido).

**Verificação:** troque o `nicho` de um estabelecimento de teste entre `barbearia` e `salao` e confirme que **todas as telas** (dono, profissional e página pública) mudam o vocabulário, sem erro de concordância. `git grep -inE "barb" -- src` só pode retornar `'barbearia'` como **valor de `nicho`** e o texto do vocabulário. **Commit:** `feat: vocabulario por nicho`.

---

## Fase 7: Edge Functions (conteúdo)

Para cada função renomeada na Fase 2 e para as demais:

1. **Papéis:** `app_metadata?.role` com os novos valores (`'admin'`, `'estabelecimento'`, `'profissional'`). **Nunca** `user_metadata` para papel.
2. **Tabelas e colunas** conforme o glossário (`estabelecimentos`, `profissionais`, `estabelecimento_id`, `profissional_id`, `tipos_profissional`, `percentual_comissao`, etc.).
3. **Ao criar usuário** (`create-establishment`, `create-professional-user`, `create-admin-user`, e `payment-webhook-user-creation`): `app_metadata: { role: '<novo valor>' }` e `user_metadata: { full_name, ... }`.
4. **`update-establishment`:** mantenha a **lista de campos permitidos ao dono** (nome, endereço, documento, telefone, link_personalizado, dono_nome, imagens, textos, horários, `comissao_padrao`) e **acrescente `nicho`**. `plano`, `status`, `trial_*` e `dono_id` seguem **só para admin**.
5. **`get-establishment-dashboard`:** o status concluído é `'concluido'` (sem acento).
6. **`get-professional-dashboard` e `get-professional-performance`:** corrigir o vocabulário e as colunas.
7. **Mensagens de resposta** (`error: '...'`) trocam o vocabulário por termos neutros ("estabelecimento", "profissional").
7b. **Clientes por estabelecimento:** `find-or-create-client`, `create-appointment`, `get-client-appointment`, `get-client-appointments-history` e `cancel-client-appointment` recebem `estabelecimento_id` e filtram por ele. `create-appointment` deve validar que serviço, profissional e cliente pertencem ao **mesmo** estabelecimento.
8. **Fuso horário:** trocar `new Date().toISOString()` por cálculo no fuso `America/Fortaleza` (ou configurável por estabelecimento) onde a função decide "hoje".
9. **Webhooks de pagamento:** só vocabulário. **Não** mexer no token, na assinatura nem no fluxo. Eles **não entram no deploy**.
10. Rode `deno check` e compare com a linha de base.

**Verificação:**
```bash
git grep -nE "barbearia|barbeiro|barbershop|barber|user_metadata\??\.role" -- supabase
```
deve voltar vazio (exceto o vocabulário dos webhooks de pagamento, se houver, e o valor `'barbearia'` de `nicho`). **Commit:** `refactor: edge functions`.

---

## Fase 8: Banco de dados (SQL para o projeto Supabase novo)

Esta fase **gera os arquivos de migração** em `supabase/migrations/`, numerados e nunca editados depois de rodarem (`0001_...`, `0002_...`). Use as **mesmas convenções** do Núcleo (`nucleo-agente-crm`): `DATABASE.md` como referência, migrações numeradas, consultas de verificação no fim.

> O schema abaixo foi **reconstruído a partir do código** (o banco original foi perdido). Se algum campo faltar, a IA deve procurar o uso real em `src/` e `supabase/functions/` antes de decidir.

### 8.1 Tabelas (nomes finais)

| Tabela | Colunas principais |
|---|---|
| `system_settings` | `id` (sempre 1, índice único `((true))`), `system_name`, `support_email`, `contact_email`, `tos_link`, `logo_url`, `updated_at` |
| `planos` | `id`, `nome` (único), `preco`, `features text[]`, `ativo`, `popular`, `limite_profissionais` (null = ilimitado) |
| `estabelecimentos` | `id`, `nome`, `dono_id` → `auth.users` (único), `dono_nome`, `dono_email`, `nicho` (`CHECK` nos 5 valores, padrão `'outro'`), `plano`, `link_personalizado` (**único**), `endereco`, `documento`, `telefone`, `status` (`'ativa'`/`'inativa'`), `criado_em`, `foto_url`, `instagram_url`, `whatsapp_url`, `hero_image_url`, `hero_title`, `hero_subtitle`, `services_title`, `social_title`, `social_subtitle`, `operating_days int[]`, `start_time`, `end_time`, `comissao_padrao`, `trial_started_at`, `trial_expires_at` |
| `tipos_profissional` | `id`, `estabelecimento_id` → `estabelecimentos` (**ON DELETE CASCADE**), `nome`, `percentual_comissao`, `created_at` |
| `profissionais` | `id`, `user_id` (null = sem login) → `auth.users`, `estabelecimento_id` (CASCADE), `nome`, `email`, `telefone`, `especialidade`, `foto_url`, `ativo`, `tipo_profissional_id`, `criado_em` |
| `servicos` | `id`, `estabelecimento_id` (CASCADE), `nome`, `preco`, `duracao` (minutos, `CHECK` 1..600), `imagem_url` |
| `clientes` | `id`, `estabelecimento_id` (CASCADE), `nome`, `telefone`, `criado_em`; **`UNIQUE (estabelecimento_id, telefone)`** (o mesmo telefone pode existir em estabelecimentos diferentes) |
| `agendamentos` | `id`, `cliente_id`, `cliente_nome`, `cliente_email`, `cliente_telefone`, `profissional_id`, `profissional_nome`, `servico_id`, `servico_nome`, `estabelecimento_id`, `data date`, `hora time`, `status` (`CHECK`: `pendente`, `confirmado`, `concluido`, `cancelado`) |
| `profissional_disponibilidade` | `id`, `profissional_id` (CASCADE), `data`, `hora_inicio`, `hora_fim`, `disponivel`; **`UNIQUE (profissional_id, data)`** (exigido pelo `upsert`) |
| `gastos_saas` | `id`, `descricao`, `valor`, `data`, `user_id`, `created_at` |

Todas as chaves estrangeiras com o comportamento certo de exclusão (`delete-establishment` apaga só a linha do estabelecimento e **espera a cascata**).

### 8.2 Padrões obrigatórios (aprendidos no Núcleo e nos bugs do projeto)

1. **Agendamento duplo impedido no banco**, não no JavaScript: `data_fim` mantida por trigger BEFORE e `EXCLUDE USING gist` com `btree_gist` sobre `(profissional_id, tstzrange(inicio, data_fim))` para `status IN ('pendente','confirmado')`. A violação devolve `23P01`; as funções devem traduzir isso em "horário acabou de ser ocupado" (409).
2. **Telefone canônico:** só dígitos com DDI, normalizado por trigger BEFORE; índice único em `clientes (estabelecimento_id, telefone)`.
3. **Cliente por estabelecimento (decidido):** `clientes` tem `estabelecimento_id`. Editar o nome de um cliente afeta só aquele estabelecimento. `agendamentos.cliente_id` deve pertencer ao mesmo `estabelecimento_id` do agendamento (valide na Edge Function ou com chave estrangeira composta). RLS: o dono e o profissional só enxergam clientes do próprio estabelecimento. Reflita isso na Fase 7 (`find-or-create-client`, `create-appointment`, `get-client-appointment`, `get-client-appointments-history`, `cancel-client-appointment`): todas passam a receber e filtrar por `estabelecimento_id`.
4. **Preço e duração gravados no agendamento** (`preco_cobrado`, `duracao_minutos`), para que mudar o preço de um serviço não reescreva o faturamento histórico.
5. **Dados públicos por view, não pela tabela:** a página pública de agendamento lê só `nome`, `link_personalizado`, imagens, textos, horários, `whatsapp_url`, `instagram_url` e `nicho` numa **view `estabelecimentos_publico`**, com `GRANT SELECT` ao `anon`. **Nenhum `SELECT` do `anon` na tabela `estabelecimentos`** (ela tem `documento` e `dono_email`).
6. **RLS em todas as tabelas**, com o papel lido de `auth.jwt() -> 'app_metadata' ->> 'role'` (nunca de `user_metadata`). O dono só enxerga o próprio estabelecimento (`dono_id = auth.uid()`); o profissional só o que é dele; o admin tudo.
7. **Funções `SECURITY DEFINER`:** `REVOKE EXECUTE ... FROM PUBLIC, anon` e `GRANT` só a quem precisa; `SET search_path = public`.
8. **Storage:** buckets públicos `fotos-estabelecimentos`, `fotos-profissionais` e `system-assets`, com policies de escrita restritas a usuários autenticados do próprio estabelecimento.
9. **Realtime:** `ALTER PUBLICATION supabase_realtime ADD TABLE agendamentos;`.
10. **Seed:** `system_settings` com `id = 1`; planos básicos (nomes livres, sem vínculo com pagamento por ora).
11. **Primeiro admin:** não vai em migração. Documente o passo manual: criar o usuário em Authentication (com *Auto Confirm User*) e rodar:
    ```sql
    update auth.users
    set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
    where email = 'EMAIL_DO_ADMIN';
    ```

### 8.3 Documentação do banco

Crie `DATABASE.md` no estilo do Núcleo (migrações uma a uma, tabelas com coluna/tipo/nulo/padrão, RLS, Storage, armadilhas e consultas de verificação) e `supabase/README.md` com a ordem de execução no SQL Editor.

**Verificação:** rodar as migrações num projeto Supabase **de teste** e executar as consultas de verificação (contagem de tabelas, policies e uma conferência de que o `anon` **não** lê `estabelecimentos`). **Commit:** `feat(db): migracoes do schema novo`.

---

## Fase 9: Landing page, marca e documentos

1. **`index.html` (corrige o item B):** troque a URL e a chave do Supabase antigo escritas no código por:
   ```js
   const SUPABASE_URL = "%VITE_SUPABASE_URL%";
   const SUPABASE_KEY = "%VITE_SUPABASE_ANON_KEY%";
   ```
   (o Vite substitui `%VAR%` no HTML). Remova o ref antigo `staimtbbfkfexekkimiw` de qualquer lugar.
2. **`planLinks` da landing** aponta para checkouts da Kiwify que não serão usados. **Decidido:** esconder a seção de preços. Comente o trecho (não apague) e deixe `TODO: reativar quando definir a forma de pagamento`. Remova os links da Kiwify. Mantenha a tabela `planos` no banco.
   - Troque o botão principal ("Assinar") por **"Começar teste grátis" ou "Falar no WhatsApp"** (use o número configurável em `system_settings`, sem número fixo no código).
   - Confira o fluxo de cadastro: hoje quem cria o estabelecimento é o admin. Se o botão for "teste grátis", o dono precisa de um jeito de pedir o cadastro (formulário simples ou WhatsApp); não crie cadastro automático nesta tarefa.
3. **Textos da landing:** vocabulário aberto ao nicho de beleza (barbearias, salões, estúdios, manicures), com o nome **Marcadô**.
4. `README.md`, `AI_RULES.md`, `metadata.json`, `package.json` (`name`, `description`), `<title>` e favicon: nome e vocabulário novos. Corrija no README o link de caminho local (`file:///c:/Users/...`) e a porta (5173 vs 3000, conferir no `vite.config.ts`).
5. Atualize `.env.example` (sem valores reais) e confirme que `.env` está no `.gitignore`.
6. Atualize `CLAUDE.md`/`AGENTS.md` (se existirem ou forem criados) para descrever o glossário e a regra do vocabulário por nicho.

**Verificação:** `git grep -inE "barb|staimtbbfkfexekkimiw|kiwify" -- . ':!package-lock.json' ':!pnpm-lock.yaml'` só pode retornar o que for proposital (valor `'barbearia'` do nicho e os arquivos dos webhooks adiados). **Commit:** `docs: marca, landing e readme`.

---

## Fase 10: Endurecer a autenticação (item C)

1. `AuthProvider.tsx` (linha ~41) e `api.ts`: troque `app_metadata?.role || user_metadata?.role` por **somente** `app_metadata?.role`. Não existem usuários antigos no projeto novo, então o *fallback* só mantém a tela confiando num campo que o usuário pode editar.
2. **Trial:** o `AuthProvider` lê `trial_expires_at` de `user_metadata` com prioridade sobre o banco. Leia **somente** o valor de `estabelecimentos` (tabela).
3. `SettingsPage.tsx` faz `supabase.auth.updateUser({ data: { full_name } })`: isso é correto (só nome), mas confirme que **nenhum** `updateUser` grava papel ou trial.
4. **Bloqueio de estabelecimento inativo:** `ProtectedRoute` e as Edge Functions do dono/profissional devem recusar quando `estabelecimentos.status = 'inativa'` (hoje isso não é aplicado em lugar nenhum).

**Verificação:** `git grep -nE "user_metadata" -- src supabase` só pode mostrar leitura/gravação de `full_name`, `phone` e afins, **nunca papel nem trial**. **Commit:** `fix(auth): papel e trial somente de fontes confiaveis`.

---

## Fase 11: Verificação final e deploy no projeto novo

### 11.1 Checagens automáticas

```bash
npm run typecheck     # <= linha de base da Fase 0
npm run build         # sem erros
git grep -inE "barb" -- . ':!package-lock.json' ':!pnpm-lock.yaml'   # só o valor de nicho e o vocabulário
git grep -nE "user_metadata\??\.role" -- src supabase                  # vazio
```

### 11.2 Montar o projeto Supabase novo (ações do dono, a IA só guia)

1. Criar conta e projeto (região São Paulo); guardar a senha do banco; copiar **só** a Project URL, a chave pública e o ref. **Nunca** a `service_role` em arquivo do projeto.
2. Rodar as migrações da Fase 8, na ordem.
3. Criar o admin e dar o papel (SQL da Fase 8.2, item 11).
4. Preencher `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Publicar as Edge Functions com `supabase functions deploy <nome>`, **exceto** `payment-webhook-user-creation` e `payment-webhook-status-update`.
6. Conferir o `keep-alive` (evita pausa do projeto gratuito por inatividade) e agendá-lo se for usado.

### 11.3 Teste manual dos 4 papéis (nichos `barbearia` e `salao`)

| Papel | Teste |
|---|---|
| **Admin** | criar estabelecimento (escolhendo o nicho), editar plano, ver o dashboard |
| **Estabelecimento (dono)** | concluir o setup inicial, criar serviço e profissional, ver o dashboard (renda não pode vir zerada) |
| **Profissional** | entrar, ver a própria agenda, marcar disponibilidade |
| **Cliente (público)** | abrir `/<slug>`, agendar, ver histórico, cancelar. Tentar agendar o **mesmo horário** duas vezes: o segundo deve ser recusado |

Em todos, confirme que o vocabulário muda conforme o nicho e que não aparece a palavra "barbearia" num estabelecimento do tipo `salao`.

---

## Fase 12 (opcional, só depois de tudo acima funcionando): atender melhor o salão

O modelo atual tem **um serviço por agendamento**. Salões costumam combinar serviços (corte + coloração) e têm durações longas.

1. Tabela `agendamento_servicos` (`agendamento_id`, `servico_id`, `preco_cobrado`, `duracao_minutos`), com a duração total do agendamento somando as linhas.
2. Grade de horários que respeite a duração total (a lógica atual compara horários exatos e não detecta sobreposição entre serviços de tamanhos diferentes).
3. Profissionais que só fazem alguns serviços (tabela `profissional_servicos`; sem linha = faz todos), como no Núcleo.
4. Comissão por serviço, além da por tipo de profissional.

---

## Pendências conhecidas (fora do escopo, **não corrigir sem pedir**)

- Senha inicial igual ao CPF no `payment-webhook-user-creation` (resolver junto com o futuro sistema de pagamento).
- `auth.admin.getUserByEmail` não existe no supabase-js v2; fixar a versão importada nas Edge Functions.
- `create-appointment` espalha `...agendamentoData` no insert com chave de serviço e não valida que serviço e profissional pertencem ao estabelecimento: ao reescrevê-la, validar campos permitidos e propriedade.
- `get-client-appointments-history` e `cancel-client-appointment` confiam só no telefone, sem *rate limit*.
- Limite de profissionais verificado só em `create-professional-user` (não atômico).
- Comissão calculada de forma diferente entre o dashboard do estabelecimento e o do profissional.
- Logs de payload com CPF, e-mail e telefone (LGPD).
- Sem testes automatizados, lint ou CI; `BarbeariaPage` (agora `EstabelecimentoPage`) com ~1.000 linhas e dezenas de `useState`.
- `package-lock.json` e `pnpm-lock.yaml` coexistem; escolher um gerenciador e apagar o outro lockfile.

---

## Resumo das fases

| Fase | O que faz | Resultado esperado |
|---|---|---|
| 0 | Branch, alias do TS, linha de base | typecheck e build rodando |
| 1 | Glossário e decisões | `docs/GLOSSARIO.md`, ok do dono |
| 2 | `git mv` de arquivos e pastas | nenhum arquivo com "barb" |
| 3 | Tipos e enums | tipos neutros + `Nicho` |
| 4 | `api.ts`, providers, strings do Supabase | nenhuma string antiga |
| 5 | Páginas, componentes e rotas | identificadores neutros |
| 6 | Vocabulário por nicho | tela muda conforme o nicho |
| 7 | Edge Functions | funções renomeadas e coerentes |
| 8 | SQL do banco novo | migrações + `DATABASE.md` |
| 9 | Landing, marca e documentos | sem ref antigo, sem Kiwify |
| 10 | Autenticação | papel e trial de fontes confiáveis |
| 11 | Verificação e deploy | 4 papéis testados |
| 12 | (opcional) melhorias para salão | multi-serviço e duração |
