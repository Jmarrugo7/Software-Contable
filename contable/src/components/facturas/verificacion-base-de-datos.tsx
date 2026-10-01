import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// PANEL TEMPORAL (Fase 1): confirma que la migración 001 quedó aplicada y que la sesión
// puede leer los catálogos. Se retira cuando exista el formulario de facturas (Fase 3).
const esperado = { gastos_compras: 24, fuentes_recursos: 6, metodos_pago: 4 } as const;

const etiquetas = {
  gastos_compras: "Gasto/Compra",
  fuentes_recursos: "Fuentes de recursos",
  metodos_pago: "Métodos de pago",
} as const;

export async function VerificacionBaseDeDatos() {
  const supabase = await createClient();

  const [g, f, m] = await Promise.all([
    supabase.from("gastos_compras").select("*", { count: "exact", head: true }),
    supabase.from("fuentes_recursos").select("*", { count: "exact", head: true }),
    supabase.from("metodos_pago").select("*", { count: "exact", head: true }),
  ]);

  const resultados = [
    { tabla: "gastos_compras" as const, ...g },
    { tabla: "fuentes_recursos" as const, ...f },
    { tabla: "metodos_pago" as const, ...m },
  ];
  const hayError = resultados.some((r) => r.error);

  return (
    <section aria-labelledby="titulo-verificacion" className="mt-10 max-w-xl">
      <h2 id="titulo-verificacion" className="font-serif text-xl font-semibold text-texto">
        Conexión con la base de datos
      </h2>

      {hayError ? (
        <p role="alert" className="mt-2 text-rojo">
          No se pudieron leer los catálogos. Confirma que ejecutaste la migración
          001_esquema_inicial.sql en el SQL Editor de Supabase.
        </p>
      ) : null}

      <ul className="mt-3 divide-y divide-borde border-y border-borde">
        {resultados.map((r) => {
          const cantidad = r.count ?? 0;
          const ok = !r.error && cantidad >= esperado[r.tabla];
          return (
            <li key={r.tabla} className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-texto">{etiquetas[r.tabla]}</span>
              <span className="flex items-center gap-2 text-sm">
                <span className="cifras text-texto-suave">
                  {r.error ? "sin acceso" : `${cantidad} cargadas`}
                </span>
                {ok ? (
                  <CheckCircle2 className="size-4 text-primario" aria-label="Correcto" />
                ) : (
                  <XCircle className="size-4 text-rojo" aria-label="Con problemas" />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
