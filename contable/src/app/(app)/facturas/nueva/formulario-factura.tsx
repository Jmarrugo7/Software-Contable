"use client";

import { useActionState, useState, useRef, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/ui/campo";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { crearFactura, editarFactura } from "../acciones";

type FormularioProps = {
  gastos: { id: number; nombre: string }[];
  fuentes: { id: number; nombre: string }[];
  metodos: { id: number; nombre: string; requiere_comprobante: boolean }[];
  facturaId?: string;
  initialData?: any;
};

type Errores = Record<string, string>;

/** Mensajes personalizados por campo. */
const MENSAJES: Record<string, string> = {
  gasto_compra_id: "Selecciona una categoría de gasto o compra.",
  proveedor: "Ingresa el nombre del proveedor.",
  cantidad: "La cantidad debe ser al menos 1.",
  precio_unitario: "Ingresa el precio unitario.",
  observaciones: "Agrega una observación o detalle.",
  fuente_recursos_id: "Selecciona la fuente de recursos.",
  metodo_pago_id: "Selecciona el método de pago.",
  numero_comprobante: "Ingresa el número de comprobante.",
};

export function FormularioFactura({ gastos, fuentes, metodos, facturaId, initialData }: FormularioProps) {
  const actionToUse = facturaId ? editarFactura.bind(null, facturaId) : crearFactura;
  const [estado, accion, enviando] = useActionState(actionToUse, null);
  
  const [cantidad, setCantidad] = useState(initialData?.cantidad ?? 1);
  const [precioUnitario, setPrecioUnitario] = useState(initialData?.precio_unitario ?? 0);
  const [iva, setIva] = useState(initialData?.iva ?? 0);
  const [retefuente, setRetefuente] = useState(initialData?.retefuente ?? 0);
  const [reteica, setReteica] = useState(initialData?.reteica ?? 0);
  const [reteiva, setReteiva] = useState(initialData?.reteiva ?? 0);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<number | "">(initialData?.metodo_pago_id ?? "");
  const [gastoSeleccionado, setGastoSeleccionado] = useState<number | "">(initialData?.gasto_compra_id ?? "");
  const [errores, setErrores] = useState<Errores>({});

  const formRef = useRef<HTMLFormElement>(null);

  const gastoInfo = gastos.find(g => g.id === Number(gastoSeleccionado));
  const esNotaCredito = gastoInfo?.nombre?.toUpperCase() === "NOTA CREDITO";
  const minValor = esNotaCredito ? undefined : "0";

  const subtotal = esNotaCredito ? -(cantidad * Math.abs(precioUnitario)) : (cantidad * precioUnitario);
  const calcIva = esNotaCredito ? -Math.abs(iva) : iva;
  const calcRetefuente = esNotaCredito ? -Math.abs(retefuente) : retefuente;
  const calcReteica = esNotaCredito ? -Math.abs(reteica) : reteica;
  const calcReteiva = esNotaCredito ? -Math.abs(reteiva) : reteiva;
  const total = subtotal + calcIva - calcRetefuente - calcReteica - calcReteiva;
  
  const metodoInfo = metodos.find(m => m.id === Number(metodoSeleccionado));
  const requiereComprobante = metodoInfo?.requiere_comprobante ?? false;

  /** Limpia el error de un campo al interactuar con él. */
  const limpiarError = (campo: string) => {
    setErrores(prev => {
      if (!prev[campo]) return prev;
      const { [campo]: _, ...resto } = prev;
      return resto;
    });
  };

  /** Valida el formulario antes de enviarlo. Devuelve `true` si es válido. */
  const validar = (): boolean => {
    const nuevosErrores: Errores = {};

    if (!gastoSeleccionado) nuevosErrores.gasto_compra_id = MENSAJES.gasto_compra_id;

    const form = formRef.current;
    if (!form) return false;

    const fecha = (form.elements.namedItem("fecha") as HTMLInputElement)?.value;
    if (!fecha) nuevosErrores.fecha = "Selecciona la fecha de la factura.";

    const proveedor = (form.elements.namedItem("proveedor") as HTMLInputElement)?.value?.trim();
    if (!proveedor) nuevosErrores.proveedor = MENSAJES.proveedor;

    if (!cantidad || cantidad < 1) nuevosErrores.cantidad = MENSAJES.cantidad;

    if (!esNotaCredito && (!precioUnitario || precioUnitario <= 0)) {
      nuevosErrores.precio_unitario = "El precio unitario debe ser mayor a $0.";
    }
    if (esNotaCredito && precioUnitario === undefined) {
      nuevosErrores.precio_unitario = MENSAJES.precio_unitario;
    }

    const observaciones = (form.elements.namedItem("observaciones") as HTMLTextAreaElement)?.value?.trim();
    if (!observaciones) nuevosErrores.observaciones = MENSAJES.observaciones;

    const fuenteVal = (form.elements.namedItem("fuente_recursos_id") as HTMLSelectElement)?.value;
    if (!fuenteVal) nuevosErrores.fuente_recursos_id = MENSAJES.fuente_recursos_id;

    if (!metodoSeleccionado) nuevosErrores.metodo_pago_id = MENSAJES.metodo_pago_id;

    if (requiereComprobante) {
      const comprobante = (form.elements.namedItem("numero_comprobante") as HTMLInputElement)?.value?.trim();
      if (!comprobante) nuevosErrores.numero_comprobante = MENSAJES.numero_comprobante;
    }

    if (!esNotaCredito) {
      if (iva < 0) nuevosErrores.iva = "El IVA no puede ser negativo.";
      if (retefuente < 0) nuevosErrores.retefuente = "La Retefuente no puede ser negativa.";
      if (reteica < 0) nuevosErrores.reteica = "La ReteICA no puede ser negativa.";
      if (reteiva < 0) nuevosErrores.reteiva = "La ReteIVA no puede ser negativa.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      // Hacer scroll al primer campo con error
      const primerCampoId = Object.keys(nuevosErrores)[0];
      const elemento = document.getElementById(primerCampoId);
      elemento?.focus();
      elemento?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!validar()) {
      e.preventDefault();
      return;
    }
    // Si pasa la validación, deja que el formulario invoque la server action normalmente.
  };

  return (
    <form ref={formRef} action={accion} onSubmit={handleSubmit} noValidate className="space-y-6">
      {estado?.error ? (
        <div role="alert" className="flex gap-2 rounded-lg border border-rojo/30 bg-rojo-suave p-3 text-sm text-rojo">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{estado.error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Campo id="fecha" etiqueta="Fecha de la factura" error={errores.fecha}>
          <Input 
            id="fecha" 
            name="fecha" 
            type="date" 
            defaultValue={initialData?.fecha_registro ? initialData.fecha_registro.split("T")[0] : new Date().toLocaleDateString('en-CA')} 
            aria-invalid={!!errores.fecha}
            onChange={() => limpiarError("fecha")}
            max={new Date().toLocaleDateString('en-CA')}
          />
        </Campo>

        <Campo id="gasto_compra_id" etiqueta="Categoría de Gasto/Compra" error={errores.gasto_compra_id}>
          <Select 
            id="gasto_compra_id" 
            name="gasto_compra_id" 
            value={gastoSeleccionado}
            aria-invalid={!!errores.gasto_compra_id}
            onChange={(e) => {
              setGastoSeleccionado(Number(e.target.value));
              limpiarError("gasto_compra_id");
            }}
          >
            <option value="" disabled>Seleccione una categoría...</option>
            {gastos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </Select>
        </Campo>

        <Campo id="proveedor" etiqueta="Proveedor" error={errores.proveedor}>
          <Input 
            id="proveedor" 
            name="proveedor" 
            type="text" 
            defaultValue={initialData?.proveedor ?? ""} 
            placeholder="Nombre del proveedor"
            aria-invalid={!!errores.proveedor}
            onChange={() => limpiarError("proveedor")}
          />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Campo id="numero_factura" etiqueta="Número de factura (Opcional)">
          <Input id="numero_factura" name="numero_factura" type="text" defaultValue={initialData?.numero_factura ?? ""} placeholder="Ej: FV-1234" />
        </Campo>

        <Campo id="cantidad" etiqueta="Cantidad" error={errores.cantidad}>
          <Input 
            id="cantidad" 
            name="cantidad" 
            type="number" 
            min="1" 
            step="1"
            value={cantidad}
            aria-invalid={!!errores.cantidad}
            onChange={(e) => {
              setCantidad(Number(e.target.value) || 0);
              limpiarError("cantidad");
            }}
          />
        </Campo>

        <Campo id="precio_unitario" etiqueta="Precio unitario" error={errores.precio_unitario}>
          <Input 
            id="precio_unitario" 
            name="precio_unitario" 
            type="number" 
            min={minValor} 
            step="0.01"
            value={precioUnitario || ""}
            aria-invalid={!!errores.precio_unitario}
            onChange={(e) => {
              setPrecioUnitario(Number(e.target.value) || 0);
              limpiarError("precio_unitario");
            }}
          />
        </Campo>
      </div>

      <div className="rounded-lg bg-gris-50 p-4 border border-borde grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Campo id="iva" etiqueta="IVA (+)" error={errores.iva}>
          <Input id="iva" name="iva" type="number" min={minValor} step="0.01" value={iva || ""} aria-invalid={!!errores.iva} onChange={e => { setIva(Number(e.target.value) || 0); limpiarError("iva"); }} />
        </Campo>
        <Campo id="retefuente" etiqueta="Retefuente (-)" error={errores.retefuente}>
          <Input id="retefuente" name="retefuente" type="number" min={minValor} step="0.01" value={retefuente || ""} aria-invalid={!!errores.retefuente} onChange={e => { setRetefuente(Number(e.target.value) || 0); limpiarError("retefuente"); }} />
        </Campo>
        <Campo id="reteica" etiqueta="ReteICA (-)" error={errores.reteica}>
          <Input id="reteica" name="reteica" type="number" min={minValor} step="0.01" value={reteica || ""} aria-invalid={!!errores.reteica} onChange={e => { setReteica(Number(e.target.value) || 0); limpiarError("reteica"); }} />
        </Campo>
        <Campo id="reteiva" etiqueta="ReteIVA (-)" error={errores.reteiva}>
          <Input id="reteiva" name="reteiva" type="number" min={minValor} step="0.01" value={reteiva || ""} aria-invalid={!!errores.reteiva} onChange={e => { setReteiva(Number(e.target.value) || 0); limpiarError("reteiva"); }} />
        </Campo>
      </div>

      <div className="flex justify-end bg-primario-suave p-4 rounded-lg border border-primario/20">
        <div className="text-right">
          <p className="text-sm text-texto-suave">Subtotal: <span className="font-medium cifras">{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(subtotal)}</span></p>
          <p className="text-2xl font-bold text-primario cifras mt-1">
            Total: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total)}
          </p>
        </div>
      </div>

      <Campo id="observaciones" etiqueta="Observaciones" error={errores.observaciones}>
        <textarea 
          id="observaciones" 
          name="observaciones" 
          rows={3}
          defaultValue={initialData?.observaciones ?? ""}
          className="w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-base text-texto focus:border-primario focus:ring-2 focus:ring-primario/20 transition-all duration-200 aria-[invalid=true]:border-rojo aria-[invalid=true]:ring-rojo/20"
          placeholder="Detalles de la factura o gasto"
          aria-invalid={!!errores.observaciones}
          onChange={() => limpiarError("observaciones")}
        ></textarea>
      </Campo>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Campo id="fuente_recursos_id" etiqueta="Fuente de recursos" error={errores.fuente_recursos_id}>
          <Select 
            id="fuente_recursos_id" 
            name="fuente_recursos_id" 
            defaultValue={initialData?.fuente_recursos_id ?? ""}
            aria-invalid={!!errores.fuente_recursos_id}
            onChange={() => limpiarError("fuente_recursos_id")}
          >
            <option value="" disabled>Seleccione...</option>
            {fuentes.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </Select>
        </Campo>

        <Campo id="metodo_pago_id" etiqueta="Método de pago" error={errores.metodo_pago_id}>
          <Select 
            id="metodo_pago_id" 
            name="metodo_pago_id" 
            value={metodoSeleccionado}
            aria-invalid={!!errores.metodo_pago_id}
            onChange={(e) => {
              setMetodoSeleccionado(Number(e.target.value));
              limpiarError("metodo_pago_id");
            }}
          >
            <option value="" disabled>Seleccione...</option>
            {metodos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
        </Campo>

        {requiereComprobante && (
          <Campo id="numero_comprobante" etiqueta="Nº Comprobante" error={errores.numero_comprobante}>
            <Input 
              id="numero_comprobante" 
              name="numero_comprobante" 
              type="text" 
              defaultValue={initialData?.numero_comprobante ?? ""} 
              placeholder="Número de transferencia"
              aria-invalid={!!errores.numero_comprobante}
              onChange={() => limpiarError("numero_comprobante")}
            />
          </Campo>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-borde">
        <Button type="button" variante="fantasma" onClick={() => window.history.back()}>Cancelar</Button>
        <Button type="submit" disabled={enviando}>{enviando ? "Guardando..." : (facturaId ? "Guardar cambios" : "Guardar factura")}</Button>
      </div>
    </form>
  );
}
