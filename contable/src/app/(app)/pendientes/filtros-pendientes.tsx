"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { Search, X, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";

export function FiltrosPendientes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Current filter values from URL
  const fecha = searchParams.get("fecha") || "";
  const tipo = searchParams.get("tipo") || "";
  const descripcionParam = searchParams.get("descripcion") || "";
  const valorParam = searchParams.get("valor") || "";

  // Local state for debounced inputs
  const [descripcionLocal, setDescripcionLocal] = useState(descripcionParam);
  const [valorLocal, setValorLocal] = useState(valorParam);
  const debounceDescRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceValorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hayFiltrosActivos = fecha || tipo || descripcionParam || valorParam;

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
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fecha");
    params.delete("tipo");
    params.delete("descripcion");
    params.delete("valor");
    
    setDescripcionLocal("");
    setValorLocal("");
    if (debounceDescRef.current) clearTimeout(debounceDescRef.current);
    if (debounceValorRef.current) clearTimeout(debounceValorRef.current);
    
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  return (
    <div className={`flex flex-wrap items-center gap-3 transition-opacity duration-200 ${isPending ? "opacity-50" : ""}`}>
      {/* Date Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filtro-fecha" className="sr-only">Fecha</label>
        <input
          suppressHydrationWarning
          id="filtro-fecha"
          type="date"
          value={fecha}
          onChange={(e) => actualizarFiltro("fecha", e.target.value)}
          className="h-9 rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
        />
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filtro-tipo" className="sr-only">Tipo</label>
        <select
          suppressHydrationWarning
          id="filtro-tipo"
          value={tipo}
          onChange={(e) => actualizarFiltro("tipo", e.target.value)}
          className="h-9 rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200"
        >
          <option value="">Todos los tipos</option>
          <option value="CUENTA_POR_PAGAR">Cuenta por pagar</option>
          <option value="CUENTA_POR_COBRAR">Cuenta por cobrar</option>
          <option value="NOTA">Nota</option>
        </select>
      </div>

      {/* Description Filter (Debounced) */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filtro-descripcion" className="sr-only">Descripción</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-texto-suave" />
          <Input
            id="filtro-descripcion"
            type="text"
            placeholder="Buscar descripción..."
            value={descripcionLocal}
            onChange={(e) =>
              handleDebouncedChange("descripcion", e.target.value, setDescripcionLocal, debounceDescRef)
            }
            className="h-9 w-48 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Value Filter (Debounced) */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filtro-valor" className="sr-only">Valor</label>
        <div className="relative">
          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-texto-suave" />
          <Input
            id="filtro-valor"
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor mínimo..."
            value={valorLocal}
            onChange={(e) =>
              handleDebouncedChange("valor", e.target.value, setValorLocal, debounceValorRef)
            }
            className="h-9 w-36 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hayFiltrosActivos ? (
        <button
          onClick={limpiarFiltros}
          className="inline-flex items-center justify-center rounded-md p-2 text-texto-suave hover:text-rojo hover:bg-rojo-suave transition-colors duration-200"
          title="Limpiar filtros"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
