"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FileText, BarChart3, LogOut, Menu, X, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const enlaces = [
  { href: "/facturas", texto: "Facturas", icono: FileText },
  { href: "/gastos", texto: "Control de gastos", icono: BarChart3 },
];

export function Sidebar({
  email,
  cerrarSesionAction,
  puedeEditar,
}: {
  email: string;
  cerrarSesionAction: () => Promise<void>;
  puedeEditar: boolean;
}) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* Botón hamburguesa (solo móvil) */}
      <button
        className="btn-menu"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      {/* Overlay */}
      <div
        className={cn("sidebar-overlay", abierto && "abierto")}
        onClick={() => setAbierto(false)}
      />

      {/* Sidebar */}
      <aside className={cn("sidebar", abierto && "abierto")} aria-label="Menú principal">
        {/* Header del sidebar */}
        <div className="flex items-center justify-between px-5 py-6">
          <Link
            href="/facturas"
            className="font-serif text-xl font-bold tracking-tight text-blanco"
            onClick={() => setAbierto(false)}
          >
            Contable
          </Link>
          <button
            className="rounded-md p-1 text-gris-400 hover:text-blanco md:hidden"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Badge de solo lectura */}
        {!puedeEditar && (
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-2 text-amber-300">
            <EyeOff className="size-4 shrink-0" />
            <span className="text-xs font-semibold">Solo lectura</span>
          </div>
        )}

        {/* Navegación */}
        <nav aria-label="Principal" className="flex-1 space-y-1 px-3">
          {enlaces.map(({ href, texto, icono: Icono }) => {
            const activo = ruta === href || ruta.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className="sidebar-link relative"
                onClick={() => setAbierto(false)}
              >
                <Icono className="size-5 shrink-0" />
                {texto}
              </Link>
            );
          })}
        </nav>

        {/* Footer: email + cerrar sesión */}
        <div className="border-t border-gris-700 px-3 py-4">
          <p className="mb-3 truncate px-3 text-xs text-gris-400" title={email}>
            {email}
          </p>
          <form action={cerrarSesionAction}>
            <button
              type="submit"
              className="sidebar-link relative w-full text-left text-rojo/80 hover:text-rojo"
            >
              <LogOut className="size-5 shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

