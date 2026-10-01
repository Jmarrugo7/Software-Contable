import { createClient } from "@/lib/supabase/server";
import { FiltrosGastos } from "./filtros-gastos";
import { GraficaGastos } from "./grafica-gastos";
import { GraficaCategorias } from "./grafica-categorias";
import { TablaCategorias } from "./tabla-categorias";
import { BarChart3, Receipt } from "lucide-react";

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
    metodo?: string;
    agrupacion?: string 
  }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const agrupacion = params.agrupacion || "month";
  const desde = params.desde || null;
  const hasta = params.hasta || null;
  const categoriaId = params.categoria ? Number(params.categoria) : null;
  const fuenteId = params.fuente ? Number(params.fuente) : null;
  const metodoId = params.metodo ? Number(params.metodo) : null;

  // Cargar catálogos para filtros
  const [{ data: categorias }, { data: fuentes }, { data: metodos }] = await Promise.all([
    supabase.from("gastos_compras").select("id, nombre").order("nombre"),
    supabase.from("fuentes_recursos").select("id, nombre").order("nombre"),
    supabase.from("metodos_pago").select("id, nombre").order("nombre")
  ]);

  // Consultar resumen (total y cantidad) usando la función RPC
  const { data: resumenReq } = await supabase.rpc("resumen_gastos", {
    p_desde: desde as any,
    p_hasta: hasta as any,
    p_gasto_compra_id: categoriaId as any,
    p_fuente_recursos_id: fuenteId as any,
    p_metodo_pago_id: metodoId as any,
  } as any);
  
  const resumen = resumenReq?.[0] || { total: 0, cantidad_facturas: 0 };

  // Consultar datos para las gráficas
  const { data: gastosPorPeriodo } = await supabase.rpc("gastos_por_periodo", {
    p_agrupacion: agrupacion,
    p_desde: desde as any,
    p_hasta: hasta as any,
    p_gasto_compra_id: categoriaId as any,
    p_fuente_recursos_id: fuenteId as any,
    p_metodo_pago_id: metodoId as any,
  } as any);

  const { data: gastosPorCategoria } = await supabase.rpc("gastos_por_categoria", {
    p_desde: desde as any,
    p_hasta: hasta as any,
    p_fuente_recursos_id: fuenteId as any,
    p_metodo_pago_id: metodoId as any,
  } as any);

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
            metodo: metodoId
          }}
        />
      </div>

      <FiltrosGastos 
        categorias={categorias || []} 
        fuentes={fuentes || []}
        metodos={metodos || []}
        valoresActuales={{
          desde: desde || "",
          hasta: hasta || "",
          categoria: params.categoria || "",
          fuente: params.fuente || "",
          metodo: params.metodo || "",
          agrupacion: agrupacion
        }} 
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
        <h3 className="font-semibold text-lg text-texto mb-4">Detalle de Gastos por Categoría</h3>
        <TablaCategorias datos={gastosPorCategoria || []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-borde bg-superficie p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-texto mb-6">Comportamiento en el tiempo</h3>
          <div className="h-[350px]">
            <GraficaGastos datos={gastosPorPeriodo || []} agrupacion={agrupacion} />
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
