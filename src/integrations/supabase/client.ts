import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Variáveis de ambiente do Supabase não configuradas. Certifique-se de definir VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
