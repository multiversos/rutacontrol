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

export const expenseSchema = z.object({
  amountBs: optionalField(
    z.coerce.number().finite().nonnegative("El monto en Bs no puede ser negativo."),
  ),
  amountUsd: z.coerce.number().finite().positive("El monto en USD debe ser mayor a cero."),
  category: z.enum(["fuel", "worker_payment", "other"], {
    error: "Selecciona una categoria valida.",
  }),
  dailyRecordId: z.string().uuid("Selecciona un registro diario valido."),
  description: optionalField(
    z
      .string()
      .trim()
      .max(255, "La descripcion no puede exceder 255 caracteres."),
  ),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
