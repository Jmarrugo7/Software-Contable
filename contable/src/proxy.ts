import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { obtenerEnvSupabase } from "@/lib/supabase/env";
import { puedeEditar, rutaRequiereEscritura } from "@/lib/permisos";

// RNF-03: solo el usuario autenticado accede a las funciones del sistema.
// Este proxy refresca la sesión y redirige. La verificación real se repite
// en el layout de (app) y en cada acceso a datos (RLS en la base de datos).
export async function proxy(request: NextRequest) {
  const { url, anonKey } = obtenerEnvSupabase();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() valida el token contra Supabase Auth (no confía solo en la cookie).
  let usuario = null;
  try {
    const { data } = await supabase.auth.getUser();
    usuario = data.user ?? null;
  } catch {
    usuario = null;
  }

  const enLogin = request.nextUrl.pathname.startsWith("/login");

  if (!usuario && !enLogin) {
    return redirigir(request, "/login", response);
  }
  if (usuario && enLogin) {
    return redirigir(request, "/facturas", response);
  }

  // Bloquear rutas de escritura para usuarios de solo lectura.
  if (usuario && rutaRequiereEscritura(request.nextUrl.pathname) && !puedeEditar(usuario.email)) {
    return redirigir(request, "/facturas", response);
  }

  return response;
}

// Conserva las cookies de sesión refrescadas al redirigir.
function redirigir(request: NextRequest, ruta: string, origen: NextResponse) {
  const destino = request.nextUrl.clone();
  destino.pathname = ruta;
  destino.search = "";
  const redireccion = NextResponse.redirect(destino);
  origen.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
  return redireccion;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
