"use server";

import { createClient } from "@/lib/supabase/server";

export async function obtenerDatosExportacion(filtros: {
  desde?: string | null;
  hasta?: string | null;
  categoria?: number | null;
  fuente?: number | null;
  metodo?: number | null;
}) {
  const supabase = await createClient();

  // 1. Obtener facturas detalladas
  let queryFacturas = supabase
    .from("facturas")
    .select(`
      *,
      gastos_compras(nombre),
      fuentes_recursos(nombre),
      metodos_pago(nombre)
    `)
    .eq("estado", "activa")
    .order("fecha_registro", { ascending: true });

  if (filtros.categoria) queryFacturas = queryFacturas.eq("gasto_compra_id", filtros.categoria);
  if (filtros.fuente) queryFacturas = queryFacturas.eq("fuente_recursos_id", filtros.fuente);
  if (filtros.metodo) queryFacturas = queryFacturas.eq("metodo_pago_id", filtros.metodo);
  if (filtros.desde) queryFacturas = queryFacturas.gte("fecha_registro", filtros.desde);
  
  // Agregar un día a 'hasta' para incluir todo ese día
  if (filtros.hasta) {
    const hastaDate = new Date(filtros.hasta);
    hastaDate.setDate(hastaDate.getDate() + 1);
    queryFacturas = queryFacturas.lt("fecha_registro", hastaDate.toISOString().split('T')[0]);
  }

  const { data: facturas, error: errorFacturas } = await queryFacturas;
  if (errorFacturas) throw new Error("Error al consultar facturas: " + errorFacturas.message);

  // 2. Obtener resumen por categoría
  const { data: resumen, error: errorResumen } = await supabase.rpc("gastos_por_categoria", {
    p_desde: filtros.desde || null,
    p_hasta: filtros.hasta || null,
    p_fuente_recursos_id: filtros.fuente || null,
    p_metodo_pago_id: filtros.metodo || null,
  } as any);

  if (errorResumen) throw new Error("Error al consultar resumen: " + errorResumen.message);

  return { facturas, resumen };
}
