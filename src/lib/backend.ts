// Si existen las variables de Supabase, la plataforma usa la base de datos real; si no, el modo local.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const REMOTE = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
