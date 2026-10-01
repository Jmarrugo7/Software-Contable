import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Etiqueta + control + mensaje de error, con los atributos de accesibilidad conectados.
export function Campo({
  id,
  etiqueta,
  error,
  className,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-texto">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-rojo animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
