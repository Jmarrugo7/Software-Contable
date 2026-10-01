import { cn } from "@/lib/utils";

interface DatoCategoria {
  gasto_compra_id: number;
  nombre: string;
  total: number;
  cantidad_facturas: number;
}

export function TablaCategorias({ datos }: { datos: DatoCategoria[] }) {
  if (!datos || datos.length === 0) {
    return <div className="p-8 text-center text-texto-suave">No hay datos para mostrar en la tabla.</div>;
  }

  const sumaTotal = datos.reduce((acc, curr) => acc + curr.total, 0);

  const formatoMoneda = new Intl.NumberFormat("es-CO", { 
    style: "currency", 
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  // Sort descending by total
  const datosOrdenados = [...datos].sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-lg border border-borde bg-superficie shadow-sm">
      <table className="w-full border-collapse text-sm block md:table">
        <thead className="bg-primario-suave border-b border-primario/20 text-primario hidden md:table-header-group">
          <tr>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-left">Tipo de Gasto</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-right">Suma de Total</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-right">Porcentaje</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borde block md:table-row-group">
          {datosOrdenados.map((item) => {
            const porcentaje = sumaTotal > 0 ? (item.total / sumaTotal) * 100 : 0;
            return (
              <tr key={item.gasto_compra_id} className="block md:table-row hover:bg-gris-50/50 transition-colors p-4 md:p-0">
                <td className="flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-2.5 text-texto">
                  <span className="font-semibold text-primario md:hidden text-xs uppercase tracking-wider">Tipo de Gasto</span>
                  <span className="text-right md:text-left">{item.nombre}</span>
                </td>
                <td className={cn(
                  "flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-2.5 md:text-right font-medium cifras",
                  item.total < 0 ? "text-rojo" : "text-texto"
                )}>
                  <span className="font-semibold text-primario md:hidden text-xs uppercase tracking-wider">Suma de Total</span>
                  <span>{formatoMoneda.format(item.total)}</span>
                </td>
                <td className="flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-2.5 md:text-right text-texto-suave cifras border-t border-borde/50 md:border-none mt-2 pt-2 md:mt-0 md:pt-2.5">
                  <span className="font-semibold text-primario md:hidden text-xs uppercase tracking-wider">Porcentaje</span>
                  <span>{porcentaje.toFixed(2)}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-primario-suave/50 md:border-t-2 md:border-primario/20 font-bold text-primario block md:table-footer-group">
          <tr className="block md:table-row p-4 md:p-0">
            <td className="flex justify-between md:table-cell px-2 md:px-4 py-2 md:py-3">
              <span className="md:hidden">SUMA TOTAL</span>
              <span className="hidden md:inline">SUMA TOTAL</span>
              <span className="md:hidden text-right cifras">{formatoMoneda.format(sumaTotal)}</span>
            </td>
            <td className="hidden md:table-cell px-4 py-3 text-right cifras">{formatoMoneda.format(sumaTotal)}</td>
            <td className="hidden md:table-cell px-4 py-3 text-right cifras">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
