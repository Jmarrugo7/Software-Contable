"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { puedeEditar } from "@/lib/permisos";

export type TipoPendiente = "CUENTA_POR_PAGAR" | "CUENTA_POR_COBRAR" | "NOTA";

// ─── Crear un pendiente ───
export async function crearPendiente(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !puedeEditar(user.email)) {
    return { error: "No tienes permisos para agregar pendientes." };
  }

  const tipo = formData.get("tipo") as TipoPendiente;
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const valorStr = formData.get("valor") as string | null;
  const valor = valorStr ? parseFloat(valorStr) : null;

  if (!descripcion) {
    return { error: "La descripción es obligatoria." };
  }

  if (tipo !== "NOTA" && (!valor || valor <= 0)) {
    return { error: "El valor es obligatorio y debe ser mayor a 0." };
  }

  const { error } = await supabase.from("pendientes").insert({
    tipo,
    descripcion,
    valor: tipo === "NOTA" ? null : valor,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pendientes");
  return { ok: true };
}

// ─── Marcar como cumplido ───
// El trigger de la base de datos se encarga de crear la actividad realizada.
export async function marcarCumplido(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !puedeEditar(user.email)) {
    return { error: "No tienes permisos para marcar pendientes como cumplidos." };
  }

  const { error } = await supabase
    .from("pendientes")
    .update({ cumplido: true })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pendientes");
  return { ok: true };
}

// ─── Eliminar un pendiente ───
export async function eliminarPendiente(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !puedeEditar(user.email)) {
    return { error: "No tienes permisos para eliminar pendientes." };
  }

  const { error } = await supabase
    .from("pendientes")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pendientes");
  return { ok: true };
}

// ─── Editar un pendiente ───
export async function editarPendiente(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !puedeEditar(user.email)) {
    return { error: "No tienes permisos para editar pendientes." };
  }

  const tipo = formData.get("tipo") as TipoPendiente;
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const valorStr = formData.get("valor") as string | null;
  const valor = valorStr ? parseFloat(valorStr) : null;

  if (!descripcion) {
    return { error: "La descripción es obligatoria." };
  }

  if (tipo !== "NOTA" && (!valor || valor <= 0)) {
    return { error: "El valor es obligatorio y debe ser mayor a 0." };
  }

  const { error } = await supabase
    .from("pendientes")
    .update({
      descripcion,
      valor: tipo === "NOTA" ? null : valor,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pendientes");
  return { ok: true };
}
