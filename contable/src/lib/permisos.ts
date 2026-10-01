/**
 * Sistema de permisos basado en roles.
 *
 * Roles:
 *   - "admin"       → puede crear, editar, anular, reactivar y visualizar.
 *   - "solo-lectura" → solo puede visualizar.
 *
 * El rol se determina por el email del usuario autenticado.
 */

export type Rol = "admin" | "solo-lectura";

// Lista de correos con acceso restringido (solo lectura).
const CORREOS_SOLO_LECTURA: string[] = [
  "gruposinergiaintegralsas@gmail.com",
];

/** Devuelve el rol del usuario según su email. */
export function obtenerRol(email: string | undefined | null): Rol {
  if (!email) return "solo-lectura"; // Sin email → mínimo privilegio
  return CORREOS_SOLO_LECTURA.includes(email.toLowerCase())
    ? "solo-lectura"
    : "admin";
}

/** Devuelve `true` si el usuario puede crear, editar o anular facturas. */
export function puedeEditar(email: string | undefined | null): boolean {
  return obtenerRol(email) === "admin";
}

/**
 * Rutas que requieren permisos de escritura.
 * Usadas en el middleware para bloquear la navegación directa.
 */
export const RUTAS_ESCRITURA = ["/facturas/nueva"];

/** Verifica si una ruta dinámica requiere permisos de escritura. */
export function rutaRequiereEscritura(pathname: string): boolean {
  // Coincidencias exactas
  if (RUTAS_ESCRITURA.includes(pathname)) return true;
  // Patrón: /facturas/<uuid>/editar
  if (/^\/facturas\/[^/]+\/editar$/.test(pathname)) return true;
  return false;
}
