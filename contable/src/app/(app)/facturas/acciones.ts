"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeEditar } from "@/lib/permisos";

export async function crearFactura(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autorizado" };
  }
  if (!puedeEditar(user.email)) {
    return { error: "No tienes permisos para crear facturas." };
  }

  try {
    const data = {
      gasto_compra_id: Number(formData.get("gasto_compra_id")),
      proveedor: String(formData.get("proveedor") || "").trim(),
      numero_factura: formData.get("numero_factura") ? String(formData.get("numero_factura")).trim() : null,
      cantidad: Number(formData.get("cantidad")) || 1,
      precio_unitario: Number(formData.get("precio_unitario")) || 0,
      iva: Number(formData.get("iva")) || 0,
      retefuente: Number(formData.get("retefuente")) || 0,
      reteica: Number(formData.get("reteica")) || 0,
      reteiva: Number(formData.get("reteiva")) || 0,
      observaciones: String(formData.get("observaciones") || "").trim(),
      fuente_recursos_id: Number(formData.get("fuente_recursos_id")),
      metodo_pago_id: Number(formData.get("metodo_pago_id")),
      numero_comprobante: formData.get("numero_comprobante") ? String(formData.get("numero_comprobante")).trim() : null,
      estado: "activa",
      created_by: user.id
    };

    // Verificar si es nota crédito para permitir negativos
    const { data: gasto } = await supabase.from("gastos_compras").select("nombre").eq("id", data.gasto_compra_id).single();
    const esNotaCredito = gasto?.nombre?.toUpperCase() === "NOTA CREDITO";

    if (!data.gasto_compra_id || !data.proveedor || !data.observaciones || !data.fuente_recursos_id || !data.metodo_pago_id) {
       return { error: "Faltan campos obligatorios" };
    }

    if (!esNotaCredito && data.precio_unitario <= 0) {
       return { error: "El precio unitario debe ser mayor a 0" };
    }

    if (!esNotaCredito && (data.iva < 0 || data.retefuente < 0 || data.reteica < 0 || data.reteiva < 0)) {
       return { error: "Los valores de IVA y retenciones no pueden ser negativos" };
    }

    const { error } = await supabase.from("facturas").insert(data);
    
    if (error) {
      console.error(error);
      return { error: "No se pudo registrar la factura. " + error.message };
    }
  } catch (err: any) {
    return { error: err.message || "Error inesperado" };
  }

  revalidatePath("/facturas");
  redirect("/facturas");
}

export async function anularFactura(id: string, motivo?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !puedeEditar(user.email)) {
    throw new Error("No tienes permisos para anular facturas.");
  }
  const { error } = await supabase.rpc("anular_factura", { p_factura_id: id, p_motivo: motivo });
  if (error) throw new Error("No se pudo anular la factura: " + error.message);
  revalidatePath("/facturas");
  redirect("/facturas");
}

export async function reactivarFactura(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !puedeEditar(user.email)) {
    throw new Error("No tienes permisos para reactivar facturas.");
  }
  const { error } = await supabase.rpc("reactivar_factura", { p_factura_id: id });
  if (error) throw new Error("No se pudo reactivar la factura: " + error.message);
  revalidatePath("/facturas");
  redirect("/facturas");
}

export async function editarFactura(id: string, prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autorizado" };
  }
  if (!puedeEditar(user.email)) {
    return { error: "No tienes permisos para editar facturas." };
  }

  try {
    const data = {
      gasto_compra_id: Number(formData.get("gasto_compra_id")),
      proveedor: String(formData.get("proveedor") || "").trim(),
      numero_factura: formData.get("numero_factura") ? String(formData.get("numero_factura")).trim() : null,
      cantidad: Number(formData.get("cantidad")) || 1,
      precio_unitario: Number(formData.get("precio_unitario")) || 0,
      iva: Number(formData.get("iva")) || 0,
      retefuente: Number(formData.get("retefuente")) || 0,
      reteica: Number(formData.get("reteica")) || 0,
      reteiva: Number(formData.get("reteiva")) || 0,
      observaciones: String(formData.get("observaciones") || "").trim(),
      fuente_recursos_id: Number(formData.get("fuente_recursos_id")),
      metodo_pago_id: Number(formData.get("metodo_pago_id")),
      numero_comprobante: formData.get("numero_comprobante") ? String(formData.get("numero_comprobante")).trim() : null,
      updated_at: new Date().toISOString()
    };

    // Verificar si es nota crédito para permitir negativos
    const { data: gasto } = await supabase.from("gastos_compras").select("nombre").eq("id", data.gasto_compra_id).single();
    const esNotaCredito = gasto?.nombre?.toUpperCase() === "NOTA CREDITO";

    if (!data.gasto_compra_id || !data.proveedor || !data.observaciones || !data.fuente_recursos_id || !data.metodo_pago_id) {
       return { error: "Faltan campos obligatorios" };
    }

    if (!esNotaCredito && data.precio_unitario <= 0) {
       return { error: "El precio unitario debe ser mayor a 0" };
    }

    if (!esNotaCredito && (data.iva < 0 || data.retefuente < 0 || data.reteica < 0 || data.reteiva < 0)) {
       return { error: "Los valores de IVA y retenciones no pueden ser negativos" };
    }

    const { error } = await supabase.from("facturas").update(data).eq("id", id);
    
    if (error) {
      console.error(error);
      return { error: "No se pudo actualizar la factura. " + error.message };
    }
  } catch (err: any) {
    return { error: err.message || "Error inesperado" };
  }

  revalidatePath("/facturas");
  redirect(`/facturas/${id}`);
}

