import { createClient } from "@supabase/supabase-js";

/*
  As chaves são obtidas através das variáveis de ambiente do sistema.
*/
// Accessing environment variables via process.env to resolve TypeScript errors with ImportMeta
const SUPABASE_URL = (process.env as any).VITE_SUPABASE_URL || "https://nmhfpvrrrhlcnkbvcwmq.supabase.co";
const SUPABASE_ANON_KEY = (process.env as any).VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taGZwdnJycmhsY25rYnZjd21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODQ0NjUsImV4cCI6MjA4NDM2MDQ2NX0.h8KV7INZcXbt4dzhpHCL3xeP0L2RZye6urkr8C3pILg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);