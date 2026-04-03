import type { Enums, Tables } from "@/lib/supabase/database.types";

export type AppRole = Enums<"app_role">;
export type BusStatus = Enums<"bus_status">;
export type DailyRecordStatus = Enums<"daily_record_status">;
export type ExpenseCategory = Enums<"expense_category">;
export type Profile = Tables<"profiles">;

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  registrador: "Registrador",
};
