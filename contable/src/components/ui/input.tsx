import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto",
        "placeholder:text-texto-suave/70 disabled:opacity-60",
        "focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200",
        "aria-[invalid=true]:border-rojo aria-[invalid=true]:ring-rojo/20",
        className
      )}
      {...props}
    />
  );
}
