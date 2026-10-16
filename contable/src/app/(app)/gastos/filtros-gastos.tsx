"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { X, SlidersHorizontal } from "lucide-react";

type Catalogo = { id: number; nombre: string };

interface FiltrosProps {
  categorias: Catalogo[];
  fuentes: Catalogo[];
}

export function FiltrosGastos({ categorias, fuentes }: FiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Current filter values from URL
  const desde = searchParams.get("desde") || "";
  const hasta = searchParams.get("hasta") || "";
  const categoriaId = searchParams.get("categoria") || "";
  const fuenteId = searchParams.get("fuente") || "";

  const hayFiltrosActivos = desde || hasta || categoriaId || fuenteId;

  const actualizarFiltro = useCallback(
    (clave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor) {
        params.set(clave, valor);
      } else {
        params.delete(clave);
      }
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router]
  );

  const limpiarFiltros = useCallback(() => {
    startTransition(() => {
      router.push("?", { scroll: false });
    });
  }, [router]);

  return (
    <div className="mt-6 rounded-lg border border-borde bg-superficie shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-borde/60">
        <div className="flex items-center gap-2 text-texto-suave">
          <SlidersHorizontal className="size-4" />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Filtros
          </span>
          {hayFiltrosActivos && (
            <span className="inline-flex items-center rounded-full bg-primario/10 px-2 py-0.5 text-xs font-semibold text-primario">
              Activos
            </span>
          )}
        </div>
        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-texto-suave hover:text-rojo hover:bg-rojo-suave transition-colors duration-200"
          >
            <X className="size-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filter Grid — single row */}
      <div
        className={`grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 transition-opacity duration-200 ${isPending ? "opacity-50" : ""}`}
      >
        {/* Desde */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-desde"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Desde
          </label>
          <input
            suppressHydrationWarning
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(e) => actualizarFiltro("desde", e.target.value)}
            className="h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
          />
        </div>

        {/* Hasta */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-hasta"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Hasta
          </label>
          <input
            suppressHydrationWarning
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(e) => actualizarFiltro("hasta", e.target.value)}
            className="h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
          />
        </div>

        {/* Gasto/Compra — dropdown */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-categoria"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Gasto / Compra
          </label>
          <select
            suppressHydrationWarning
            id="filtro-categoria"
            value={categoriaId}
            onChange={(e) => actualizarFiltro("categoria", e.target.value)}
            className="h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
          >
            <option value="">Todas</option>
            {categorias && categorias.length > 0 && categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fuente de recursos — dropdown */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-fuente"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Fuente
          </label>
          <select
            suppressHydrationWarning
            id="filtro-fuente"
            value={fuenteId}
            onChange={(e) => actualizarFiltro("fuente", e.target.value)}
            className="h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
          >
            <option value="">Todas</option>
            {fuentes && fuentes.length > 0 && fuentes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
