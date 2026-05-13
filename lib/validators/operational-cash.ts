import { z } from "zod";

export const operationalCashAdjustmentSchema = z.object({
  amountUsd: z.coerce
    .number()
    .finite("El monto debe ser un numero valido.")
    .positive("El monto debe ser mayor a cero."),
  description: z
    .string()
    .trim()
    .min(3, "Indica el motivo del ajuste.")
    .max(500, "El motivo no puede exceder 500 caracteres."),
  direction: z.enum(["in", "out"], {
    message: "Selecciona si el ajuste es entrada o salida.",
  }),
  movementDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD."),
});

export type OperationalCashAdjustmentInput = z.infer<
  typeof operationalCashAdjustmentSchema
>;
