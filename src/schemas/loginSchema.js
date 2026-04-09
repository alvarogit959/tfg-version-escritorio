import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Introduzca su nombre!"),

  password: z
    .string()
    .min(1, "Introduzca su contraseña!"),
});
