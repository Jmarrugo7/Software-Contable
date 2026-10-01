import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { puedeEditar } from "@/lib/permisos";

export const metadata: Metadata = { title: "Facturas" };

export default async function PaginaFacturas({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const supabase = await createClient();
  const { estado } = await searchParams;
  const estadoFiltro = estado === "anulada" ? "anulada" : "activa";

  const { data: { user } } = await supabase.auth.getUser();
  const esEditor = puedeEditar(user?.email);

  const { data: facturas } = await supabase
    .from("facturas")
    .select(`
      *,
      gastos_compras(nombre),
      fuentes_recursos(nombre),
      metodos_pago(nombre)
    `)
    .eq("estado", estadoFiltro)
    .order("fecha_registro", { ascending: false });

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-texto">
            {estadoFiltro === "activa" ? "Facturas activas" : "Facturas anuladas"}
          </h1>
          <p className="mt-2 max-w-prose text-texto-suave">
            {estadoFiltro === "activa" 
              ? "Aquí vas a registrar, consultar y administrar tus facturas registradas."
              : "Historial de facturas que han sido anuladas y no se contabilizan."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {estadoFiltro === "activa" ? (
            <Link href="/facturas?estado=anulada">
              <Button variante="secundario">Ver anuladas</Button>
            </Link>
          ) : (
            <Link href="/facturas">
              <Button variante="secundario">Ver activas</Button>
            </Link>
          )}
          
          {esEditor && (
            <Link href="/facturas/nueva">
              <Button>
                <Plus className="size-4" />
                Nueva factura
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-borde bg-superficie shadow-sm">
        {/* On mobile, no overflow-x-auto so it stacks. We'll use a standard table that converts to block/flex on small screens */}
        <table className="w-full border-collapse text-sm block md:table">
          <thead className="bg-gris-50 border-b border-borde text-texto-suave hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">Fecha</th>
              <th className="px-4 py-3 font-semibold text-left">Gasto/Compra</th>
              <th className="px-4 py-3 font-semibold text-left">Proveedor</th>
              <th className="px-4 py-3 font-semibold text-left">Fuente</th>
              <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
              <th className="px-4 py-3 font-semibold text-right">IVA</th>
              <th className="px-4 py-3 font-semibold text-right">Retenciones</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
              <th className="px-4 py-3 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde block md:table-row-group">
            {facturas && facturas.length > 0 ? (
              facturas.map((f: any) => {
                const esNotaCredito = f.gastos_compras?.nombre?.toUpperCase() === "NOTA CREDITO";
                return (
                <tr 
                  key={f.id} 
                  className={`block md:table-row border-b border-borde md:border-none p-4 md:p-0 ${esNotaCredito ? "bg-rose-50/70 md:border-l-4 md:border-l-rose-400 hover:bg-rose-100/60" : "hover:bg-gris-50/50"}`}
                >
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 ${esNotaCredito ? "text-rose-700" : "text-texto"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">Fecha</span>
                    <span className="text-right md:text-left">{new Date(f.fecha_registro).toLocaleDateString()}</span>
                  </td>
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 font-medium ${esNotaCredito ? "text-rose-700" : "text-texto"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">Gasto/Compra</span>
                    <div className="text-right md:text-left flex items-center justify-end md:justify-start gap-2">
                      {f.gastos_compras?.nombre}
                      {esNotaCredito && <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Resta</span>}
                    </div>
                  </td>
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 ${esNotaCredito ? "text-rose-600" : "text-texto"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">Proveedor</span>
                    <span className="text-right md:text-left">{f.proveedor}</span>
                  </td>
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 ${esNotaCredito ? "text-rose-500" : "text-texto-suave"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">Fuente</span>
                    <span className="text-right md:text-left">{f.fuentes_recursos?.nombre}</span>
                  </td>
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 md:text-right cifras ${esNotaCredito ? "text-rose-700 font-medium" : "text-texto"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">Subtotal</span>
                    <span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(f.subtotal)}</span>
                  </td>
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 md:text-right cifras ${esNotaCredito ? "text-rose-700 font-medium" : "text-texto"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">IVA</span>
                    <span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(f.iva)}</span>
                  </td>
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 md:text-right cifras ${esNotaCredito ? "text-rose-700 font-medium" : "text-texto"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">Retenciones</span>
                    <span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((f.retefuente || 0) + (f.reteica || 0) + (f.reteiva || 0))}</span>
                  </td>
                  <td className={`flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 font-medium md:text-right cifras ${esNotaCredito ? "text-rose-700" : "text-texto"}`}>
                    <span className="font-semibold md:hidden text-texto-suave">Total</span>
                    <span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(f.total)}</span>
                  </td>
                  <td className="flex justify-center md:table-cell px-2 md:px-4 py-4 md:py-3 md:text-center mt-2 md:mt-0 border-t border-borde/50 md:border-none">
                    <Link href={`/facturas/${f.id}`} className="text-primario hover:underline font-medium bg-primario/10 md:bg-transparent px-4 py-2 md:p-0 rounded-lg w-full md:w-auto text-center">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr className="block md:table-row">
                <td colSpan={9} className="block md:table-cell px-4 py-8 text-center text-texto-suave">
                  No hay facturas {estadoFiltro === "activa" ? "activas" : "anuladas"}.
                </td>
              </tr>
            )}
          </tbody>
          {facturas && facturas.length > 0 && (() => {
            const fmt = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
            const totales = facturas.reduce((acc: any, f: any) => ({
              subtotal: acc.subtotal + (f.subtotal || 0),
              iva: acc.iva + (f.iva || 0),
              retenciones: acc.retenciones + (f.retefuente || 0) + (f.reteica || 0) + (f.reteiva || 0),
              total: acc.total + (f.total || 0),
            }), { subtotal: 0, iva: 0, retenciones: 0, total: 0 });
            return (
              <tfoot className="block md:table-footer-group mt-4 md:mt-0">
                <tr className="block md:table-row bg-emerald-50 md:border-t-2 md:border-emerald-200 p-4 md:p-0 rounded-lg md:rounded-none">
                  <td className="hidden md:table-cell px-4 py-3 font-semibold text-emerald-800" colSpan={4}>Totales</td>
                  <td className="flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 md:text-right font-semibold cifras text-emerald-800">
                    <span className="md:hidden">Subtotal</span>
                    {fmt(totales.subtotal)}
                  </td>
                  <td className="flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 md:text-right font-semibold cifras text-emerald-800">
                    <span className="md:hidden">IVA</span>
                    {fmt(totales.iva)}
                  </td>
                  <td className="flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 md:text-right font-semibold cifras text-emerald-800">
                    <span className="md:hidden">Retenciones</span>
                    {fmt(totales.retenciones)}
                  </td>
                  <td className="flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3 md:text-right font-bold md:font-semibold cifras text-emerald-800 text-lg md:text-base border-t border-emerald-100 md:border-none mt-2 pt-2 md:mt-0 md:pt-3">
                    <span className="md:hidden text-emerald-900">Total General</span>
                    {fmt(totales.total)}
                  </td>
                  <td className="hidden md:table-cell"></td>
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>
    </>
  );
}

