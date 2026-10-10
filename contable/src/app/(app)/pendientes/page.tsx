import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ContenidoPendientes } from "./contenido-pendientes";
import type { TipoPendiente } from "./acciones";

export const metadata: Metadata = { title: "Pendientes" };

export default async function PaginaPendientes({
  searchParams,
}: {
  searchParams: Promise<{
    fecha?: string;
    tipo?: string;
    descripcion?: string;
    valor?: string;
  }>;
}) {
  const supabase = await createClient();
  const { fecha, tipo, descripcion, valor } = await searchParams;

  let queryPendientes = supabase.from("pendientes").select("*");
  let queryActividades = supabase.from("actividades_realizadas").select("*");

  if (fecha) {
    queryPendientes = queryPendientes.gte("created_at", fecha).lte("created_at", `${fecha}T23:59:59`);
    queryActividades = queryActividades.gte("fecha_cumplida", fecha).lte("fecha_cumplida", `${fecha}T23:59:59`);
  }

  if (tipo) {
    queryPendientes = queryPendientes.eq("tipo", tipo as TipoPendiente);
    queryActividades = queryActividades.eq("tipo_actividad", tipo as TipoPendiente);
  }

  if (descripcion) {
    queryPendientes = queryPendientes.ilike("descripcion", `%${descripcion}%`);
    queryActividades = queryActividades.ilike("descripcion", `%${descripcion}%`);
  }

  if (valor) {
    queryPendientes = queryPendientes.gte("valor", Number(valor));
    queryActividades = queryActividades.gte("valor", Number(valor));
  }

  // Traer pendientes (activos primero, luego cumplidos) y actividades realizadas
  const [pendientesRes, actividadesRes] = await Promise.all([
    queryPendientes
      .order("cumplido", { ascending: true })
      .order("created_at", { ascending: false }),
    queryActividades
      .order("fecha_cumplida", { ascending: false }),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-texto">
          Pendientes
        </h1>
        <p className="mt-1 text-texto-suave">
          Gestiona tus cuentas por pagar, cobrar y notas pendientes.
        </p>
      </div>

      <ContenidoPendientes
        pendientes={pendientesRes.data ?? []}
        actividades={actividadesRes.data ?? []}
      />
    </>
  );
}
