-- ==============================================================================
-- 0002_storage_and_realtime.sql
-- Marcadô SaaS - Configuração de Buckets de Storage e Realtime
-- ==============================================================================

-- 1. BUCKETS DE STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('fotos-estabelecimentos', 'fotos-estabelecimentos', true),
  ('fotos-profissionais', 'fotos-profissionais', true),
  ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. POLICIES DE LEITURA PÚBLICA (Qualquer usuário e cliente pode ver as fotos)
CREATE POLICY "Public Read fotos-estabelecimentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-estabelecimentos');

CREATE POLICY "Public Read fotos-profissionais"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-profissionais');

CREATE POLICY "Public Read system-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'system-assets');

-- 3. POLICIES DE ESCRITA / UPLOAD
-- Usuários autenticados podem fazer upload nos buckets de estabelecimentos e profissionais
CREATE POLICY "Auth Upload fotos-estabelecimentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-estabelecimentos');

CREATE POLICY "Auth Update fotos-estabelecimentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fotos-estabelecimentos');

CREATE POLICY "Auth Delete fotos-estabelecimentos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fotos-estabelecimentos');

CREATE POLICY "Auth Upload fotos-profissionais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-profissionais');

CREATE POLICY "Auth Update fotos-profissionais"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fotos-profissionais');

CREATE POLICY "Auth Delete fotos-profissionais"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fotos-profissionais');

-- system-assets gerenciado por admin
CREATE POLICY "Admin All system-assets"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'system-assets' AND 
  (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
);

-- 4. REALTIME
-- Permite que clientes e donos recebam eventos de novos agendamentos e atualizações de status
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;

