"use client";

import { useState, useTransition } from "react";
import { Check, Trash2, AlertCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatearMoneda } from "@/lib/formato";
import { marcarCumplido, eliminarPendiente, editarPendiente } from "./acciones";

type TipoPendiente = "CUENTA_POR_PAGAR" | "CUENTA_POR_COBRAR" | "NOTA";

interface Props {
  id: string;
  tipo: TipoPendiente;
  descripcion: string;
  valor: number | null;
  cumplido: boolean;
  createdAt: string;
  esEditor: boolean;
}

const ETIQUETA_TIPO: Record<TipoPendiente, string> = {
  CUENTA_POR_PAGAR: "Cuenta por pagar",
  CUENTA_POR_COBRAR: "Cuenta por cobrar",
  NOTA: "Nota",
};

const COLOR_TIPO: Record<TipoPendiente, string> = {
  CUENTA_POR_PAGAR: "bg-rojo/10 text-rojo",
  CUENTA_POR_COBRAR: "bg-primario/10 text-primario",
  NOTA: "bg-gris-200 text-gris-700",
};

export function TarjetaPendiente({
  id,
  tipo,
  descripcion,
  valor,
  cumplido,
  createdAt,
  esEditor,
}: Props) {
  const [modalCumplir, setModalCumplir] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [editDescripcion, setEditDescripcion] = useState(descripcion);
  const [editValor, setEditValor] = useState(valor !== null ? String(valor) : "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const esNota = tipo === "NOTA";

  function handleCumplir() {
    setError(null);
    startTransition(async () => {
      const result = await marcarCumplido(id);
      if (result.error) {
        setError(result.error);
      } else {
        setModalCumplir(false);
      }
    });
  }

  function handleEliminar() {
    setError(null);
    startTransition(async () => {
      const result = await eliminarPendiente(id);
      if (result.error) {
        setError(result.error);
      } else {
        setModalEliminar(false);
      }
    });
  }

  function handleEditar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("tipo", tipo);
    formData.set("descripcion", editDescripcion);
    if (!esNota) {
      formData.set("valor", editValor);
    }

    startTransition(async () => {
      const result = await editarPendiente(id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setModalEditar(false);
      }
    });
  }

  function abrirModalEditar() {
    setEditDescripcion(descripcion);
    setEditValor(valor !== null ? String(valor) : "");
    setError(null);
    setModalEditar(true);
  }

  return (
    <>
      <div
        className={`group rounded-xl border bg-superficie p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
          cumplido ? "opacity-60 border-gris-200" : "border-borde"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badge de tipo */}
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_TIPO[tipo]}`}
            >
              {ETIQUETA_TIPO[tipo]}
            </span>

            {/* Descripción */}
            <p className={`mt-2 text-sm leading-relaxed ${cumplido ? "line-through text-texto-suave" : "text-texto"}`}>
              {descripcion}
            </p>

            {/* Valor */}
            {valor !== null && (
              <p className="mt-1 text-lg font-bold text-texto tabular-nums">
                {formatearMoneda(valor)}
              </p>
            )}

            {/* Fecha de creación */}
            <p className="mt-2 text-xs text-texto-suave">
              Creado: {new Date(createdAt).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Acciones */}
          {!cumplido && esEditor && (
            <div className="flex shrink-0 gap-1">
              <Button
                variante="fantasma"
                tamano="pequeno"
                onClick={() => setModalCumplir(true)}
                title="Marcar como cumplido"
                className="h-8 w-8 p-0 text-primario hover:bg-primario/10"
              >
                <Check className="size-4" />
              </Button>
              <Button
                variante="fantasma"
                tamano="pequeno"
                onClick={abrirModalEditar}
                title="Editar"
                className="h-8 w-8 p-0 text-texto-suave hover:text-texto hover:bg-gris-100"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variante="fantasma"
                tamano="pequeno"
                onClick={() => setModalEliminar(true)}
                title="Eliminar"
                className="h-8 w-8 p-0 text-rojo hover:bg-rojo/10"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}

          {cumplido && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              <Check className="size-3" />
              Cumplido
            </span>
          )}
        </div>
      </div>

      {/* Modales de edición, cumplimiento y eliminación (solo para editores) */}
      {esEditor && (
        <>
          {/* Modal editar pendiente */}
          <Modal
            isOpen={modalEditar}
            onClose={() => setModalEditar(false)}
            title={`Editar ${ETIQUETA_TIPO[tipo].toLowerCase()}`}
          >
        <form onSubmit={handleEditar} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={`edit-desc-${id}`} className="block text-sm font-semibold text-texto">
              Descripción
            </label>
            <Input
              id={`edit-desc-${id}`}
              name="descripcion"
              required
              value={editDescripcion}
              onChange={(e) => setEditDescripcion(e.target.value)}
              placeholder="Describe el aspecto pendiente…"
              autoFocus
            />
          </div>

          {!esNota && (
            <div className="space-y-1.5">
              <label htmlFor={`edit-valor-${id}`} className="block text-sm font-semibold text-texto">
                Valor (COP)
              </label>
              <Input
                id={`edit-valor-${id}`}
                name="valor"
                type="number"
                min="1"
                step="0.01"
                required
                value={editValor}
                onChange={(e) => setEditValor(e.target.value)}
                placeholder="$ 0"
              />
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1.5 rounded-lg bg-rojo-suave px-3 py-2 text-sm font-medium text-rojo">
              <AlertCircle className="size-4" /> {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variante="secundario"
              tamano="pequeno"
              onClick={() => setModalEditar(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" tamano="pequeno" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmar cumplimiento */}
      <Modal
        isOpen={modalCumplir}
        onClose={() => setModalCumplir(false)}
        title="¿Marcar como cumplido?"
      >
        <p className="text-sm text-texto-suave mb-4">
          Se registrará en <strong>Actividades realizadas</strong> con la fecha de hoy. Esta acción no se puede deshacer.
        </p>
        {error && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-rojo-suave px-3 py-2 text-sm font-medium text-rojo">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variante="secundario" tamano="pequeno" onClick={() => setModalCumplir(false)}>
            Cancelar
          </Button>
          <Button tamano="pequeno" onClick={handleCumplir} disabled={isPending}>
            {isPending ? "Guardando…" : "Sí, cumplido"}
          </Button>
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="¿Eliminar pendiente?"
      >
        <p className="text-sm text-texto-suave mb-4">
          Se eliminará permanentemente este pendiente. Esta acción no se puede deshacer.
        </p>
        {error && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-rojo-suave px-3 py-2 text-sm font-medium text-rojo">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variante="secundario" tamano="pequeno" onClick={() => setModalEliminar(false)}>
            Cancelar
          </Button>
          <Button
            tamano="pequeno"
            onClick={handleEliminar}
            disabled={isPending}
            className="bg-rojo text-blanco hover:bg-rojo/90 shadow-rojo/25"
          >
            {isPending ? "Eliminando…" : "Sí, eliminar"}
          </Button>
        </div>
          </Modal>
        </>
      )}
    </>
  );
}
