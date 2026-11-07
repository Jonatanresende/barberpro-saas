# ✨ Marcadô (Sistema de Gestão & Agendamento para o Nicho da Beleza)

> Plataforma SaaS Multi-tenant completa para gestão de barbearias, salões de beleza, clínicas de estética, manicures e espaços de beleza em geral, com agendamento online inteligente e controle financeiro automatizado.

---

## 📌 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades por Perfil](#-funcionalidades-por-perfil)
  - [👑 Painel do Administrador (Super Admin)](#-painel-do-administrador-super-admin)
  - [🏢 Painel do Estabelecimento (Tenant / Proprietário)](#-painel-do-estabelecimento-tenant--proprietário)
  - [✂️ Painel do Profissional](#️-painel-do-profissional)
  - [📱 Portal Público & Agendamento do Cliente](#-portal-público--agendamento-do-cliente)
- [🚀 Landing Page de Vendas & Conversão](#-landing-page-de-vendas--conversão)
- [⚡ Supabase Edge Functions](#-supabase-edge-functions)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📁 Estrutura de Pastas](#-estrutura-de-pastas)
- [⚙️ Como Rodar Localmente](#️-como-rodar-localmente)
  - [Pré-requisitos](#pré-requisitos)
  - [Passo a Passo](#passo-a-passo)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
- [📜 Regras de Desenvolvimento](#-regras-de-desenvolvimento)

---

## 📖 Sobre o Projeto

O **Marcadô** foi desenvolvido para modernizar e substituir as agendas manuais de papel e o atendimento desorganizado via WhatsApp em estabelecimentos de beleza e estética de qualquer porte (barbearias, salões de beleza, estúdios de estética, esmalterias/manicures, etc.). 

A aplicação opera em arquitetura **Multi-tenant**, onde cada estabelecimento possui seu próprio endereço público (`/:slug`), vocabulário contextual ao seu nicho, página institucional customizada, equipe de profissionais, serviços e regras de negócio independentes, tudo gerenciado por uma infraestrutura centralizada e escalável baseada em **Supabase** e **React**.

---

## 🎯 Funcionalidades por Perfil

### 👑 Painel do Administrador (Super Admin)
Acesso restrito para a equipe de gestão da plataforma SaaS:

- **Dashboard Executivo:**
  - Métricas de Receita Mensal Estimada e Gastos Mensais Totais.
  - Indicadores de total de estabelecimentos cadastrados vs. ativos.
  - Gráfico analítico de crescimento de novos estabelecimentos (via Recharts).
  - Listagem dos estabelecimentos recentemente adicionados.
- **Gestão de Estabelecimentos:**
  - Cadastro manual de novos estabelecimentos e seus respectivos donos.
  - Seleção do nicho de atuação (`barbearia`, `salao`, `estetica`, `manicure`, `outro`).
  - Edição de status (`ativa` / `inativa`), plano contratado, endereço, documento e dados de contato.
  - Upload de logotipos e fotos dos estabelecimentos.
  - Exclusão com limpeza em cascata (Auth e dados).
- **Gestão de Planos de Assinatura:**
  - Criação e manutenção de planos (ex: Básico, Profissional, Trial).
  - Definição de preços mensais, limites de profissionais permitidos, status ativo e destaque de popularidade ("Mais Escolhido").
  - Listagem customizada de recursos e benefícios incluídos no plano.
- **Controle de Gastos da Plataforma (Gastos SaaS):**
  - Registro de despesas operacionais da plataforma (servidores, APIs, domínios, marketing).
  - Histórico de saídas com descrição, valor e data para controle de lucro líquido real.
- **Configurações Gerais & Marca:**
  - Personalização de `system_name`, e-mails de suporte/contato e links de termos de uso.
  - Upload centralizado do logotipo global da plataforma.
  - Gestão de outros administradores (criação, edição e alteração de senhas).

---

### 🏢 Painel do Estabelecimento (Tenant / Proprietário)
Ambiente exclusivo do estabelecimento acessível via `/:slug/dashboard`:

- **Assistente de Onboarding Inicial (`/initial-setup`):**
  - Configuração rápida na primeira entrada para definição do nome oficial, seleção do nicho e criação automática de serviços de exemplo pré-configurados.
- **Controle de Período Trial:**
  - Notificação de tempo de teste e redirecionamento amigável para tela de expiração (`/trial-expired`) com link direto para contratação de planos.
- **Dashboard Financeiro e Operacional:**
  - Faturamento em tempo real: Renda de Hoje, Renda da Semana e Renda do Mês.
  - Total de agendamentos do dia, profissionais ativos e clientes únicos na base.
  - Painel de status rápido dos profissionais no dia (Disponível vs. Folga).
  - Tabela de **Comissões a Pagar no Mês** por profissional.
- **Gestão de Profissionais:**
  - Cadastro de profissionais com ou sem acesso ao sistema (com login independente ou apenas registro interno).
  - Upload de foto do perfil, especialidade, telefone e e-mail.
  - Vínculo com tipos de profissionais e comissões.
  - Modal de **Desempenho Individual (30 dias)** com faturamento gerado, comissão devida e histórico de serviços.
- **Tipos de Profissionais & Comissões (Exclusivo Plano Profissional):**
  - Criação de categorias com percentuais de comissão diferenciados por tipo.
- **Gestão do Catálogo de Serviços:**
  - Cadastro e edição de serviços: nome, preço, duração (minutos) e imagens.
- **Gestão Centralizada de Agendamentos:**
  - Listagem completa ordenada por data e horário.
  - Filtro por status: Pendente, Confirmado, Concluído e Cancelado.
  - Filtro por profissional.
  - Atualização com 1 clique de status do agendamento.
- **Base de Clientes:**
  - Cadastro automatizado de clientes por estabelecimento conforme agendamentos realizados.
  - Edição de dados (nome e telefone).
  - Visualização de histórico completo de atendimentos por cliente.
- **Personalização da Página Pública do Estabelecimento:**
  - Upload de Banner/Hero personalizado (1920x1080).
  - Customização de título principal, slogans, títulos das seções de serviços e redes sociais.
  - Links diretos para WhatsApp e Instagram.
  - Definição de dias de funcionamento da semana (Domingo a Sábado) e horários de abertura e fechamento.
- **Notificações em Tempo Real:**
  - Sino de notificações no cabeçalho alimentado via Supabase Realtime (`postgres_changes`) alertando instantaneamente a chegada de novos agendamentos com alertas sonoros/toasts.

---

### ✂️ Painel do Profissional
Acesso dedicado para o profissional visualizar sua rotina e rendimentos (`/profissional`):

- **Dashboard Pessoal:**
  - Resumo de comissão acumulada no mês corrente.
  - Total financeiro bruto gerado para o estabelecimento no mês.
  - Quantidade de serviços concluídos.
  - Modal individual detalhado dos últimos 30 dias.
- **Meus Agendamentos:**
  - Listagem dos serviços atribuídos especificamente a ele.
  - Filtros rápidos por agendamentos pendentes/confirmados, concluídos ou cancelados.
  - Opção de marcar o serviço como concluído diretamente pela bancada.
- **Minha Disponibilidade (Agenda Pessoal):**
  - Calendário interativo mês a mês.
  - Marcação de dias de folga / indisponibilidade.
  - Ajuste de horários de início e término em datas pontuais.

---

### 📱 Portal Público & Agendamento do Cliente
Experiência mobile-first intuitiva para o cliente final:

- **Página Institucional do Estabelecimento (`/:slug`):**
  - Apresentação da marca, logo, endereço completo e banner personalizado.
  - Botão de contato direto via WhatsApp.
  - Exibição de catálogo de serviços com preços e durações.
- **Fluxo de Agendamento Online (`/:slug/agendamento`):**
  1. **Escolha do Serviço:** visualização detalhada com valores e tempo de execução.
  2. **Escolha do Profissional:** lista de profissionais disponíveis no estabelecimento (com vocabulário adaptado ao nicho).
  3. **Seleção Inteligente de Data e Horário:**
     - Bloqueio automático de dias que o estabelecimento não funciona.
     - Bloqueio de folgas do profissional selecionado.
     - Cálculo de slots disponíveis evitando sobreposição com outros agendamentos.
  4. **Identificação Rápida:** formulário simples com nome e telefone (sem necessidade de criação de senha).
- **Confirmação Instantânea (`/booking-success`):**
  - Resumo completo da reserva (data, hora, profissional, serviço, endereço).
- **Autoatendimento do Cliente:**
  - Consulta do próximo agendamento apenas digitando o número de telefone.
  - Cancelamento autônomo do agendamento pelo próprio cliente.
  - Visualização de histórico completo de visitas anteriores.

---

## 🚀 Landing Page de Vendas & Conversão

A página inicial (`index.html`) foi estruturada como uma página de alta conversão:

- **Hero Section:** Proposta de valor clara ("O Fim da Agenda de Papel") e mockups do dashboard em alta resolução.
- **Comparativo:** O Jeito Antigo (mensagens perdidas no WhatsApp, caixa no escuro) vs. Com o BarberPro (agendamentos 24/7, relatórios instantâneos).
- **Grid de Recursos:** Destaques sobre agenda inteligente, financeiro, gestão de clientes e link exclusivo.
- **Tabela de Preços Dinâmica:** Planos carregados em tempo real diretamente do banco de dados Supabase com integração direta aos links de checkout da Kiwify.
- **Garantia de Satisfação & Contato Comercial:** Canal direto para dúvidas pré-venda via WhatsApp.

---

## 💳 Integrações & Pagamentos (Kiwify)

O sistema suporta provisionamento e ciclo de vida automatizado através de webhooks da Kiwify:

- **`payment-webhook-user-creation`:**
  - Escuta compras aprovadas no checkout da Kiwify.
  - Cria automaticamente a conta de usuário no Supabase Auth.
  - Provisiona o registro da barbearia associada ao plano contratado.
- **`payment-webhook-status-update`:**
  - Monitora alterações de status da assinatura (pago, atrasado, cancelado, reembolso).
  - Atualiza automaticamente o status da barbearia (`ativa` ou `inativa`).

---

## ⚡ Supabase Edge Functions

Todas as operações de backend com privilégios administrativos ou lógica sensível rodam isoladas em Deno Edge Functions:

| Edge Function | Finalidade |
| :--- | :--- |
| `create-barbershop` | Cria barbearia e respectivo usuário dono |
| `update-barbershop` | Atualiza dados e imagens da barbearia |
| `delete-barbershop` | Exclui barbearia e remove credenciais de autenticação |
| `update-barbershop-plan` | Realiza upgrade/downgrade do plano do estabelecimento |
| `create-barber-user` | Cria login e vínculo do profissional |
| `update-barber-user` | Atualiza dados cadastrais do barbeiro |
| `delete-barber-user` | Desativa/remove usuário do barbeiro |
| `create-admin-user` | Adiciona novos administradores do SaaS |
| `update-admin-user` | Modifica perfil de administradores |
| `delete-admin-user` | Remove acessos administrativos |
| `get-admin-dashboard` | Consolida métricas globais e financeiras do SaaS |
| `get-barbershop-dashboard` | Agrega faturamento e status do estabelecimento |
| `get-barber-dashboard` | Retorna comissões e totais individuais do barbeiro |
| `get-barber-performance` | Analisa métricas dos últimos 30 dias por profissional |
| `create-appointment` | Reserva horários com validações de conflito |
| `get-client-appointment` | Busca agendamento futuro por telefone |
| `get-client-appointments-history` | Retorna histórico de serviços do cliente |
| `cancel-client-appointment` | Cancela agendamento autenticado por telefone |
| `keep-alive` | Mantém os serviços de backend aquecidos |

---

## 🛠️ Stack Tecnológico

- **Frontend:**
  - [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/) (Bundler ultrarrápido)
  - [React Router DOM](https://reactrouter.com/) (Roteamento com suporte a slugs dinâmicos e Hash)
  - [Tailwind CSS](https://tailwindcss.com/) (Design responsivo e tema Dark/Gold sofisticado)
  - [Lucide React](https://lucide.dev/) (Ícones modernos e consistentes)
  - [Recharts](https://recharts.org/) (Gráficos interativos)
  - [React Hot Toast](https://react-hot-toast.com/) (Feedback visual de operações)
- **Backend / BaaS:**
  - [Supabase](https://supabase.com/)
    - **PostgreSQL:** Banco de dados relacional com RLS.
    - **Supabase Auth:** Autenticação JWT com controle de papéis (`admin`, `barbearia`, `barbeiro`, `cliente`).
    - **Supabase Storage:** Buckets dedicados (`fotos-barbearias`, `fotos-barbeiros`, `system-assets`).
    - **Supabase Realtime:** Notificações em tempo real para novos agendamentos.
    - **Edge Functions (Deno):** APIs serverless para orquestração segura.

---

## 📁 Estrutura de Pastas

```text
marcado/
├── index.html                     # Landing Page de Vendas (HTML/Tailwind)
├── app.html                       # Entry point da aplicação SPA React
├── src/
│   ├── App.tsx                    # Definição de rotas públicas e protegidas
│   ├── main.tsx                   # Inicialização do React DOM
│   ├── types.ts                   # Tipagens TypeScript do domínio
│   ├── index.css                  # Estilos globais e diretivas do Tailwind
│   ├── components/                # Componentes reutilizáveis
│   │   ├── DashboardLayout.tsx    # Layout padrão com Sidebar e Header
│   │   ├── Header.tsx             # Topbar com notificações e perfil
│   │   ├── Sidebar.tsx            # Menu lateral responsivo
│   │   ├── Modal.tsx              # Componente base de modal
│   │   ├── ProtectedRoute.tsx     # Guarda de rotas baseada em papéis (RBAC)
│   │   └── booking/               # Componentes de Calendário e TimeSlots
│   ├── config/                    # Vocabulário por nicho e serviços de exemplo
│   ├── context/                   # Contextos React (Auth, Settings, Notifications)
│   ├── hooks/                     # Custom hooks utilitários
│   ├── integrations/supabase/     # Inicialização do cliente Supabase
│   ├── pages/
│   │   ├── Login.tsx              # Autenticação de usuários
│   │   ├── TrialExpired.tsx       # Aviso de expiração de teste gratuito
│   │   ├── admin/                 # Módulos do Super Administrador
│   │   ├── estabelecimento/       # Módulos do Proprietário do Estabelecimento
│   │   ├── profissional/          # Módulos do Profissional
│   │   └── cliente/               # Telas públicas de perfil e agendamento
│   ├── services/
│   │   └── api.ts                 # Camada de comunicação com Supabase e Edge Functions
│   └── utils/                     # Constantes, slugs e helpers
├── supabase/
│   ├── functions/                 # Deno Edge Functions
│   └── migrations/                # Migrações SQL numeradas
├── tailwind.config.js             # Configurações de cores e tema
└── vite.config.ts                 # Configuração do Vite e aliases de path
```

---

## ⚙️ Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes `npm` ou `pnpm`

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd barberpro-saas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as chaves do seu projeto Supabase:
   ```env
   VITE_SUPABASE_URL=https://sua-url-supabase.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000`

5. **Build de Produção:**
   ```bash
   npm run build
   ```

---

## 📜 Regras de Desenvolvimento

- **Estilização:** Tailwind CSS é o padrão obrigatório em todo o projeto.
- **Camada de Dados:** Todas as consultas e mutações ao Supabase e Edge Functions devem estar encapsuladas em [`src/services/api.ts`](src/services/api.ts).
- **Responsividade:** Abordagem Mobile-First, garantindo que profissionais e clientes tenham uma experiência perfeita em dispositivos móveis.

---

<div align="center">
  <sub>Desenvolvido com dedicação para impulsionar a gestão de negócios da beleza. ✨✂️</sub>
</div>
