"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Campo } from "@/components/ui/campo";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FiltrosProps {
  categorias: { id: number; nombre: string }[];
  fuentes: { id: number; nombre: string }[];
  metodos: { id: number; nombre: string }[];
  valoresActuales: {
    desde: string;
    hasta: string;
    categoria: string;
    fuente: string;
    metodo: string;
    agrupacion: string;
  };
}

export function FiltrosGastos({ categorias, fuentes, metodos, valoresActuales }: FiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    
    const desde = formData.get("desde") as string;
    const hasta = formData.get("hasta") as string;
    const categoria = formData.get("categoria") as string;
    const fuente = formData.get("fuente") as string;
    const metodo = formData.get("metodo") as string;
    const agrupacion = formData.get("agrupacion") as string;

    if (desde) params.set("desde", desde);
    else params.delete("desde");

    if (hasta) params.set("hasta", hasta);
    else params.delete("hasta");

    if (categoria) params.set("categoria", categoria);
    else params.delete("categoria");

    if (fuente) params.set("fuente", fuente);
    else params.delete("fuente");

    if (metodo) params.set("metodo", metodo);
    else params.delete("metodo");

    if (agrupacion) params.set("agrupacion", agrupacion);
    else params.delete("agrupacion");

    router.push(`/gastos?${params.toString()}`);
  };

  const handleClear = () => {
    router.push("/gastos");
  };

  const hayFiltrosActivos = valoresActuales.desde || valoresActuales.hasta || valoresActuales.categoria || valoresActuales.fuente || valoresActuales.metodo || valoresActuales.agrupacion !== "month";

  return (
    <form onSubmit={handleApply} className="bg-superficie border border-borde rounded-xl p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <Campo id="desde" etiqueta="Desde">
          <Input id="desde" name="desde" type="date" defaultValue={valoresActuales.desde} />
        </Campo>
        
        <Campo id="hasta" etiqueta="Hasta">
          <Input id="hasta" name="hasta" type="date" defaultValue={valoresActuales.hasta} />
        </Campo>

        <Campo id="categoria" etiqueta="Gasto/Compra">
          <Select id="categoria" name="categoria" defaultValue={valoresActuales.categoria}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </Campo>

        <Campo id="fuente" etiqueta="Fuente de recursos">
          <Select id="fuente" name="fuente" defaultValue={valoresActuales.fuente}>
            <option value="">Todas las fuentes</option>
            {fuentes.map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </Select>
        </Campo>

        <Campo id="metodo" etiqueta="Método de pago">
          <Select id="metodo" name="metodo" defaultValue={valoresActuales.metodo}>
            <option value="">Todos los métodos</option>
            {metodos.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </Select>
        </Campo>

        <Campo id="agrupacion" etiqueta="Agrupar por">
          <Select id="agrupacion" name="agrupacion" defaultValue={valoresActuales.agrupacion}>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </Select>
        </Campo>
      </div>
      
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-borde">
        {hayFiltrosActivos && (
          <Button type="button" variante="fantasma" onClick={handleClear}>
            Limpiar filtros
          </Button>
        )}
        <Button type="submit">Aplicar filtros</Button>
      </div>
    </form>
  );
}
