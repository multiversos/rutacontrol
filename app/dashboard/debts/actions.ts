"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { debtPaymentSchema, debtSchema } from "@/lib/validators/debt";

function normalizeDebtFormData(formData: FormData) {
  return {
    amountUsd: formData.get("amountUsd"),
    busId: formData.get("busId"),
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
  let resolvedBusId = parsed.data.busId ?? null;

  if (parsed.data.dailyRecordId) {
    const { data: linkedRecord, error: linkedRecordError } = await supabase
      .from("daily_records")
      .select("id, bus_id")
      .eq("id", parsed.data.dailyRecordId)
      .maybeSingle();

    if (linkedRecordError || !linkedRecord) {
      return {
        fieldErrors: {
          dailyRecordId: ["Selecciona un registro diario valido."],
        },
        message: "No pudimos validar el registro diario seleccionado.",
        status: "error",
      };
    }

    if (resolvedBusId && linkedRecord.bus_id !== resolvedBusId) {
      return {
        fieldErrors: {
          busId: [
            "El bus asociado debe coincidir con el bus del registro diario seleccionado.",
          ],
        },
        message: "El bus y el registro diario no pertenecen a la misma unidad.",
        status: "error",
      };
    }

    resolvedBusId = linkedRecord.bus_id;
  }

  if (resolvedBusId) {
    const { data: linkedBus, error: linkedBusError } = await supabase
      .from("buses")
      .select("id")
      .eq("id", resolvedBusId)
      .maybeSingle();

    if (linkedBusError || !linkedBus) {
      return {
        fieldErrors: {
          busId: ["Selecciona un bus valido."],
        },
        message: "No pudimos validar el bus asociado a la deuda.",
        status: "error",
      };
    }
  }

  const payload = {
    amount_usd: parsed.data.amountUsd.toFixed(2),
    bus_id: resolvedBusId,
    creditor: parsed.data.creditor,
    created_by: context.profile.id,
    daily_record_id: parsed.data.dailyRecordId ?? null,
    description: parsed.data.description,
    due_date: parsed.data.dueDate ?? null,
  };

  const { data: debt, error } = await supabase
    .from("debts")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return {
      ...(error.code === "23514"
        ? {
            fieldErrors: {
              busId: [
                "La deuda no puede vincularse a un bus distinto del registro diario o mantenimiento asociado.",
              ],
            },
          }
        : {}),
      message: "No pudimos registrar la deuda.",
      status: "error",
    };
  }

  revalidatePath("/dashboard/debts");
  revalidatePath("/mobile");
  revalidatePath("/mobile/register");
  revalidatePath("/mobile/register/debts");

  return {
    entityId: debt.id,
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
  revalidatePath("/mobile");
  revalidatePath("/mobile/register/debts");

  return {
    entityId: parsed.data.debtId,
    message: "Abono registrado correctamente.",
    status: "success",
  };
}
