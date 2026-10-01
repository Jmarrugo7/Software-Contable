"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { reactivarFactura } from "../acciones";

export function BotonReactivar({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReactivar = () => {
    startTransition(() => {
      reactivarFactura(id);
      setIsModalOpen(false);
    });
  };

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)} 
        disabled={isPending}
        className="bg-primario text-white"
      >
        <RefreshCw className="size-4 mr-2" />
        {isPending ? "Reactivando..." : "Reactivar"}
      </Button>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isPending && setIsModalOpen(false)}
        title="Reactivar Factura"
      >
        <p className="text-sm text-texto-suave mb-6">
          ¿Estás seguro de que deseas reactivar esta factura? Volverá a estar activa y sus valores serán sumados en el control de gastos.
        </p>
        
        <div className="flex justify-end gap-3">
          <Button 
            variante="fantasma" 
            onClick={() => setIsModalOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleReactivar}
            disabled={isPending}
          >
            {isPending ? "Reactivando..." : "Confirmar reactivación"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
