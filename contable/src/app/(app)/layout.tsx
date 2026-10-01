import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "./actions";
import { puedeEditar } from "@/lib/permisos";

// Segunda barrera de acceso (la primera es proxy.ts): si no hay sesión válida, no se renderiza nada.
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const esEditor = puedeEditar(user.email);

  return (
    <>
      <Sidebar email={user.email ?? ""} cerrarSesionAction={cerrarSesion} puedeEditar={esEditor} />
      <div className="con-sidebar">
        <main className="mx-auto max-w-6xl px-6 py-8 sm:px-10">{children}</main>
      </div>
    </>
  );
}

