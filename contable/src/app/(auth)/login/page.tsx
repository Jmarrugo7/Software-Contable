import type { Metadata } from "next";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Ingresar" };

export default function PaginaLogin() {
  return (
    <main className="login-fondo flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="login-tarjeta">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-texto">
            Contable
          </h1>
          <p className="mt-2 text-texto-suave">
            Usa el correo y la contraseña de tu cuenta.
          </p>
        </div>
        <FormularioLogin />
      </div>
    </main>
  );
}
