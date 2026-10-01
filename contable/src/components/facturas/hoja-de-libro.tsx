// Ilustración decorativa del login: una hoja de libro contable con filas de ejemplo.
// Los datos son inventados; no corresponden a ninguna factura real.
const numero = new Intl.NumberFormat("es-CO");

const filas = [
  { fecha: "02 sep", gasto: "Materiales", proveedor: "Ferretería El Puente", total: 249900 },
  { fecha: "02 sep", gasto: "Alimentación", proveedor: "Restaurante La Plaza", total: 186500 },
  { fecha: "03 sep", gasto: "Transporte y fletes", proveedor: "Transportes Andina", total: 92000 },
  { fecha: "04 sep", gasto: "Nota crédito", proveedor: "Ferretería El Puente", total: -39900 },
  { fecha: "05 sep", gasto: "Servicios públicos", proveedor: "Aguas de la Bahía", total: 148300 },
];

const totalGeneral = filas.reduce((suma, f) => suma + f.total, 0);
const filasVacias = 7;

function Valor({ valor }: { valor: number }) {
  return valor < 0 ? (
    <span className="text-rojo">−{numero.format(Math.abs(valor))}</span>
  ) : (
    <span>{numero.format(valor)}</span>
  );
}

export function HojaDeLibro() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-xl overflow-hidden border border-regla bg-hoja"
      style={{
        // La hoja se desvanece hacia abajo, como una página que continúa.
        maskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
      }}
    >
      {/* Doble línea roja del margen, como en los libros de contabilidad */}
      <span className="absolute inset-y-0 left-[5.25rem] w-px bg-rojo/30" />
      <span className="absolute inset-y-0 left-[5.5rem] w-px bg-rojo/30" />

      <table className="w-full border-collapse text-[0.95rem]">
        <thead>
          <tr className="border-b-2 border-tinta text-left text-sm text-tinta-suave">
            <th className="h-11 w-[5.5rem] pl-4 font-semibold">Fecha</th>
            <th className="h-11 pl-4 font-semibold">Gasto/Compra</th>
            <th className="h-11 font-semibold">Proveedor</th>
            <th className="h-11 pr-4 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-b border-regla">
              <td className="h-12 pl-4 text-tinta-suave">{f.fecha}</td>
              <td className="h-12 pl-4">{f.gasto}</td>
              <td className="h-12 text-tinta-suave">{f.proveedor}</td>
              <td className="h-12 pr-4 text-right">
                <Valor valor={f.total} />
              </td>
            </tr>
          ))}
          <tr className="border-b border-regla">
            <td colSpan={3} className="h-12 pr-4 text-right font-semibold">
              Total
            </td>
            <td className="h-12 pr-4 text-right font-semibold">
              <span className="inline-block border-b-[5px] border-double border-tinta leading-tight">
                {numero.format(totalGeneral)}
              </span>
            </td>
          </tr>
          {Array.from({ length: filasVacias }).map((_, i) => (
            <tr key={`v${i}`} className="border-b border-regla">
              <td className="h-12" colSpan={4} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
