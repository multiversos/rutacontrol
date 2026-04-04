import { z } from "zod";

export const busSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "El codigo interno es obligatorio.")
    .max(20, "El codigo no puede superar 20 caracteres."),
  plate: z
    .string()
    .trim()
    .min(5, "La placa es obligatoria.")
    .max(20, "La placa no puede superar 20 caracteres."),
  status: z.enum(["active", "maintenance", "inactive"]),
});

export type BusInput = z.infer<typeof busSchema>;
