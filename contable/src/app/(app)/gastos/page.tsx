import { createClient } from "@/lib/supabase/server";
import { FiltrosGastos } from "./filtros-gastos";
import { GraficaGastos } from "./grafica-gastos";
import { GraficaCategorias } from "./grafica-categorias";
import { TablaCategorias } from "./tabla-categorias";
import { TablaFuentes } from "./tabla-fuentes";
import { BarChart3, Receipt, Landmark } from "lucide-react";

import { BotonExportar } from "./boton-exportar";

export const metadata = { title: "Control de gastos" };

export default async function PaginaGastos({
  searchParams,
}: {
  searchParams: Promise<{ 
    desde?: string; 
    hasta?: string; 
    categoria?: string; 
    fuente?: string;
  }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const desde = params.desde || null;
  const hasta = params.hasta || null;
  const categoriaId = params.categoria ? Number(params.categoria) : null;
  const fuenteId = params.fuente ? Number(params.fuente) : null;

  // Cargar catálogos para filtros
  const [{ data: categorias }, { data: fuentes }] = await Promise.all([
    supabase.from("gastos_compras").select("id, nombre").order("nombre"),
    supabase.from("fuentes_recursos").select("id, nombre").order("nombre"),
  ]);

  // Consultar resumen (total y cantidad) usando la función RPC
  const { data: resumenReq } = await supabase.rpc("resumen_gastos", {
    p_desde: desde as any,
    p_hasta: hasta as any,
    p_gasto_compra_id: categoriaId as any,
    p_fuente_recursos_id: fuenteId as any,
    p_metodo_pago_id: null as any,
  } as any);
  
  const resumen = resumenReq?.[0] || { total: 0, cantidad_facturas: 0 };

  // Consultar datos para las gráficas (agrupación fija por mes)
  const { data: gastosPorPeriodo } = await supabase.rpc("gastos_por_periodo", {
    p_agrupacion: "month",
    p_desde: desde as any,
    p_hasta: hasta as any,
    p_gasto_compra_id: categoriaId as any,
    p_fuente_recursos_id: fuenteId as any,
    p_metodo_pago_id: null as any,
  } as any);

  const { data: gastosPorCategoria } = await supabase.rpc("gastos_por_categoria", {
    p_desde: desde as any,
    p_hasta: hasta as any,
    p_fuente_recursos_id: fuenteId as any,
    p_metodo_pago_id: null as any,
  } as any);

  // Consulta FIJA (sin filtros) — totales agrupados por fuente de recursos
  const { data: totalesPorFuente } = await supabase
    .from("facturas")
    .select("fuente_recursos_id, fuentes_recursos(nombre), total")
    .eq("estado", "activa");

  // Agrupar manualmente por fuente
  const mapaFuentes = new Map<number, { fuente_recursos_id: number; nombre: string; total: number }>();
  if (totalesPorFuente) {
    for (const f of totalesPorFuente) {
      const id = f.fuente_recursos_id;
      const nombre = (f.fuentes_recursos as any)?.nombre || "Desconocida";
      const totalVal = Number(f.total) || 0;
      const existing = mapaFuentes.get(id);
      if (existing) {
        existing.total += totalVal;
      } else {
        mapaFuentes.set(id, { fuente_recursos_id: id, nombre, total: totalVal });
      }
    }
  }
  const datosFuentes = Array.from(mapaFuentes.values());

  const formatoMoneda = new Intl.NumberFormat("es-CO", { 
    style: "currency", 
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-texto">
            Control de gastos
          </h1>
          <p className="mt-2 text-texto-suave">
            Analiza el comportamiento de tus gastos mediante gráficas y filtros dinámicos.
          </p>
        </div>
        
        <BotonExportar 
          filtrosActuales={{
            desde: desde,
            hasta: hasta,
            categoria: categoriaId,
            fuente: fuenteId,
            metodo: null
          }}
        />
      </div>

      <FiltrosGastos 
        categorias={categorias || []} 
        fuentes={fuentes || []}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-borde bg-superficie p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 text-texto-suave mb-2">
            <BarChart3 className="size-5 text-primario" />
            <h2 className="font-semibold text-sm uppercase tracking-wider">Total de Gastos</h2>
          </div>
          <p className="text-4xl font-bold text-texto cifras">
            {formatoMoneda.format(resumen.total)}
          </p>
        </div>

        <div className="rounded-xl border border-borde bg-superficie p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 text-texto-suave mb-2">
            <Receipt className="size-5 text-primario" />
            <h2 className="font-semibold text-sm uppercase tracking-wider">Facturas Contabilizadas</h2>
          </div>
          <p className="text-4xl font-bold text-texto cifras">
            {resumen.cantidad_facturas}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-borde bg-superficie p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Landmark className="size-5 text-primario" />
          <h3 className="font-semibold text-lg text-texto">Distribución por Fuente de Recursos</h3>
        </div>
        <TablaFuentes datos={datosFuentes} />
      </div>

      <div className="rounded-xl border border-borde bg-superficie p-6 shadow-sm">
        <h3 className="font-semibold text-lg text-texto mb-4">Detalle de Gastos por Categoría</h3>
        <TablaCategorias datos={gastosPorCategoria || []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-borde bg-superficie p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-texto mb-6">Comportamiento en el tiempo</h3>
          <div className="h-[350px]">
            <GraficaGastos datos={gastosPorPeriodo || []} />
          </div>
        </div>

        <div className="rounded-xl border border-borde bg-superficie p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-lg text-texto mb-6">Distribución por categoría</h3>
          <div className="h-[350px]">
            <GraficaCategorias datos={gastosPorCategoria || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

