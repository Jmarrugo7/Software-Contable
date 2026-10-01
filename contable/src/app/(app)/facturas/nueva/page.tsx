import { createClient } from "@/lib/supabase/server";
import { FormularioFactura } from "./formulario-factura";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Nueva Factura" };

export default async function NuevaFacturaPage() {
  const supabase = await createClient();

  const [gastos, fuentes, metodos] = await Promise.all([
    supabase.from("gastos_compras").select("id, nombre").order("nombre"),
    supabase.from("fuentes_recursos").select("id, nombre").order("nombre"),
    supabase.from("metodos_pago").select("id, nombre, requiere_comprobante").order("nombre"),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/facturas">
          <Button variante="fantasma" tamano="pequeno" aria-label="Volver">
            <ChevronLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-texto">
            Nueva factura
          </h1>
          <p className="mt-1 text-texto-suave">Registra un nuevo gasto o compra en el sistema.</p>
        </div>
      </div>

      <div className="rounded-lg border border-borde bg-superficie p-6 shadow-sm">
        <FormularioFactura 
          gastos={gastos.data || []} 
          fuentes={fuentes.data || []} 
          metodos={metodos.data || []} 
        />
      </div>
    </div>
  );
}
