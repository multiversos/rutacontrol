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

const maintenanceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD.");

const positiveIntegerField = optionalField(
  z.coerce
    .number()
    .int("El valor debe ser un numero entero.")
    .positive("El valor debe ser mayor a cero."),
);

export const maintenanceSchema = z
  .object({
    busId: z.string().uuid("Selecciona un bus valido."),
    debtAmountUsd: optionalField(
      z.coerce.number().positive("La deuda asociada debe ser mayor a cero."),
    ),
    debtCreditor: optionalField(
      z
        .string()
        .trim()
        .min(2, "Indica el acreedor o taller.")
        .max(160, "El acreedor no puede exceder 160 caracteres."),
    ),
    debtDueDate: optionalField(maintenanceDateSchema),
    description: z
      .string()
      .trim()
      .min(4, "Describe el mantenimiento.")
      .max(1000, "La descripcion no puede exceder 1000 caracteres."),
    expectedWorkDays: positiveIntegerField,
    maintenanceType: z.enum([
      "brake_pads",
      "filters",
      "general_service",
      "oil_change",
      "other",
      "spare_parts",
    ]),
    notes: optionalField(
      z
        .string()
        .trim()
        .max(600, "Las observaciones no pueden exceder 600 caracteres."),
    ),
    provider: z
      .string()
      .trim()
      .min(2, "Indica el proveedor o taller.")
      .max(160, "El proveedor no puede exceder 160 caracteres."),
    serviceDate: maintenanceDateSchema,
    totalCostUsd: z.coerce.number().positive("El costo total debe ser mayor a cero."),
  })
  .superRefine((value, ctx) => {
    if (value.debtAmountUsd && !value.debtCreditor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indica el acreedor para asociar la deuda del mantenimiento.",
        path: ["debtCreditor"],
      });
    }

    if (!value.debtAmountUsd && value.debtCreditor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agrega un monto pendiente o deja el acreedor en blanco.",
        path: ["debtAmountUsd"],
      });
    }

    if (
      value.debtAmountUsd &&
      value.totalCostUsd &&
      value.debtAmountUsd > value.totalCostUsd
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La deuda no puede exceder el costo total del mantenimiento.",
        path: ["debtAmountUsd"],
      });
    }
  });

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
