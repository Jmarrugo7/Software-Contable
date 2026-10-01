import Link from "next/link";
import { cerrarSesion } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { NavPrincipal } from "./nav-principal";

export function Encabezado({ email }: { email: string }) {
  return (
    <header className="border-b border-regla bg-hoja">
      {/* Móvil: nombre + cerrar sesión arriba, navegación debajo. Escritorio: todo en una fila. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 px-4 sm:px-6">
        <Link
          href="/facturas"
          className="order-1 py-3 font-serif text-2xl font-semibold tracking-tight"
        >
          Contable
        </Link>

        <div className="order-2 ml-auto flex items-center gap-3 py-2 sm:order-3">
          <span className="hidden text-sm text-tinta-suave md:inline">{email}</span>
          <form action={cerrarSesion}>
            <Button type="submit" variante="secundario" tamano="pequeno">
              Cerrar sesión
            </Button>
          </form>
        </div>

        <div className="order-3 w-full border-t border-regla sm:order-2 sm:w-auto sm:border-t-0">
          <NavPrincipal />
        </div>
      </div>
    </header>
  );
}
