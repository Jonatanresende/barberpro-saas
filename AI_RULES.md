# Regras e Diretrizes do Projeto (Barbeiro na Hora)

Este documento define o stack tecnológico e as regras de uso de bibliotecas para garantir a consistência, manutenibilidade e escalabilidade do projeto.

## 1. Stack Tecnológico

O projeto é construído com as seguintes tecnologias principais:

*   **Frontend:** React com TypeScript.
*   **Roteamento:** React Router (utilizando `HashRouter` para compatibilidade com o ambiente de hospedagem).
*   **Estilização:** Tailwind CSS (abordagem mobile-first e responsiva).
*   **Componentes UI:** Componentes customizados e inspirados no estilo shadcn/ui, focados em acessibilidade e design minimalista.
*   **Ícones:** `lucide-react`.
*   **Backend/Banco de Dados:** Supabase (PostgreSQL, Auth, Storage e Edge Functions).
*   **Autenticação UI:** `@supabase/auth-ui-react` (usando `ThemeSupa`).
*   **Notificações:** `react-hot-toast`.
*   **Gráficos:** `recharts`.

## 2. Regras de Uso de Bibliotecas

Para manter a consistência, siga estas regras ao adicionar ou modificar código:

| Funcionalidade | Biblioteca/Local | Regra de Uso |
| :--- | :--- | :--- |
| **Estilização** | Tailwind CSS | **Obrigatório.** Use classes do Tailwind para todo o design. Não use arquivos CSS ou módulos CSS customizados. |
| **Componentes** | `src/components/` | Crie um novo arquivo para cada componente. Mantenha os componentes pequenos e focados (idealmente < 100 linhas). |
| **Lógica de Negócio/Dados** | `src/services/api.ts` | **Obrigatório.** Todas as chamadas de banco de dados (Supabase) e Edge Functions devem ser encapsuladas em `api.ts`. Componentes e Hooks devem chamar apenas `api.ts`. |
| **Autenticação** | `@supabase/auth-ui-react` | Use o componente `Auth` para a tela de login, configurado com o `ThemeSupa`. |
| **Roteamento** | `react-router-dom` | Use `Routes`, `Route` e `useNavigate`/`useParams`/`useLocation`. Mantenha a estrutura de rotas em `src/App.tsx`. |
| **Ícones** | `lucide-react` | Use apenas ícones do pacote `lucide-react` (ou os ícones utilitários definidos em `src/components/icons.tsx`). |
| **Notificações** | `react-hot-toast` | Use `toast.success()`, `toast.error()`, etc., para feedback ao usuário. |
| **Gráficos** | `recharts` | Use `recharts` para qualquer visualização de dados (ex: `LineChart`, `ResponsiveContainer`). |