import { createClient } from "@supabase/supabase-js";

// Busca as variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação amigável para debug no navegador
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Atenção: Variáveis de ambiente não encontradas. Verifique as configurações na Vercel.");
} else {
  console.log("🚀 Conexão com Supabase preparada.");
}

// Inicializa o cliente mesmo que as chaves estejam vazias (evita erro fatal de importação)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
