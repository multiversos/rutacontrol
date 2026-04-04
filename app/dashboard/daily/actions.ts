"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { dailyRecordSchema } from "@/lib/validators/daily-record";

function normalizeDailyFormData(formData: FormData) {
  return {
    busId: formData.get("busId"),
    departureTime: formData.get("departureTime"),
    exchangeRate: formData.get("exchangeRate"),
    fuelCost: formData.get("fuelCost"),
    incomeBs: formData.get("incomeBs"),
    netProfitUsd: formData.get("netProfitUsd"),
    notes: formData.get("notes"),
    otherExpenses: formData.get("otherExpenses"),
    recordDate: formData.get("recordDate"),
    userId: formData.get("userId"),
    workerPayment: formData.get("workerPayment"),
  };
}

function toFixedOrNull(value: number | undefined, digits: number) {
  return value == null ? null : value.toFixed(digits);
}

export async function saveDailyRecordAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  const context = await requireAuth();

  const parsed = dailyRecordSchema.safeParse(normalizeDailyFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos del registro diario.",
      status: "error",
    };
  }

  const currentUserId = context.profile.id;
  const requestedUserId = parsed.data.userId;

  if (requestedUserId !== currentUserId) {
    return {
      message: "El responsable del registro no coincide con la sesion activa.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const recordId = String(formData.get("recordId") ?? "").trim();
  let existingOwnerId = currentUserId;
  const { data: bus, error: busError } = await supabase
    .from("buses")
    .select("id, status")
    .eq("id", parsed.data.busId)
    .maybeSingle();

  if (busError || !bus) {
    return {
      message: "El bus seleccionado no existe o no esta disponible para esta sesion.",
      status: "error",
    };
  }

  if (bus.status !== "active") {
    return {
      message: "Solo puedes registrar buses con estado activo.",
      status: "error",
    };
  }

  if (recordId) {
    const { data: existingRecord, error: existingError } = await supabase
      .from("daily_records")
      .select("id, status, user_id")
      .eq("id", recordId)
      .maybeSingle();

    if (existingError || !existingRecord) {
      return {
        message: "No encontramos el registro que intentas editar.",
        status: "error",
      };
    }

    if (existingRecord.status !== "draft") {
      return {
        message: "Solo se pueden editar registros en borrador.",
        status: "error",
      };
    }

    if (
      context.profile.role !== "admin" &&
      existingRecord.user_id !== currentUserId
    ) {
      return {
        message: "No tienes permisos para editar este registro.",
        status: "error",
      };
    }

    existingOwnerId = existingRecord.user_id;
  }

  let duplicateQuery = supabase
    .from("daily_records")
    .select("id")
    .eq("bus_id", parsed.data.busId)
    .eq("record_date", parsed.data.recordDate)
    .limit(1);

  if (recordId) {
    duplicateQuery = duplicateQuery.neq("id", recordId);
  }

  const { data: duplicateRecord } = await duplicateQuery.maybeSingle();

  if (duplicateRecord) {
    return {
      message:
        "Ese bus ya tiene un registro para la fecha seleccionada. Cambia el bus o la fecha.",
      status: "error",
    };
  }

  const payload = {
    bus_id: parsed.data.busId,
    departure_time: parsed.data.departureTime ?? null,
    exchange_rate: toFixedOrNull(parsed.data.exchangeRate, 6),
    fuel_cost: toFixedOrNull(parsed.data.fuelCost, 2),
    income_bs: toFixedOrNull(parsed.data.incomeBs, 2),
    net_profit_usd: toFixedOrNull(parsed.data.netProfitUsd, 2),
    notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
    other_expenses: toFixedOrNull(parsed.data.otherExpenses, 2),
    record_date: parsed.data.recordDate,
    user_id: existingOwnerId,
    worker_payment: toFixedOrNull(parsed.data.workerPayment, 2),
  };

  const query = recordId
    ? supabase
        .from("daily_records")
        .update(payload)
        .eq("id", recordId)
        .select("id, status, closed_at, closure_hash")
        .single()
    : supabase
        .from("daily_records")
        .insert(payload)
        .select("id, status, closed_at, closure_hash")
        .single();

  const { data: savedRecord, error } = await query;

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "Ya existe un registro para ese bus en esa fecha."
          : error.code === "23514"
            ? "El registro diario no cumple las reglas operativas esperadas."
          : "No pudimos guardar el registro diario.",
      status: "error",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/daily/new");

  return {
    message:
      savedRecord.status === "closed"
        ? recordId
          ? "Registro diario actualizado y cerrado correctamente."
          : "Registro diario guardado y cerrado automaticamente."
        : recordId
          ? "Registro diario actualizado como borrador."
          : "Registro diario guardado como borrador.",
    status: "success",
  };
}
