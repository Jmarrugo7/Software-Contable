"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { Search, X, SlidersHorizontal, DollarSign } from "lucide-react";

type Catalogo = { id: number; nombre: string };

interface FiltrosFacturasProps {
  gastos: Catalogo[];
}

export function FiltrosFacturas({ gastos }: FiltrosFacturasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Current filter values from URL
  const fecha = searchParams.get("fecha") || "";
  const gastoId = searchParams.get("gasto") || "";
  const proveedorParam = searchParams.get("proveedor") || "";
  const subtotalParam = searchParams.get("subtotal") || "";
  const totalParam = searchParams.get("total") || "";
  const estado = searchParams.get("estado") || "";

  // Local state for debounced inputs
  const [proveedorLocal, setProveedorLocal] = useState(proveedorParam);
  const [subtotalLocal, setSubtotalLocal] = useState(subtotalParam);
  const [totalLocal, setTotalLocal] = useState(totalParam);
  const debounceProvRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceSubRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTotRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hayFiltrosActivos =
    fecha || gastoId || proveedorParam || subtotalParam || totalParam;

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

  const handleDebouncedChange = useCallback(
    (
      clave: string,
      valor: string,
      setLocal: (v: string) => void,
      ref: React.RefObject<ReturnType<typeof setTimeout> | null>
    ) => {
      setLocal(valor);
      if (ref.current) clearTimeout(ref.current);
      ref.current = setTimeout(() => {
        actualizarFiltro(clave, valor);
      }, 600);
    },
    [actualizarFiltro]
  );

  const limpiarFiltros = useCallback(() => {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    setProveedorLocal("");
    setSubtotalLocal("");
    setTotalLocal("");
    if (debounceProvRef.current) clearTimeout(debounceProvRef.current);
    if (debounceSubRef.current) clearTimeout(debounceSubRef.current);
    if (debounceTotRef.current) clearTimeout(debounceTotRef.current);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [estado, router]);

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

      {/* Filter Grid */}
      <div
        className={`grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5 transition-opacity duration-200 ${isPending ? "opacity-50" : ""}`}
      >
        {/* Fecha — single date */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-fecha"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Fecha
          </label>
          <input
            suppressHydrationWarning
            id="filtro-fecha"
            type="date"
            value={fecha}
            onChange={(e) => actualizarFiltro("fecha", e.target.value)}
            className="h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
          />
        </div>

        {/* Gasto/Compra — dropdown from DB */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-gasto"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Gasto / Compra
          </label>
          <select
            suppressHydrationWarning
            id="filtro-gasto"
            value={gastoId}
            onChange={(e) => actualizarFiltro("gasto", e.target.value)}
            className="h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
          >
            <option value="">Todos</option>
            {gastos && gastos.length > 0 && gastos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Proveedor — debounced text search */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-proveedor"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Proveedor
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-texto-suave/60 pointer-events-none" />
            <input
              suppressHydrationWarning
              id="filtro-proveedor"
              type="text"
              placeholder="Buscar..."
              value={proveedorLocal}
              onChange={(e) =>
                handleDebouncedChange("proveedor", e.target.value, setProveedorLocal, debounceProvRef)
              }
              className="h-9 w-full rounded-md border border-borde bg-superficie pl-8 pr-2.5 text-sm text-texto placeholder:text-texto-suave/60 focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Subtotal mínimo — debounced number */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-subtotal"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Subtotal mín.
          </label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-texto-suave/60 pointer-events-none" />
            <input
              suppressHydrationWarning
              id="filtro-subtotal"
              type="number"
              min="0"
              placeholder="0"
              value={subtotalLocal}
              onChange={(e) =>
                handleDebouncedChange("subtotal", e.target.value, setSubtotalLocal, debounceSubRef)
              }
              className="h-9 w-full rounded-md border border-borde bg-superficie pl-8 pr-2.5 text-sm text-texto placeholder:text-texto-suave/60 focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Total mínimo — debounced number */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-total"
            className="text-xs font-semibold text-texto-suave uppercase tracking-wide"
          >
            Total mín.
          </label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-texto-suave/60 pointer-events-none" />
            <input
              suppressHydrationWarning
              id="filtro-total"
              type="number"
              min="0"
              placeholder="0"
              value={totalLocal}
              onChange={(e) =>
                handleDebouncedChange("total", e.target.value, setTotalLocal, debounceTotRef)
              }
              className="h-9 w-full rounded-md border border-borde bg-superficie pl-8 pr-2.5 text-sm text-texto placeholder:text-texto-suave/60 focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
