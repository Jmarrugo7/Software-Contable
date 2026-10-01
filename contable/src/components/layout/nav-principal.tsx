"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const enlaces = [
  { href: "/facturas", texto: "Facturas" },
  { href: "/gastos", texto: "Control de gastos" },
];

export function NavPrincipal() {
  const ruta = usePathname();

  return (
    <nav aria-label="Principal" className="flex gap-6">
      {enlaces.map(({ href, texto }) => {
        const activo = ruta === href || ruta.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "border-b-[3px] py-4 font-semibold",
              activo
                ? "border-sello text-tinta"
                : "border-transparent text-tinta-suave hover:text-tinta"
            )}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
