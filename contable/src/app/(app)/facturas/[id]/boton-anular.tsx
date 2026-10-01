"use client";

import { useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { anularFactura } from "../acciones";

export function BotonAnular({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleAnular = () => {
    startTransition(() => {
      anularFactura(id, motivo);
      setIsModalOpen(false);
    });
  };

  return (
    <>
      <Button 
        variante="secundario" 
        onClick={() => setIsModalOpen(true)} 
        disabled={isPending}
        className="text-rojo border-rojo/20 hover:bg-rojo-suave"
      >
        <XCircle className="size-4 mr-2" />
        {isPending ? "Anulando..." : "Anular"}
      </Button>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isPending && setIsModalOpen(false)}
        title="Anular Factura"
      >
        <p className="text-sm text-texto-suave mb-4">
          ¿Estás seguro de que deseas anular esta factura? Puedes ingresar un motivo opcional.
        </p>
        
        <Input 
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de anulación (Opcional)"
          className="mb-6"
          disabled={isPending}
        />
        
        <div className="flex justify-end gap-3">
          <Button 
            variante="fantasma" 
            onClick={() => setIsModalOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAnular}
            disabled={isPending}
            className="bg-rojo hover:bg-rojo/90 text-white shadow-rojo/25"
          >
            {isPending ? "Anulando..." : "Confirmar anulación"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
