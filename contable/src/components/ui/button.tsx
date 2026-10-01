import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variantes = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 " +
    "disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variante: {
        primario:
          "bg-primario text-blanco hover:bg-primario-hover shadow-md shadow-primario/25 hover:shadow-lg hover:shadow-primario/30",
        secundario:
          "border border-borde bg-superficie text-texto hover:bg-gris-50",
        fantasma: "text-texto-suave hover:bg-gris-100 hover:text-texto",
      },
      tamano: {
        normal: "h-11 px-5 text-base",
        pequeno: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: { variante: "primario", tamano: "normal" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantes> {}

export function Button({ className, variante, tamano, ...props }: ButtonProps) {
  return <button className={cn(variantes({ variante, tamano }), className)} {...props} />;
}
