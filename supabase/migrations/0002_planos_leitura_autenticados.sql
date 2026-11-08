DROP POLICY IF EXISTS planos_read ON public.planos;

CREATE POLICY planos_read_anon ON public.planos
  FOR SELECT TO anon USING (ativo = true);

CREATE POLICY planos_read_authenticated ON public.planos
  FOR SELECT TO authenticated USING (true);
