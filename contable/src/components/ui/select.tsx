import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-base text-texto",
        "focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200",
        "aria-[invalid=true]:border-rojo aria-[invalid=true]:ring-rojo/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
