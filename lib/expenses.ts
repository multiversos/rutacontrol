import "server-only";

import type { ExpenseCategory } from "@/lib/auth/types";
import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import { isDemoBus } from "@/lib/demo-data";
import { getBusinessTodayDate } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

export const EXPENSE_CATEGORY_OPTIONS: Array<{
  description: string;
  label: string;
  value: ExpenseCategory;
}> = [
  {
    description: "Detalle complementario del gasto de combustible.",
    label: "Gasoil",
    value: "fuel",
  },
  {
    description: "Detalle complementario del pago a trabajadores.",
    label: "Pago a trabajadores",
    value: "worker_payment",
  },
  {
    description: "Otros gastos operativos o de apoyo del dia.",
    label: "Otros",
    value: "other",
  },
];

type DraftRecordRow = {
  bus_id: string;
  id: string;
  other_expenses: string | null;
  record_date: string;
  status: "closed" | "draft";
  user_id: string;
};

type ExpenseRow = {
  amount_bs: string | null;
  amount_usd: string;
  category: ExpenseCategory;
  created_at: string;
  daily_record_id: string;
  description: string | null;
  id: string;
};

export type ExpenseDraftRecordOption = {
  busCode: string;
  busId: string;
  busPhotoUrl: string | null;
  busPlate: string | null;
  currentOtherExpenses: string;
  id: string;
  label: string;
  recordDate: string;
};

export type ExpenseListItem = {
  amountBs: string | null;
  amountUsd: string;
  busCode: string;
  busPhotoUrl: string | null;
  busPlate: string | null;
  category: ExpenseCategory;
  createdAt: string;
  dailyRecordId: string;
  description: string | null;
  id: string;
  recordDate: string;
};

export async function getExpenseFormData(options: {
  role: "admin" | "registrador";
  userId: string;
}) {
  const supabase = await createClient();
  const businessDate = getBusinessTodayDate();

  let draftRecordsQuery = supabase
    .from("daily_records")
    .select("id, bus_id, user_id, record_date, status, other_expenses")
    .eq("status", "draft")
    .order("record_date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(20);

  if (options.role !== "admin") {
    draftRecordsQuery = draftRecordsQuery.eq("user_id", options.userId);
  }

  const [{ data: draftRecords, error: draftRecordsError }, { data: expenses, error: expensesError }] =
    await Promise.all([
      draftRecordsQuery,
      supabase
        .from("expenses")
        .select("id, daily_record_id, category, description, amount_bs, amount_usd, created_at")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  const migrationReady =
    !expensesError ||
    !["42P01", "42703", "PGRST204", "PGRST205"].includes(expensesError.code ?? "");

  if (draftRecordsError) {
    throw draftRecordsError;
  }

  if (expensesError && migrationReady) {
    throw expensesError;
  }

  const expenseRows = migrationReady ? ((expenses ?? []) as ExpenseRow[]) : [];
  const recordIds = Array.from(
    new Set(
      [...((draftRecords ?? []) as DraftRecordRow[]), ...expenseRows.map((expense) => ({
        bus_id: "",
        id: expense.daily_record_id,
        other_expenses: null,
        record_date: "",
        status: "draft" as const,
        user_id: "",
      }))].map((record) => record.id),
    ),
  );

  const { data: linkedRecords, error: linkedRecordsError } =
    recordIds.length > 0
      ? await supabase
          .from("daily_records")
          .select("id, bus_id, user_id, record_date, status, other_expenses")
          .in("id", recordIds)
      : { data: [] as DraftRecordRow[], error: null };

  if (linkedRecordsError) {
    throw linkedRecordsError;
  }

  const busIds = Array.from(
    new Set((linkedRecords ?? []).map((record) => record.bus_id).filter(Boolean)),
  );
  const { data: buses, error: busesError } =
    busIds.length > 0
      ? await supabase
          .from("buses")
          .select("id, code, plate, photo_path, status")
          .in("id", busIds)
      : { data: [], error: null };

  if (busesError) {
    throw busesError;
  }

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const visibleBusIds = new Set(visibleBuses.map((bus) => bus.id));
  const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses);
  const busMap = new Map(
    visibleBuses.map((bus) => [
      bus.id,
      {
        code: bus.code,
        photoUrl: photoMap.get(bus.id) ?? null,
        plate: bus.plate,
      },
    ]),
  );
  const recordMap = new Map(
    (linkedRecords ?? [])
      .filter((record) => visibleBusIds.has(record.bus_id))
      .map((record) => [record.id, record]),
  );

  const draftRecordOptions = ((draftRecords ?? []) as DraftRecordRow[])
    .filter((record) => visibleBusIds.has(record.bus_id))
    .map((record) => ({
      busCode: busMap.get(record.bus_id)?.code ?? record.bus_id,
      busId: record.bus_id,
      busPhotoUrl: busMap.get(record.bus_id)?.photoUrl ?? null,
      busPlate: busMap.get(record.bus_id)?.plate ?? null,
      currentOtherExpenses: record.other_expenses ?? "0.00",
      id: record.id,
      label: `${busMap.get(record.bus_id)?.code ?? record.bus_id} - ${record.record_date}`,
      recordDate: record.record_date,
    })) satisfies ExpenseDraftRecordOption[];

  const recentExpenses = expenseRows
    .map((expense) => {
      const record = recordMap.get(expense.daily_record_id);
      if (!record || !visibleBusIds.has(record.bus_id)) {
        return null;
      }

      return {
        amountBs: expense.amount_bs,
        amountUsd: expense.amount_usd,
        busCode: busMap.get(record.bus_id)?.code ?? record.bus_id,
        busPhotoUrl: busMap.get(record.bus_id)?.photoUrl ?? null,
        busPlate: busMap.get(record.bus_id)?.plate ?? null,
        category: expense.category,
        createdAt: expense.created_at,
        dailyRecordId: expense.daily_record_id,
        description: expense.description,
        id: expense.id,
        recordDate: record.record_date,
      };
    })
    .filter((expense): expense is ExpenseListItem => expense !== null);

  const todayExpenses = recentExpenses.filter(
    (expense) => expense.recordDate === businessDate,
  );

  return {
    businessDate,
    categoryOptions: EXPENSE_CATEGORY_OPTIONS,
    draftRecordOptions,
    migrationReady,
    recentExpenses,
    summary: {
      availableDraftRecords: draftRecordOptions.length,
      todayExpenseCount: todayExpenses.length,
      todayExpenseUsd: todayExpenses.reduce(
        (total, expense) => total + Number.parseFloat(expense.amountUsd),
        0,
      ),
    },
  };
}
