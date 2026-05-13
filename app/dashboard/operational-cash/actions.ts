"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { operationalCashAdjustmentSchema } from "@/lib/validators/operational-cash";

function normalizeAdjustmentFormData(formData: FormData) {
  return {
    amountUsd: formData.get("amountUsd"),
    description: formData.get("description"),
    direction: formData.get("direction"),
    movementDate: formData.get("movementDate"),
  };
}

export async function createOperationalCashAdjustmentAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  const context = await requireRole("admin");
  const parsed = operationalCashAdjustmentSchema.safeParse(
    normalizeAdjustmentFormData(formData),
  );

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos del ajuste.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: movement, error } = await supabase
    .from("operational_cash_movements")
    .insert({
      amount_usd: parsed.data.amountUsd.toFixed(2),
      created_by: context.profile.id,
      description: parsed.data.description,
      direction: parsed.data.direction,
      movement_date: parsed.data.movementDate,
      type: "manual_adjustment",
    })
    .select("id")
    .single();

  if (error) {
    return {
      message: "No pudimos registrar el ajuste de Caja operativa.",
      status: "error",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/operational-cash");

  return {
    entityId: movement.id,
    message: "Ajuste de Caja operativa registrado correctamente.",
    status: "success",
  };
}
