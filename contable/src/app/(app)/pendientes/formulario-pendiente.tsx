"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { crearPendiente, type TipoPendiente } from "./acciones";

const TIPOS: { valor: TipoPendiente; etiqueta: string }[] = [
  { valor: "CUENTA_POR_PAGAR", etiqueta: "Cuenta por pagar" },
  { valor: "CUENTA_POR_COBRAR", etiqueta: "Cuenta por cobrar" },
  { valor: "NOTA", etiqueta: "Nota" },
];

export function FormularioPendiente({ tipoInicial }: { tipoInicial: TipoPendiente }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoPendiente>(tipoInicial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const esNota = tipo === "NOTA";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("tipo", tipo);

    startTransition(async () => {
      const result = await crearPendiente(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setAbierto(false);
        setError(null);
      }
    });
  }

  return (
    <>
      <Button onClick={() => { setAbierto(true); setTipo(tipoInicial); setError(null); }}>
        <Plus className="size-4" />
        Agregar
      </Button>

      <Modal
        isOpen={abierto}
        onClose={() => setAbierto(false)}
        title="Nuevo pendiente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de tipo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-texto">Tipo</label>
            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => setTipo(t.valor)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    tipo === t.valor
                      ? "bg-primario text-blanco shadow-md"
                      : "border border-borde bg-superficie text-texto-suave hover:bg-gris-50"
                  }`}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label htmlFor="desc-pendiente" className="block text-sm font-semibold text-texto">
              Descripción
            </label>
            <Input
              id="desc-pendiente"
              name="descripcion"
              required
              placeholder="Describe el pendiente…"
              autoFocus
            />
          </div>

          {/* Valor (solo para cuentas) */}
          {!esNota && (
            <div className="space-y-1.5">
              <label htmlFor="valor-pendiente" className="block text-sm font-semibold text-texto">
                Valor (COP)
              </label>
              <Input
                id="valor-pendiente"
                name="valor"
                type="number"
                min="1"
                step="0.01"
                required
                placeholder="$ 0"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-rojo-suave px-3 py-2 text-sm font-medium text-rojo">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variante="secundario"
              tamano="pequeno"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" tamano="pequeno" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
