"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { debtPaymentSchema, debtSchema } from "@/lib/validators/debt";

function normalizeDebtFormData(formData: FormData) {
  return {
    amountUsd: formData.get("amountUsd"),
    creditor: formData.get("creditor"),
    dailyRecordId: formData.get("dailyRecordId"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  };
}

function normalizeDebtPaymentFormData(formData: FormData) {
  return {
    amountUsd: formData.get("amountUsd"),
    debtId: formData.get("debtId"),
    notes: formData.get("notes"),
    paymentDate: formData.get("paymentDate"),
  };
}

export async function saveDebtAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  const context = await requireRole("admin");
  const parsed = debtSchema.safeParse(normalizeDebtFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos de la deuda.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const payload = {
    amount_usd: parsed.data.amountUsd.toFixed(2),
    creditor: parsed.data.creditor,
    created_by: context.profile.id,
    daily_record_id: parsed.data.dailyRecordId ?? null,
    description: parsed.data.description,
    due_date: parsed.data.dueDate ?? null,
  };

  const { error } = await supabase.from("debts").insert(payload);

  if (error) {
    return {
      message: "No pudimos registrar la deuda.",
      status: "error",
    };
  }

  revalidatePath("/dashboard/debts");

  return {
    message: "Deuda registrada correctamente.",
    status: "success",
  };
}

export async function registerDebtPaymentAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  const context = await requireRole("admin");
  const parsed = debtPaymentSchema.safeParse(normalizeDebtPaymentFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos del abono.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("id, status")
    .eq("id", parsed.data.debtId)
    .maybeSingle();

  if (debtError || !debt) {
    return {
      message: "La deuda seleccionada ya no esta disponible.",
      status: "error",
    };
  }

  if (debt.status === "paid") {
    return {
      message: "La deuda ya esta pagada por completo.",
      status: "error",
    };
  }

  const { error } = await supabase.from("debt_payments").insert({
    amount_usd: parsed.data.amountUsd.toFixed(2),
    created_by: context.profile.id,
    debt_id: parsed.data.debtId,
    notes: parsed.data.notes ?? null,
    payment_date: parsed.data.paymentDate,
  });

  if (error) {
    return {
      message:
        error.code === "23514"
          ? "El abono supera el saldo disponible o incumple las reglas financieras."
          : "No pudimos registrar el abono.",
      status: "error",
    };
  }

  revalidatePath("/dashboard/debts");

  return {
    message: "Abono registrado correctamente.",
    status: "success",
  };
}
