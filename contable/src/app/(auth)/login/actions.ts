"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validaciones/auth";

export type EstadoLogin = {
  error?: string;
  errores?: { email?: string; password?: string };
  email?: string;
};

function traducirError(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.";
    case "email_not_confirmed":
      return "El correo de esta cuenta aún no está confirmado.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Hubo demasiados intentos. Espera unos minutos y vuelve a probar.";
    default:
      return error.status === 0 || error.name === "AuthRetryableFetchError"
        ? "No se pudo conectar con el servidor. Revisa tu conexión a internet."
        : "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}

// RF-01 / RF-02: autentica con correo y contraseña; la validación real la hace Supabase Auth.
export async function iniciarSesion(
  _estadoPrevio: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const validado = loginSchema.safeParse({ email, password });
  if (!validado.success) {
    const campos = z.flattenError(validado.error).fieldErrors;
    return {
      email,
      errores: { email: campos.email?.[0], password: campos.password?.[0] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validado.data);
  if (error) {
    return { email, error: traducirError(error) };
  }

  redirect("/facturas");
}
