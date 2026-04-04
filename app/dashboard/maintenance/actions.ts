"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { maintenanceSchema } from "@/lib/validators/maintenance";

const BRAKE_PAD_POSITIONS = [
  {
    costField: "frontLeftCostUsd",
    expectedField: "frontLeftExpectedWorkDays",
    label: "Bandas de freno",
    notesField: "frontLeftNotes",
    position: "front_left",
  },
  {
    costField: "frontRightCostUsd",
    expectedField: "frontRightExpectedWorkDays",
    label: "Bandas de freno",
    notesField: "frontRightNotes",
    position: "front_right",
  },
  {
    costField: "rearLeftCostUsd",
    expectedField: "rearLeftExpectedWorkDays",
    label: "Bandas de freno",
    notesField: "rearLeftNotes",
    position: "rear_left",
  },
  {
    costField: "rearRightCostUsd",
    expectedField: "rearRightExpectedWorkDays",
    label: "Bandas de freno",
    notesField: "rearRightNotes",
    position: "rear_right",
  },
] as const;

function normalizeMaintenanceFormData(formData: FormData) {
  return {
    busId: formData.get("busId"),
    debtAmountUsd: formData.get("debtAmountUsd"),
    debtCreditor: formData.get("debtCreditor"),
    debtDueDate: formData.get("debtDueDate"),
    description: formData.get("description"),
    expectedWorkDays: formData.get("expectedWorkDays"),
    maintenanceType: formData.get("maintenanceType"),
    notes: formData.get("notes"),
    provider: formData.get("provider"),
    serviceDate: formData.get("serviceDate"),
    totalCostUsd: formData.get("totalCostUsd"),
  };
}

function buildBrakePadItems(formData: FormData) {
  return BRAKE_PAD_POSITIONS.map((position) => ({
    componentName: position.label,
    componentPosition: position.position,
    costUsd: String(formData.get(position.costField) ?? "").trim(),
    expectedWorkDays: String(formData.get(position.expectedField) ?? "").trim(),
    notes: String(formData.get(position.notesField) ?? "").trim(),
  }));
}

export async function saveMaintenanceAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  await requireRole("admin");
  const parsed = maintenanceSchema.safeParse(normalizeMaintenanceFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos del mantenimiento.",
      status: "error",
    };
  }

  const wheelItems =
    parsed.data.maintenanceType === "brake_pads"
      ? buildBrakePadItems(formData)
      : [];

  if (parsed.data.maintenanceType === "brake_pads") {
    const invalidWheel = wheelItems.find(
      (item) => !item.costUsd || !item.expectedWorkDays,
    );

    if (invalidWheel) {
      return {
        message:
          "Las bandas de freno requieren costo y duracion esperada por cada rueda.",
        status: "error",
      };
    }
  }

  const supabase = await createClient();
  const { data: recordId, error } = await supabase.rpc("create_maintenance_record", {
    _bus_id: parsed.data.busId,
    _debt_amount_usd: parsed.data.debtAmountUsd ?? null,
    _debt_creditor: parsed.data.debtCreditor ?? null,
    _debt_due_date: parsed.data.debtDueDate ?? null,
    _description: parsed.data.description,
    _expected_work_days: parsed.data.expectedWorkDays ?? null,
    _items: wheelItems,
    _maintenance_type: parsed.data.maintenanceType,
    _notes: parsed.data.notes ?? null,
    _provider: parsed.data.provider,
    _service_date: parsed.data.serviceDate,
    _total_cost_usd: parsed.data.totalCostUsd.toFixed(2),
  });

  if (error || !recordId) {
    return {
      message:
        error?.code === "23514"
          ? error.message
          : "No pudimos registrar el mantenimiento.",
      status: "error",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/maintenance");

  return {
    message: "Mantenimiento registrado correctamente.",
    status: "success",
  };
}
