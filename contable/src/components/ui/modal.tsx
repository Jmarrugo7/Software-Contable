"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-negro/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Contenido del Modal */}
      <div className="relative z-50 w-full max-w-md scale-100 rounded-xl bg-superficie p-6 opacity-100 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-texto">{title}</h2>
          <Button 
            variante="fantasma" 
            tamano="pequeno" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
