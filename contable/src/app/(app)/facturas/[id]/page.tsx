import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotonAnular } from "./boton-anular";
import { BotonReactivar } from "./boton-reactivar";
import { puedeEditar } from "@/lib/permisos";

export default async function DetalleFacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const [{ data: factura, error }, { data: { user } }] = await Promise.all([
    supabase
      .from("facturas")
      .select(`
        *,
        gastos_compras(nombre),
        fuentes_recursos(nombre),
        metodos_pago(nombre),
        anulaciones(fecha_anulacion, motivo)
      `)
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (error || !factura) {
    notFound();
  }

  const esEditor = puedeEditar(user?.email);
  const formatoMoneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <Link href="/facturas" className="mt-1 sm:mt-0 shrink-0">
            <Button variante="fantasma" tamano="pequeno" aria-label="Volver">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-texto">
              Detalle de Factura
            </h1>
            <p className="mt-1 text-sm sm:text-base text-texto-suave">
              Registrada el {new Date(factura.fecha_registro).toLocaleString()}
            </p>
          </div>
        </div>
        
        {esEditor && (
          <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
            {factura.estado === "activa" ? (
              <>
                <BotonAnular id={factura.id} />
                <Link href={`/facturas/${factura.id}/editar`}>
                  <Button variante="secundario">
                    <Edit className="size-4 mr-2" />
                    Editar
                  </Button>
                </Link>
              </>
            ) : (
              <BotonReactivar id={factura.id} />
            )}
          </div>
        )}
      </div>

      {factura.estado === "anulada" && factura.anulaciones?.[0] && (
        <div className="mb-6 rounded-lg border border-rojo/30 bg-rojo-suave p-4 text-rojo">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5" />
            Esta factura está anulada
          </div>
          <p className="mt-1 text-sm">
            Anulada el: {new Date(factura.anulaciones[0].fecha_anulacion).toLocaleString()}
            {factura.anulaciones[0].motivo && ` - Motivo: ${factura.anulaciones[0].motivo}`}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-borde bg-superficie overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-borde">
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b border-borde pb-2">Información General</h3>
            
            <div>
              <p className="text-sm text-texto-suave">Proveedor</p>
              <p className="font-medium text-texto">{factura.proveedor}</p>
            </div>
            
            <div>
              <p className="text-sm text-texto-suave">Categoría</p>
              <p className="font-medium text-texto">{factura.gastos_compras?.nombre}</p>
            </div>

            <div>
              <p className="text-sm text-texto-suave">Número de Factura</p>
              <p className="font-medium text-texto">{factura.numero_factura || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-texto-suave">Observaciones</p>
              <p className="font-medium text-texto bg-gris-50 p-2 rounded mt-1">{factura.observaciones}</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b border-borde pb-2">Valores y Pagos</h3>
            
            <div className="flex justify-between">
              <span className="text-sm text-texto-suave">Cantidad x Precio</span>
              <span className="font-medium cifras">{factura.cantidad} x {formatoMoneda.format(factura.precio_unitario)}</span>
            </div>

            <div className="flex justify-between text-texto-suave">
              <span>Subtotal</span>
              <span className="cifras">{formatoMoneda.format(factura.subtotal)}</span>
            </div>
            
            {factura.iva > 0 && (
              <div className="flex justify-between text-texto-suave">
                <span>IVA (+)</span>
                <span className="cifras">{formatoMoneda.format(factura.iva)}</span>
              </div>
            )}

            {(factura.retefuente > 0 || factura.reteica > 0 || factura.reteiva > 0) && (
              <div className="pt-2 mt-2 border-t border-borde/50">
                <p className="text-sm font-medium mb-1">Retenciones (-)</p>
                {factura.retefuente > 0 && <div className="flex justify-between text-sm text-texto-suave"><span>Retefuente</span><span className="cifras">{formatoMoneda.format(factura.retefuente)}</span></div>}
                {factura.reteica > 0 && <div className="flex justify-between text-sm text-texto-suave"><span>ReteICA</span><span className="cifras">{formatoMoneda.format(factura.reteica)}</span></div>}
                {factura.reteiva > 0 && <div className="flex justify-between text-sm text-texto-suave"><span>ReteIVA</span><span className="cifras">{formatoMoneda.format(factura.reteiva)}</span></div>}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 mt-3 border-t border-borde font-bold text-lg">
              <span>Total</span>
              <span className="text-primario cifras">{formatoMoneda.format(factura.total)}</span>
            </div>

            <div className="pt-4 mt-4 border-t border-borde space-y-2">
              <div>
                <span className="text-xs text-texto-suave uppercase tracking-wider">Fuente de recursos</span>
                <p className="font-medium">{factura.fuentes_recursos?.nombre}</p>
              </div>
              <div>
                <span className="text-xs text-texto-suave uppercase tracking-wider">Método de pago</span>
                <p className="font-medium">{factura.metodos_pago?.nombre} {factura.numero_comprobante && `(#${factura.numero_comprobante})`}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

