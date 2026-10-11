"use client";

import { ClipboardList, CheckCircle2, ArrowDownCircle, ArrowUpCircle, StickyNote } from "lucide-react";
import { formatearMoneda, formatearFechaHora } from "@/lib/formato";
import { Pestanas } from "./pestanas";
import { TarjetaPendiente } from "./tarjeta-pendiente";
import { FormularioPendiente } from "./formulario-pendiente";
import { FiltrosPendientes } from "./filtros-pendientes";
import type { TipoPendiente } from "./acciones";

type PendienteRow = {
  id: string;
  tipo: TipoPendiente;
  descripcion: string;
  valor: number | null;
  cumplido: boolean;
  created_at: string;
  updated_at: string;
};

type ActividadRow = {
  id: string;
  pendiente_id: string;
  tipo_actividad: TipoPendiente;
  descripcion: string;
  valor: number | null;
  fecha_cumplida: string;
};

const ETIQUETA_TIPO: Record<TipoPendiente, string> = {
  CUENTA_POR_PAGAR: "Cuenta por pagar",
  CUENTA_POR_COBRAR: "Cuenta por cobrar",
  NOTA: "Nota",
};

const ICONO_TIPO: Record<TipoPendiente, typeof ArrowDownCircle> = {
  CUENTA_POR_PAGAR: ArrowUpCircle,
  CUENTA_POR_COBRAR: ArrowDownCircle,
  NOTA: StickyNote,
};

const COLOR_BADGE: Record<TipoPendiente, string> = {
  CUENTA_POR_PAGAR: "bg-rojo/10 text-rojo",
  CUENTA_POR_COBRAR: "bg-primario/10 text-primario",
  NOTA: "bg-gris-200 text-gris-700",
};

export function ContenidoPendientes({
  pendientes,
  actividades,
  esEditor,
}: {
  pendientes: PendienteRow[];
  actividades: ActividadRow[];
  esEditor: boolean;
}) {
  const todasPendientes = pendientes.filter((p) => !p.cumplido);
  const porPagar = pendientes.filter((p) => p.tipo === "CUENTA_POR_PAGAR" && !p.cumplido);
  const porCobrar = pendientes.filter((p) => p.tipo === "CUENTA_POR_COBRAR" && !p.cumplido);
  const notas = pendientes.filter((p) => p.tipo === "NOTA" && !p.cumplido);

  const totalPagar = porPagar.reduce((sum, p) => sum + (p.valor ?? 0), 0);
  const totalCobrar = porCobrar.reduce((sum, p) => sum + (p.valor ?? 0), 0);

  const tabs = [
    { id: "todas", label: "Actividades pendientes", count: todasPendientes.length },
    { id: "pagar", label: "Por pagar", count: porPagar.length },
    { id: "cobrar", label: "Por cobrar", count: porCobrar.length },
    { id: "notas", label: "Notas", count: notas.length },
    { id: "actividades", label: "Actividades realizadas", count: actividades.length },
  ];

  const tipoDefault: Record<string, TipoPendiente> = {
    todas: "CUENTA_POR_PAGAR",
    pagar: "CUENTA_POR_PAGAR",
    cobrar: "CUENTA_POR_COBRAR",
    notas: "NOTA",
  };

  return (
    <div className="space-y-6">
      {/* Resumen rápido */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-borde bg-superficie p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rojo/10">
              <ArrowUpCircle className="size-5 text-rojo" />
            </div>
            <div>
              <p className="text-xs font-semibold text-texto-suave uppercase tracking-wide">Por pagar</p>
              <p className="text-xl font-bold text-texto tabular-nums">{formatearMoneda(totalPagar)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-texto-suave">{porPagar.length} pendiente{porPagar.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded-xl border border-borde bg-superficie p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primario/10">
              <ArrowDownCircle className="size-5 text-primario" />
            </div>
            <div>
              <p className="text-xs font-semibold text-texto-suave uppercase tracking-wide">Por cobrar</p>
              <p className="text-xl font-bold text-texto tabular-nums">{formatearMoneda(totalCobrar)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-texto-suave">{porCobrar.length} pendiente{porCobrar.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded-xl border border-borde bg-superficie p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gris-200">
              <StickyNote className="size-5 text-gris-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-texto-suave uppercase tracking-wide">Notas</p>
              <p className="text-xl font-bold text-texto">{notas.length}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-texto-suave">nota{notas.length !== 1 ? "s" : ""} activa{notas.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Tabs */}
      <Pestanas tabs={tabs} defaultTab="todas">
        {(activeTab) => {
          if (activeTab === "actividades") {
            return <SeccionActividades actividades={actividades} />;
          }

          const lista =
            activeTab === "todas"
              ? todasPendientes
              : activeTab === "pagar"
              ? porPagar
              : activeTab === "cobrar"
              ? porCobrar
              : notas;

          return (
            <div className="space-y-4">
              {/* Barra: Filtros al mismo nivel que Agregar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <FiltrosPendientes />
                {esEditor && (
                  <div className="shrink-0">
                    <FormularioPendiente tipoInicial={tipoDefault[activeTab]} />
                  </div>
                )}
              </div>

              {lista.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gris-200 py-16 text-center">
                  <ClipboardList className="mb-3 size-10 text-gris-300" />
                  <p className="text-sm font-medium text-texto-suave">
                    {activeTab === "todas"
                      ? "No hay actividades pendientes"
                      : "No hay pendientes en esta categoría"}
                  </p>
                  {esEditor && (
                    <p className="mt-1 text-xs text-texto-suave">Haz clic en &quot;Agregar&quot; para crear uno</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {lista.map((p) => (
                    <TarjetaPendiente
                      key={p.id}
                      id={p.id}
                      tipo={p.tipo}
                      descripcion={p.descripcion}
                      valor={p.valor}
                      cumplido={p.cumplido}
                      createdAt={p.created_at}
                      esEditor={esEditor}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        }}
      </Pestanas>
    </div>
  );
}

// ─── Sección de actividades realizadas ───
function SeccionActividades({ actividades }: { actividades: ActividadRow[] }) {
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <FiltrosPendientes />
      </div>

      {actividades.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gris-200 py-16 text-center">
          <CheckCircle2 className="mb-3 size-10 text-gris-300" />
          <p className="text-sm font-medium text-texto-suave">No hay actividades realizadas con estos filtros</p>
          <p className="mt-1 text-xs text-texto-suave">Cuando marques un pendiente como cumplido, aparecerá aquí</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-borde bg-superficie shadow-sm">
          <table className="w-full">
        <thead>
          <tr className="border-b border-borde bg-gris-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-texto-suave uppercase tracking-wide">
              Fecha cumplida
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-texto-suave uppercase tracking-wide">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-texto-suave uppercase tracking-wide">
              Descripción
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-texto-suave uppercase tracking-wide">
              Valor
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {actividades.map((a) => {
            const Icono = ICONO_TIPO[a.tipo_actividad];
            return (
              <tr key={a.id} className="transition-colors hover:bg-gris-50/50">
                <td className="px-4 py-3 text-sm text-texto tabular-nums">
                  {formatearFechaHora(a.fecha_cumplida)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_BADGE[a.tipo_actividad]}`}>
                    <Icono className="size-3" />
                    {ETIQUETA_TIPO[a.tipo_actividad]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-texto">{a.descripcion}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-texto tabular-nums">
                  {a.valor !== null ? formatearMoneda(a.valor) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
      )}
    </div>
  );
}
