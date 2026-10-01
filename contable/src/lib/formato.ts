// Formatos de dinero y fecha. Todas las fechas se muestran en hora de Colombia.
export const ZONA_HORARIA = "America/Bogota";

const moneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatearMoneda(valor: number): string {
  return moneda.format(valor);
}

const fechaHora = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ZONA_HORARIA,
});

export function formatearFechaHora(iso: string): string {
  return fechaHora.format(new Date(iso));
}
