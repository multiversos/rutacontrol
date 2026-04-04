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

const repairDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD.");

export const repairSchema = z
  .object({
    bucketName: z.string().trim().min(1, "El bucket del comprobante es obligatorio."),
    busId: z.string().uuid("Selecciona un bus valido."),
    category: z.enum([
      "bodywork",
      "electrical",
      "inspection",
      "mechanical",
      "oil_change",
      "other",
      "tires",
    ]),
    contentType: z
      .string()
      .trim()
      .min(1, "El tipo de archivo del comprobante es obligatorio."),
    costUsd: z.coerce.number().positive("El costo debe ser mayor a cero."),
    description: z
      .string()
      .trim()
      .min(4, "Describe la reparacion.")
      .max(1000, "La descripcion no puede exceder 1000 caracteres."),
    fileSizeBytes: z.coerce
      .number()
      .int()
      .positive("El comprobante debe tener tamano valido."),
    nextServiceDueDate: optionalField(repairDateSchema),
    nextServiceNotes: optionalField(
      z
        .string()
        .trim()
        .max(500, "Las notas del proximo servicio no pueden exceder 500 caracteres."),
    ),
    objectPath: z
      .string()
      .trim()
      .min(1, "La ruta del comprobante es obligatoria."),
    originalName: z
      .string()
      .trim()
      .min(1, "El nombre original del comprobante es obligatorio."),
    provider: z
      .string()
      .trim()
      .min(2, "Indica el proveedor o taller.")
      .max(160, "El proveedor no puede exceder 160 caracteres."),
    repairDate: repairDateSchema,
  })
  .superRefine((value, ctx) => {
    if (
      value.nextServiceDueDate &&
      value.nextServiceDueDate < value.repairDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La fecha sugerida del proximo servicio no puede ser anterior a la reparacion.",
        path: ["nextServiceDueDate"],
      });
    }
  });

export type RepairInput = z.infer<typeof repairSchema>;
