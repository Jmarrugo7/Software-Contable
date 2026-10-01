import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Cliente para componentes de navegador ("use client").
// NEXT_PUBLIC_* se resuelve en build, por eso se lee directamente aquí.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
