import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Escribe un correo válido, por ejemplo nombre@empresa.com."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export type LoginInput = z.infer<typeof loginSchema>;
