import { z } from "zod";

const optionalField = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    if (value == null) {
      return undefined;
    }

    return value;
  }, schema.optional());

export const debtSchema = z.object({
  amountUsd: z.coerce.number().positive("El monto debe ser mayor a cero."),
  creditor: z
    .string()
    .trim()
    .min(2, "Indica el acreedor.")
    .max(160, "El acreedor no puede exceder 160 caracteres."),
  dailyRecordId: optionalField(z.string().uuid("Selecciona un registro valido.")),
  description: z
    .string()
    .trim()
    .min(4, "Describe la deuda.")
    .max(500, "La descripcion no puede exceder 500 caracteres."),
  dueDate: optionalField(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD."),
  ),
});

export const debtPaymentSchema = z.object({
  amountUsd: z.coerce.number().positive("El abono debe ser mayor a cero."),
  debtId: z.string().uuid("La deuda seleccionada no es valida."),
  notes: optionalField(
    z
      .string()
      .trim()
      .max(500, "Las notas no pueden exceder 500 caracteres."),
  ),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD."),
});

export type DebtInput = z.infer<typeof debtSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
