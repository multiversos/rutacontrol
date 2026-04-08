"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import {
  dailyRecordSchema,
  type DailyRecordInput,
} from "@/lib/validators/daily-record";

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

const dailyRecordAuditSelect =
  "id, bus_id, user_id, record_date, departure_time, income_bs, exchange_rate, fuel_cost, worker_payment, other_expenses, net_profit_usd, income_usd, calculated_net, difference, notes, status, closed_at, closure_hash";

type DailyRecordAuditSnapshot = {
  bus_id: string;
  calculated_net: string;
  closed_at: string | null;
  closure_hash: string | null;
  departure_time: string | null;
  difference: string;
  exchange_rate: string | null;
  fuel_cost: string | null;
  id: string;
  income_bs: string | null;
  income_usd: string;
  net_profit_usd: string | null;
  notes: string | null;
  other_expenses: string | null;
  record_date: string;
  status: "closed" | "draft";
  user_id: string;
  worker_payment: string | null;
};

function isClosureReadyInput(input: DailyRecordInput) {
  return [
    input.busId,
    input.userId,
    input.recordDate,
    input.departureTime,
    input.incomeBs,
    input.exchangeRate,
    input.fuelCost,
    input.workerPayment,
    input.otherExpenses,
    input.netProfitUsd,
  ].every((value) => value !== undefined && value !== null && value !== "");
}

function buildDailyRecordAuditValues(record: DailyRecordAuditSnapshot) {
  return {
    bus_id: record.bus_id,
    calculated_net: record.calculated_net,
    closed_at: record.closed_at,
    closure_hash: record.closure_hash,
    departure_time: record.departure_time,
    difference: record.difference,
    exchange_rate: record.exchange_rate,
    fuel_cost: record.fuel_cost,
    income_bs: record.income_bs,
    income_usd: record.income_usd,
    net_profit_usd: record.net_profit_usd,
    notes: record.notes,
    other_expenses: record.other_expenses,
    record_date: record.record_date,
    status: record.status,
    user_id: record.user_id,
    worker_payment: record.worker_payment,
  };
}

async function reconcileDailyRecordDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dates: string[],
) {
  const uniqueDates = Array.from(new Set(dates.filter(Boolean)));

  for (const date of uniqueDates) {
    const { error } = await supabase.rpc("reconcile_missing_closure_alerts", {
      _record_date: date,
    });

    if (
      error &&
      error.code !== "PGRST202" &&
      error.code !== "42883" &&
      error.code !== "42P01"
    ) {
      throw error;
    }
  }
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
  let existingRecord: DailyRecordAuditSnapshot | null = null;

  if (recordId) {
    const { data, error: existingError } = await supabase
      .from("daily_records")
      .select(dailyRecordAuditSelect)
      .eq("id", recordId)
      .maybeSingle();

    if (existingError || !data) {
      return {
        message: "No encontramos el registro que intentas editar.",
        status: "error",
      };
    }

    existingRecord = data;

    if (context.profile.role !== "admin") {
      return {
        message: "Solo el administrador puede editar registros ya creados.",
        status: "error",
      };
    }

    if (existingRecord.status === "closed" && !isClosureReadyInput(parsed.data)) {
      return {
        message:
          "Un registro cerrado debe conservar todos los datos del cierre. Completa todos los campos para guardar la correccion.",
        status: "error",
      };
    }

    existingOwnerId = existingRecord.user_id;
  }

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

  if (
    bus.status !== "active" &&
    (!existingRecord || parsed.data.busId !== existingRecord.bus_id)
  ) {
    return {
      message: "Solo puedes registrar buses con estado activo.",
      status: "error",
    };
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
        .select(dailyRecordAuditSelect)
        .single()
    : supabase
        .from("daily_records")
        .insert(payload)
        .select(dailyRecordAuditSelect)
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

  if (recordId && existingRecord) {
    const { error: auditError } = await supabase.rpc(
      "log_daily_record_update_event",
      {
        _new_values: buildDailyRecordAuditValues(savedRecord),
        _old_values: buildDailyRecordAuditValues(existingRecord),
        _record_id: recordId,
      },
    );

    if (
      auditError &&
      auditError.code !== "PGRST202" &&
      auditError.code !== "42883"
    ) {
      console.error(
        "No pudimos registrar la auditoria explicita del ajuste diario.",
        auditError,
      );
    }

    await reconcileDailyRecordDates(supabase, [
      existingRecord.record_date,
      savedRecord.record_date,
    ]);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/buses");
  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/daily/new");

  if (recordId && existingRecord) {
    revalidatePath(`/dashboard/buses/${existingRecord.bus_id}`);
  }

  revalidatePath(`/dashboard/buses/${savedRecord.bus_id}`);

  return {
    message:
      savedRecord.status === "closed"
        ? recordId
          ? "Registro diario corregido y recalculado correctamente."
          : "Registro diario guardado y cerrado automaticamente."
        : recordId
          ? "Registro diario actualizado como borrador."
          : "Registro diario guardado como borrador.",
    status: "success",
  };
}
