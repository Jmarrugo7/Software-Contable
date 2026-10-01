"use client";

import { useActionState, useState, useRef, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/ui/campo";
import { Input } from "@/components/ui/input";
import { iniciarSesion, type EstadoLogin } from "./actions";

const estadoInicial: EstadoLogin = {};

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, estadoInicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const limpiarError = (campo: string) => {
    setErrores(prev => {
      if (!prev[campo]) return prev;
      const { [campo]: _, ...resto } = prev;
      return resto;
    });
  };

  const validar = () => {
    const nuevosErrores: Record<string, string> = {};
    const form = formRef.current;
    if (!form) return false;

    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim();
    if (!email) {
      nuevosErrores.email = "El correo electrónico es requerido.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevosErrores.email = "Ingresa un correo electrónico válido.";
    }

    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    if (!password) {
      nuevosErrores.password = "La contraseña es requerida.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      const primerCampoId = Object.keys(nuevosErrores)[0];
      const elemento = document.getElementById(primerCampoId);
      elemento?.focus();
      return false;
    }

    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!validar()) {
      e.preventDefault();
      return;
    }
  };

  const errorEmail = errores.email || estado.errores?.email;
  const errorPassword = errores.password || estado.errores?.password;

  return (
    <form ref={formRef} action={accion} onSubmit={handleSubmit} noValidate className="space-y-5">
      {estado.error ? (
        <div
          role="alert"
          className="flex gap-2 rounded-lg border border-rojo/30 bg-rojo-suave p-3 text-sm text-rojo animate-in fade-in slide-in-from-top-2"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{estado.error}</p>
        </div>
      ) : null}

      <Campo id="email" etiqueta="Correo electrónico" error={errorEmail}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={estado.email}
          autoFocus
          aria-invalid={Boolean(errorEmail)}
          aria-describedby={errorEmail ? "email-error" : undefined}
          onChange={() => limpiarError("email")}
        />
      </Campo>

      <Campo id="password" etiqueta="Contraseña" error={errorPassword}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errorPassword)}
          aria-describedby={errorPassword ? "password-error" : undefined}
          onChange={() => limpiarError("password")}
        />
      </Campo>

      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
