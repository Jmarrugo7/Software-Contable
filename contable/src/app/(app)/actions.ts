"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// RF-03: cierre de sesión.
export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
