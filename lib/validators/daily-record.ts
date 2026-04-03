import { z } from "zod";

const money = z.coerce.number().finite().nonnegative();

export const dailyRecordSchema = z.object({
  busId: z.string().uuid("Selecciona un bus valido."),
  userId: z.string().uuid("El usuario registrador es obligatorio."),
  recordDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD."),
  departureTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "La hora debe estar en formato HH:MM."),
  incomeBs: money,
  exchangeRate: z.coerce.number().positive("La tasa debe ser mayor a cero."),
  fuelCost: money,
  workerPayment: money,
  otherExpenses: money.default(0),
  netProfitUsd: z.coerce.number().finite(),
  notes: z.string().trim().max(1000).optional(),
});

export type DailyRecordInput = z.infer<typeof dailyRecordSchema>;
