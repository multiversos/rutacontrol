"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validators/expense";

function normalizeExpenseFormData(formData: FormData) {
  return {
    amountBs: formData.get("amountBs"),
    amountUsd: formData.get("amountUsd"),
    category: formData.get("category"),
    dailyRecordId: formData.get("dailyRecordId"),
    description: formData.get("description"),
  };
}

export async function saveExpenseAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  const context = await requireAuth({ redirectTo: "/mobile/register/expenses" });
  const parsed = expenseSchema.safeParse(normalizeExpenseFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos del gasto.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: record, error: recordError } = await supabase
    .from("daily_records")
    .select("id, user_id, status")
    .eq("id", parsed.data.dailyRecordId)
    .maybeSingle();

  if (recordError || !record) {
    return {
      fieldErrors: {
        dailyRecordId: ["Selecciona un registro diario valido."],
      },
      message: "No pudimos validar el registro diario asociado.",
      status: "error",
    };
  }

  if (record.status !== "draft") {
    return {
      fieldErrors: {
        dailyRecordId: ["Solo puedes cargar gastos sobre registros en borrador."],
      },
      message:
        "El detalle de gastos solo esta habilitado para registros diarios que siguen en borrador.",
      status: "error",
    };
  }

  if (
    context.profile.role !== "admin" &&
    record.user_id !== context.profile.id
  ) {
    return {
      message: "Tu sesion no puede detallar gastos sobre ese registro diario.",
      status: "error",
    };
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      amount_bs:
        parsed.data.amountBs == null ? null : parsed.data.amountBs.toFixed(2),
      amount_usd: parsed.data.amountUsd.toFixed(2),
      category: parsed.data.category,
      daily_record_id: parsed.data.dailyRecordId,
      description: parsed.data.description?.trim() ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      message:
        error.code === "42501"
          ? "Tu sesion no tiene permisos para registrar este gasto."
          : "No pudimos registrar el gasto.",
      status: "error",
    };
  }

  revalidatePath("/mobile");
  revalidatePath("/mobile/register");
  revalidatePath("/mobile/register/expenses");

  return {
    entityId: expense.id,
    message:
      "Gasto complementario registrado correctamente. El cierre principal sigue usando las reglas actuales del registro diario.",
    status: "success",
  };
}
