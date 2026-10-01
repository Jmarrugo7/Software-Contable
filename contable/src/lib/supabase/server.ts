import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { obtenerEnvSupabase } from "./env";

// Cliente para Server Components, Server Actions y Route Handlers.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = obtenerEnvSupabase();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Se llamó desde un Server Component (solo lectura de cookies).
          // Es seguro ignorarlo: el proxy ya refresca la sesión.
        }
      },
    },
  });
}
