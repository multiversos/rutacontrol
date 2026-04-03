import { z } from "zod";

export const routeSchema = z.object({
  name: z.string().trim().min(2, "El nombre de la ruta es obligatorio."),
  origin: z.string().trim().min(2, "El origen es obligatorio."),
  destination: z.string().trim().min(2, "El destino es obligatorio."),
  expectedIncome: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().finite().nonnegative().optional(),
  ),
  active: z.boolean().default(true),
});

export type RouteInput = z.infer<typeof routeSchema>;
