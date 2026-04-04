import type { Enums } from "@/lib/supabase/database.types";

export const MAINTENANCE_TYPE_LABELS: Record<
  Enums<"maintenance_type">,
  string
> = {
  brake_pads: "Bandas de freno",
  filters: "Filtros",
  general_service: "Servicio general",
  oil_change: "Cambio de aceite",
  other: "Otro",
  spare_parts: "Repuestos",
};

export const MAINTENANCE_POSITION_LABELS: Record<
  Enums<"maintenance_component_position">,
  string
> = {
  front_left: "Delantera izquierda",
  front_right: "Delantera derecha",
  rear_left: "Trasera izquierda",
  rear_right: "Trasera derecha",
};

export const MAINTENANCE_STATUS_LABELS: Record<
  Enums<"maintenance_status">,
  string
> = {
  due_soon: "Proximo a vencer",
  overdue: "Vencido",
  up_to_date: "Al dia",
};
