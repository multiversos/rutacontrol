"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth, requireRole } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import {
  dailyRecordSchema,
  type DailyRecordInput,
} from "@/lib/validators/daily-record";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

type SupabaseLikeError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

function normalizeDailyFormData(formData: FormData) {
  return {
    busId: formData.get("busId"),
    departureTime: formData.get("departureTime"),
    fuelCost: formData.get("fuelCost"),
    incomeUsd: formData.get("incomeUsd"),
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
  income_usd: string | null;
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
    input.incomeUsd,
    input.fuelCost,
    input.workerPayment,
    input.otherExpenses,
  ].every((value) => value !== undefined && value !== null && value !== "");
}

function normalizeDeleteDailyRecordFormData(formData: FormData) {
  return {
    recordId: String(formData.get("recordId") ?? "").trim(),
    returnTo: String(formData.get("returnTo") ?? "").trim(),
  };
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

function buildDailyReturnPath(value: string) {
  if (!value.startsWith("/")) {
    return "/dashboard/daily?deletedDraft=1";
  }

  const url = new URL(value, "http://rutacontrol.local");
  if (url.pathname !== "/dashboard/daily") {
    return "/dashboard/daily?deletedDraft=1";
  }

  url.searchParams.set("deletedDraft", "1");

  return `${url.pathname}?${url.searchParams.toString()}`;
}

function formatSupabaseError(error: SupabaseLikeError | null | undefined) {
  if (!error) {
    return null;
  }

  const code = error.code?.trim();
  const message = error.message?.trim();
  const hint = error.hint?.trim();
  const details = error.details?.trim();

  return [code ? `[${code}]` : null, message, hint, details]
    .filter(Boolean)
    .join(" ");
}

function getDailyRecordPersistenceMessage(
  error: SupabaseLikeError,
  isEditing: boolean,
) {
  if (error.code === "23505") {
    return "Ese bus ya tiene un registro para la fecha seleccionada. Cambia el bus o la fecha.";
  }

  if (error.code === "23514") {
    if (error.message?.includes("Daily records require an active bus")) {
      return "Solo puedes mover el registro a un bus activo. Si corriges un registro historico, manten la misma unidad o activa el bus antes de cambiarlo.";
    }

    return "El registro diario no cumple las reglas operativas esperadas.";
  }

  if (error.code === "42501") {
    return isEditing
      ? "Tu sesion no tiene permisos para corregir este registro diario."
      : "Tu sesion no tiene permisos para crear este registro diario.";
  }

  if (
    error.message?.includes("No se puede modificar un registro diario cerrado")
  ) {
    return "La base todavia esta bloqueando correcciones sobre registros cerrados. Aplica la migracion 0013_fix_closed_daily_record_admin_updates.sql y vuelve a intentar.";
  }

  return (
    formatSupabaseError(error) ??
    "No pudimos guardar el registro diario por un error inesperado."
  );
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

  const { data: duplicateRecord, error: duplicateError } =
    await duplicateQuery.maybeSingle();

  if (duplicateError) {
    return {
      message: getDailyRecordPersistenceMessage(duplicateError, Boolean(recordId)),
      status: "error",
    };
  }

  if (duplicateRecord) {
    return {
      message:
        "Ese bus ya tiene un registro para la fecha seleccionada. Cambia el bus o la fecha.",
      status: "error",
    };
  }

  const departureTimeForPersistence =
    existingRecord?.departure_time ??
    parsed.data.departureTime ??
    (isClosureReadyInput(parsed.data) ? "00:00" : null);

  const basePayload = {
    departure_time: departureTimeForPersistence,
    exchange_rate: null,
    fuel_cost: toFixedOrNull(parsed.data.fuelCost, 2),
    income_bs: null,
    income_usd: toFixedOrNull(parsed.data.incomeUsd, 2),
    net_profit_usd: null,
    notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
    other_expenses: toFixedOrNull(parsed.data.otherExpenses, 2),
    record_date: parsed.data.recordDate,
    user_id: existingOwnerId,
    worker_payment: toFixedOrNull(parsed.data.workerPayment, 2),
  } satisfies Omit<TablesUpdate<"daily_records">, "bus_id">;
  const updatePayload: TablesUpdate<"daily_records"> =
    recordId && existingRecord && parsed.data.busId === existingRecord.bus_id
      ? basePayload
      : { ...basePayload, bus_id: parsed.data.busId };
  const insertPayload: TablesInsert<"daily_records"> = {
    ...basePayload,
    bus_id: parsed.data.busId,
  };

  const query = recordId
    ? supabase
        .from("daily_records")
        .update(updatePayload)
        .eq("id", recordId)
        .select(dailyRecordAuditSelect)
        .single()
    : supabase
        .from("daily_records")
        .insert(insertPayload)
        .select(dailyRecordAuditSelect)
        .single();

  const { data: savedRecord, error } = await query;

  if (error) {
    return {
      message: getDailyRecordPersistenceMessage(error, Boolean(recordId)),
      status: "error",
    };
  }

  let followUpMessage: string | null = null;

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
      followUpMessage =
        "La correccion se guardo, pero no pudimos registrar la auditoria explicita del cambio.";
    }

    try {
      await reconcileDailyRecordDates(supabase, [
        existingRecord.record_date,
        savedRecord.record_date,
      ]);
    } catch (reconcileError) {
      console.error(
        "No pudimos reconciliar alertas despues de corregir el registro diario.",
        reconcileError,
      );
      followUpMessage =
        "La correccion se guardo, pero no pudimos reconciliar alertas ni diferencias automaticamente.";
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/buses");
  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/daily/new");
  revalidatePath("/mobile");
  revalidatePath("/mobile/register");
  revalidatePath("/mobile/register/expenses");
  revalidatePath("/mobile/register/debts");

  if (recordId && existingRecord) {
    revalidatePath(`/dashboard/buses/${existingRecord.bus_id}`);
  }

  revalidatePath(`/dashboard/buses/${savedRecord.bus_id}`);

  return {
    entityId: savedRecord.id,
    message:
      followUpMessage ??
      (savedRecord.status === "closed"
        ? recordId
          ? "Registro diario corregido y recalculado correctamente."
          : "Registro diario guardado y cerrado automaticamente."
        : recordId
          ? "Registro diario actualizado como borrador."
          : "Registro diario guardado como borrador."),
    status: "success",
  };
}

export async function deleteDailyRecordAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  await requireRole("admin");
  const { recordId, returnTo } = normalizeDeleteDailyRecordFormData(formData);

  if (!recordId) {
    return {
      message: "No pudimos identificar el borrador a eliminar.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: record, error: recordError } = await supabase
    .from("daily_records")
    .select(dailyRecordAuditSelect)
    .eq("id", recordId)
    .maybeSingle();

  if (recordError || !record) {
    return {
      message: "No encontramos el registro diario solicitado.",
      status: "error",
    };
  }

  if (record.status !== "draft") {
    return {
      message: "Solo se pueden eliminar registros en borrador.",
      status: "error",
    };
  }

  const { error: deleteError } = await supabase
    .from("daily_records")
    .delete()
    .eq("id", recordId)
    .eq("status", "draft");

  if (deleteError) {
    return {
      message: getDailyRecordPersistenceMessage(deleteError, true),
      status: "error",
    };
  }

  try {
    await reconcileDailyRecordDates(supabase, [record.record_date]);
  } catch (reconcileError) {
    console.error(
      "No pudimos reconciliar alertas despues de eliminar el borrador diario.",
      reconcileError,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/buses");
  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/daily/new");
  revalidatePath("/mobile");
  revalidatePath("/mobile/register");
  revalidatePath("/mobile/register/expenses");
  revalidatePath("/mobile/register/debts");
  revalidatePath(`/dashboard/buses/${record.bus_id}`);

  redirect(buildDailyReturnPath(returnTo));
}
