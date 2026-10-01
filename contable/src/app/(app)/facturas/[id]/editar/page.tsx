import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FormularioFactura } from "../../nueva/formulario-factura";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Editar Factura" };

export default async function EditarFacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Cargar datos de la factura y los catálogos en paralelo
  const [facturaRes, gastosRes, fuentesRes, metodosRes] = await Promise.all([
    supabase.from("facturas").select("*").eq("id", id).single(),
    supabase.from("gastos_compras").select("id, nombre").order("nombre"),
    supabase.from("fuentes_recursos").select("id, nombre").order("nombre"),
    supabase.from("metodos_pago").select("id, nombre, requiere_comprobante").order("nombre"),
  ]);

  if (facturaRes.error || !facturaRes.data) {
    notFound();
  }

  // Si la factura está anulada, podríamos bloquear la edición, pero según ERS se permite editar.
  // Sin embargo, por UX es bueno informar. Aquí la dejaremos pasar al form.

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/facturas/${id}`}>
          <Button variante="fantasma" tamano="pequeno" aria-label="Volver al detalle">
            <ChevronLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-texto">
            Editar factura
          </h1>
          <p className="mt-1 text-texto-suave">Modifica los detalles de la factura.</p>
        </div>
      </div>

      <div className="rounded-lg border border-borde bg-superficie p-6 shadow-sm">
        <FormularioFactura 
          gastos={gastosRes.data || []} 
          fuentes={fuentesRes.data || []} 
          metodos={metodosRes.data || []} 
          facturaId={facturaRes.data.id}
          initialData={facturaRes.data}
        />
      </div>
    </div>
  );
}
