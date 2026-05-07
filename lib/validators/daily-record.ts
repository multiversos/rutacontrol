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

const optionalMoney = optionalField(
  z.coerce.number().finite().nonnegative("El monto no puede ser negativo."),
);

export const dailyRecordSchema = z.object({
  busId: z.string().uuid("Selecciona un bus valido."),
  userId: z.string().uuid("El usuario registrador es obligatorio."),
  recordDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD."),
  departureTime: optionalField(
    z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "La hora debe estar en formato HH:MM."),
  ),
  incomeUsd: optionalMoney,
  fuelCost: optionalMoney,
  workerPayment: optionalMoney,
  otherExpenses: optionalMoney,
  notes: z.string().trim().max(1000).optional(),
});

export type DailyRecordInput = z.infer<typeof dailyRecordSchema>;
