# 🚀 Supabase - Guia de Configuração e Migrações (Marcadô)

Guia rápido para configurar um novo projeto Supabase do zero para o **Marcadô**.

---

## 1. Ordem de Execução das Migrações no SQL Editor

Abra o painel do seu projeto no Supabase, vá em **SQL Editor** e execute os arquivos da pasta `supabase/migrations/` na ordem:

1. **`0001_initial_schema.sql`**
   - Cria as extensões `uuid-ossp` e `btree_gist`
   - Cria as 10 tabelas do sistema (`system_settings`, `planos`, `estabelecimentos`, `tipos_profissional`, `profissionais`, `servicos`, `clientes`, `agendamentos`, `profissional_disponibilidade`, `gastos_saas`)
   - Cria triggers de canonicidade de telefone e prevenção de agendamento duplo
   - Cria a view pública `estabelecimentos_publico`
   - Habilita e define as políticas de RLS

2. **`0002_storage_and_realtime.sql`**
   - Cria os buckets de Storage (`fotos-estabelecimentos`, `fotos-profissionais`, `system-assets`)
   - Define políticas de leitura pública e escrita autenticada
   - Adiciona a tabela `agendamentos` à publicação Realtime

3. **`0003_seed_data.sql`**
   - Insere as configurações globais padrão (`Marcadô`)
   - Insere os planos iniciais (`Básico`, `Profissional`, `Trial`)

---

## 2. Criar o Usuário Administrador Inicial

1. No Supabase Dashboard, acesse **Authentication** → **Users** → **Add User**.
2. Preencha o e-mail e senha, marcando **Auto Confirm User**.
3. No **SQL Editor**, execute:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
WHERE email = 'SEU_EMAIL_CADASTRADO';
```

---

## 3. Deploy das Edge Functions

Com o Supabase CLI configurado e autenticado:

```bash
# Vincular ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Fazer deploy das funções (exceto webhooks se não estiver usando pagamento ativo)
supabase functions deploy create-establishment
supabase functions deploy delete-establishment
supabase/functions deploy update-establishment
supabase functions deploy update-establishment-plan
supabase functions deploy get-establishment-dashboard
supabase functions deploy create-professional-user
supabase functions deploy update-professional-user
supabase functions deploy delete-professional-user
supabase functions deploy get-professional-dashboard
supabase functions deploy get-professional-performance
supabase functions deploy create-appointment
supabase functions deploy get-client-appointment
supabase functions deploy get-client-appointments-history
supabase functions deploy cancel-client-appointment
supabase functions deploy find-or-create-client
supabase functions deploy get-admin-dashboard
supabase functions deploy get-admin-users
supabase functions deploy create-admin-user
supabase functions deploy update-admin-user
supabase functions deploy delete-admin-user
supabase functions deploy keep-alive
```

