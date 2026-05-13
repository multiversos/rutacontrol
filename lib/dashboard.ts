import "server-only";

import type { Json, Tables } from "@/lib/supabase/database.types";
import { reconcileMissingClosureAlerts } from "@/lib/alerts";
import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import {
  getAuditBusId,
  getAuditRecordDate,
  isDemoBus,
  isOperationalRecordDate,
} from "@/lib/demo-data";
import {
  formatDateLabel,
  getBusinessTodayDate,
  shiftDateString,
} from "@/lib/formatters";
import { getOperationalCashSummary } from "@/lib/operational-cash";
import { createClient } from "@/lib/supabase/server";

type BusLookup = Pick<Tables<"buses">, "code" | "id" | "photo_path" | "plate" | "status">;
type AuditBusLookup = Pick<Tables<"buses">, "code" | "id">;
type ProfileLookup = Pick<Tables<"profiles">, "id" | "name">;
type DailyRecordLookup = Pick<
  Tables<"daily_records">,
  | "bus_id"
  | "calculated_net"
  | "closed_at"
  | "created_at"
  | "difference"
  | "fuel_cost"
  | "id"
  | "income_usd"
  | "other_expenses"
  | "record_date"
  | "status"
  | "updated_at"
  | "user_id"
  | "worker_payment"
>;
type AuditLogLookup = Pick<
  Tables<"audit_log">,
  "action" | "created_at" | "id" | "new_values" | "old_values" | "record_id" | "user_id"
>;

type JsonObject = { [key: string]: Json | undefined };

export type DashboardFilterState = {
  busId: string | undefined;
  date: string | undefined;
};

export type HistoryFilterState = {
  busId: string | undefined;
  dateFrom: string | undefined;
  dateTo: string | undefined;
};

export type BusOption = {
  code: string;
  id: string;
};

export type DashboardKpiItem = {
  helper: string;
  label: string;
  tone?: "default" | "danger" | "success" | "warning";
  value: string;
};

export type DashboardRecordSummary = {
  busCode: string;
  busPhotoUrl: string | null;
  busPlate: string | null;
  closedAt: string | null;
  difference: string;
  id: string;
  incomeUsd: string;
  recordDate: string;
  status: Tables<"daily_records">["status"];
  userName: string | undefined;
};

export type NormalizedDailyRecord = {
  busCode: string;
  busId: string;
  busPhotoUrl: string | null;
  busPlate: string | null;
  calculatedNet: string;
  closedAt: string | null;
  createdAt: string;
  difference: string;
  fuelCost: string;
  id: string;
  incomeUsd: string;
  otherExpenses: string;
  recordDate: string;
  status: Tables<"daily_records">["status"];
  updatedAt: string;
  userName: string | undefined;
  workerPayment: string;
};

export type HistorySummaryRow = {
  busCount: number;
  closedRecords: number;
  draftRecords: number;
  label: string;
  openDifferences: number;
  periodKey: string;
  totalCalculatedNet: number;
  totalDifference: number;
  totalExpenses: number;
  totalIncomeUsd: number;
  totalRecords: number;
};

export type AuditEntry = {
  action: Tables<"audit_log">["action"];
  actorName: string;
  busCode: string | undefined;
  createdAt: string;
  id: string;
  note: string;
  recordDate: string | undefined;
  recordId: string;
  statusAfter: string | undefined;
};

type NormalizedAuditContext = {
  busId: string | undefined;
  recordDate: string | undefined;
  status: string | undefined;
};

function toNumber(value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function isJsonObject(value: Json | null): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getAuditContext(entry: AuditLogLookup): NormalizedAuditContext {
  const source = isJsonObject(entry.new_values)
    ? entry.new_values
    : isJsonObject(entry.old_values)
      ? entry.old_values
      : null;

  if (!source) {
    return {
      busId: undefined,
      recordDate: undefined,
      status: undefined,
    };
  }

  return {
    busId: getAuditBusId(source) ?? undefined,
    recordDate: getAuditRecordDate(source) ?? undefined,
    status: typeof source.status === "string" ? source.status : undefined,
  };
}

function formatMonthLabel(dateValue: string) {
  const label = new Intl.DateTimeFormat("es-VE", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${dateValue}T00:00:00Z`));

  return label.replace(" de ", " ").replace(/^\p{Ll}/u, (match) => match.toUpperCase());
}

function getWeekStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);

  return date.toISOString().slice(0, 10);
}

function buildSummaryRows(
  records: NormalizedDailyRecord[],
  mode: "month" | "week",
) {
  const groups = new Map<
    string,
    HistorySummaryRow & {
      busIds: Set<string>;
    }
  >();

  records.forEach((record) => {
    const periodKey =
      mode === "week"
        ? getWeekStart(record.recordDate)
        : `${record.recordDate.slice(0, 7)}-01`;
    const current = groups.get(periodKey);

    if (current) {
      current.busIds.add(record.busId);
      current.closedRecords += record.status === "closed" ? 1 : 0;
      current.draftRecords += record.status === "draft" ? 1 : 0;
      current.openDifferences += Math.abs(toNumber(record.difference)) >= 0.01 ? 1 : 0;
      current.totalCalculatedNet += toNumber(record.calculatedNet);
      current.totalDifference += toNumber(record.difference);
      current.totalExpenses +=
        toNumber(record.fuelCost) +
        toNumber(record.workerPayment) +
        toNumber(record.otherExpenses);
      current.totalIncomeUsd += toNumber(record.incomeUsd);
      current.totalRecords += 1;
      return;
    }

    groups.set(periodKey, {
      busCount: 1,
      busIds: new Set([record.busId]),
      closedRecords: record.status === "closed" ? 1 : 0,
      draftRecords: record.status === "draft" ? 1 : 0,
      label:
        mode === "week"
          ? `${formatDateLabel(periodKey)} - ${formatDateLabel(
              shiftDateString(periodKey, 6),
            )}`
          : formatMonthLabel(periodKey),
      openDifferences: Math.abs(toNumber(record.difference)) >= 0.01 ? 1 : 0,
      periodKey,
      totalCalculatedNet: toNumber(record.calculatedNet),
      totalDifference: toNumber(record.difference),
      totalExpenses:
        toNumber(record.fuelCost) +
        toNumber(record.workerPayment) +
        toNumber(record.otherExpenses),
      totalIncomeUsd: toNumber(record.incomeUsd),
      totalRecords: 1,
    });
  });

  return Array.from(groups.values())
    .map(({ busIds, ...row }) => ({
      ...row,
      busCount: busIds.size,
    }))
    .sort((left, right) => right.periodKey.localeCompare(left.periodKey));
}

function normalizeDailyRecords(
  records: DailyRecordLookup[],
  buses: BusLookup[],
  profiles: ProfileLookup[],
  photoMap: Map<string, string | null>,
) {
  const busMap = new Map(
    buses.map((bus) => [
      bus.id,
      {
        code: bus.code,
        photoUrl: photoMap.get(bus.id) ?? null,
        plate: bus.plate,
      },
    ]),
  );
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.name]));

  return records.map((record) => ({
    busCode: busMap.get(record.bus_id)?.code ?? record.bus_id,
    busId: record.bus_id,
    busPhotoUrl: busMap.get(record.bus_id)?.photoUrl ?? null,
    busPlate: busMap.get(record.bus_id)?.plate ?? null,
    calculatedNet: record.calculated_net,
    closedAt: record.closed_at,
    createdAt: record.created_at,
    difference: record.difference,
    fuelCost: record.fuel_cost ?? "0.00",
    id: record.id,
    incomeUsd: record.income_usd ?? "0.00",
    otherExpenses: record.other_expenses ?? "0.00",
    recordDate: record.record_date,
    status: record.status,
    updatedAt: record.updated_at,
    userName: profileMap.get(record.user_id),
    workerPayment: record.worker_payment ?? "0.00",
  }));
}

function normalizeAuditEntries(
  entries: AuditLogLookup[],
  buses: AuditBusLookup[],
  profiles: ProfileLookup[],
) {
  const busMap = new Map(buses.map((bus) => [bus.id, bus.code]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.name]));
  const actionLabels: Record<Tables<"audit_log">["action"], string> = {
    close: "Cierre aplicado",
    create: "Registro creado",
    delete: "Registro eliminado",
    update: "Registro actualizado",
  };

  return entries.map((entry) => {
    const context = getAuditContext(entry);

    return {
      action: entry.action,
      actorName: entry.user_id
        ? profileMap.get(entry.user_id) ?? "Usuario sin nombre"
        : "Sistema",
      busCode: context.busId ? busMap.get(context.busId) ?? context.busId : undefined,
      createdAt: entry.created_at,
      id: entry.id,
      note: actionLabels[entry.action],
      recordDate: context.recordDate,
      recordId: entry.record_id,
      statusAfter: context.status,
    } satisfies AuditEntry;
  });
}

export async function getAdminDashboardData(filters: DashboardFilterState) {
  const supabase = await createClient();
  const selectedDate = filters.date ?? getBusinessTodayDate();

  await reconcileMissingClosureAlerts(selectedDate);

  let recordsQuery = supabase
    .from("daily_records")
    .select(
      "id, bus_id, user_id, record_date, income_usd, calculated_net, difference, status, closed_at, created_at, updated_at, fuel_cost, worker_payment, other_expenses",
    )
    .eq("record_date", selectedDate)
    .order("updated_at", { ascending: false });

  if (filters.busId) {
    recordsQuery = recordsQuery.eq("bus_id", filters.busId);
  }

  const [{ data: records }, { data: buses }, { data: profiles }, { data: auditEntries }] =
    await Promise.all([
      recordsQuery,
      supabase.from("buses").select("id, code, plate, photo_path, status").order("code"),
      supabase.from("profiles").select("id, name"),
      supabase
        .from("audit_log")
        .select("id, action, created_at, record_id, user_id, old_values, new_values")
        .eq("table_name", "daily_records")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
  const operationalCash = await getOperationalCashSummary(selectedDate);

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses);
  const normalizedRecords = normalizeDailyRecords(
    records ?? [],
    buses ?? [],
    profiles ?? [],
    photoMap,
  );
  const visibleBusIds = new Set(visibleBuses.map((bus) => bus.id));
  const filteredRecords = normalizedRecords.filter(
    (record) =>
      isOperationalRecordDate(record.recordDate, selectedDate) &&
      visibleBusIds.has(record.busId),
  );
  const activeBuses = visibleBuses.filter(
    (bus) => bus.status === "active" && (!filters.busId || bus.id === filters.busId),
  );
  const closedBusIds = new Set(
    filteredRecords
      .filter((record) => record.status === "closed")
      .map((record) => record.busId),
  );
  const differenceRecords = filteredRecords.filter(
    (record) => Math.abs(toNumber(record.difference)) >= 0.01,
  );
  const pendingBuses = activeBuses.filter((bus) => !closedBusIds.has(bus.id));
  const totals = filteredRecords.reduce(
    (accumulator, record) => ({
      incomeUsd: accumulator.incomeUsd + toNumber(record.incomeUsd),
      netCalculated: accumulator.netCalculated + toNumber(record.calculatedNet),
    }),
    {
      incomeUsd: 0,
      netCalculated: 0,
    },
  );

  return {
    auditPreview: normalizeAuditEntries(auditEntries ?? [], buses ?? [], profiles ?? []).filter(
      (entry) =>
        !entry.busCode ||
        (!isDemoBus({ code: entry.busCode }) &&
          isOperationalRecordDate(entry.recordDate, selectedDate)),
    ),
    busOptions: visibleBuses.map((bus) => ({
      code: bus.code,
      id: bus.id,
    })),
    differenceRecords,
    filters: {
      busId: filters.busId,
      date: selectedDate,
    },
    kpis: [
      {
        helper: `Fecha operativa ${formatDateLabel(selectedDate)}`,
        label: "Ingreso del dia",
        value: totals.incomeUsd.toLocaleString("es-VE", {
          currency: "USD",
          minimumFractionDigits: 2,
          style: "currency",
        }),
      },
      {
        helper: "Neto calculado a partir de los registros visibles",
        label: "Neto del dia",
        value: totals.netCalculated.toLocaleString("es-VE", {
          currency: "USD",
          minimumFractionDigits: 2,
          style: "currency",
        }),
      },
      {
        helper: "Registros con difference distinta de 0",
        label: "Diferencias abiertas",
        tone: differenceRecords.length > 0 ? "danger" : "success",
        value: String(differenceRecords.length),
      },
      {
        helper: "Buses activos sin cierre para la fecha elegida",
        label: "Buses pendientes",
        tone: pendingBuses.length > 0 ? "warning" : "success",
        value: String(pendingBuses.length),
      },
    ] satisfies DashboardKpiItem[],
    operationalCash,
    pendingBuses: pendingBuses.map((bus) => bus.code),
    records: filteredRecords.map((record) => ({
      busCode: record.busCode,
      busPhotoUrl: record.busPhotoUrl,
      busPlate: record.busPlate,
      closedAt: record.closedAt,
      difference: record.difference,
      id: record.id,
      incomeUsd: record.incomeUsd,
      recordDate: record.recordDate,
      status: record.status,
      userName: record.userName,
    })) satisfies DashboardRecordSummary[],
    selectedDate,
  };
}

export async function getDailyHistoryData(filters: HistoryFilterState) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, -29);
  const dateTo = filters.dateTo ?? today;

  let recordsQuery = supabase
    .from("daily_records")
    .select(
      "id, bus_id, user_id, record_date, income_usd, fuel_cost, worker_payment, other_expenses, calculated_net, difference, status, closed_at, created_at, updated_at",
    )
    .gte("record_date", dateFrom)
    .lte("record_date", dateTo)
    .order("record_date", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters.busId) {
    recordsQuery = recordsQuery.eq("bus_id", filters.busId);
  }

  const [{ data: records }, { data: buses }, { data: profiles }] = await Promise.all([
    recordsQuery,
    supabase.from("buses").select("id, code, plate, photo_path, status").order("code"),
    supabase.from("profiles").select("id, name"),
  ]);

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses);
  const normalizedRecords = normalizeDailyRecords(
    records ?? [],
    buses ?? [],
    profiles ?? [],
    photoMap,
  );
  const visibleBusIds = new Set(visibleBuses.map((bus) => bus.id));
  const filteredRecords = normalizedRecords.filter(
    (record) =>
      isOperationalRecordDate(record.recordDate, today) &&
      visibleBusIds.has(record.busId),
  );

  return {
    busOptions: visibleBuses.map((bus) => ({
      code: bus.code,
      id: bus.id,
    })),
    filters: {
      busId: filters.busId,
      dateFrom,
      dateTo,
    },
    monthlySummary: buildSummaryRows(filteredRecords, "month"),
    records: filteredRecords,
    weeklySummary: buildSummaryRows(filteredRecords, "week"),
  };
}

export async function getDailyAuditData(filters: HistoryFilterState) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, -13);
  const dateTo = filters.dateTo ?? today;

  const [{ data: entries }, { data: buses }, { data: profiles }] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, action, created_at, record_id, user_id, old_values, new_values")
      .eq("table_name", "daily_records")
      .in("action", ["create", "update", "close"])
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59.999Z`)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("buses").select("id, code").order("code"),
    supabase.from("profiles").select("id, name"),
  ]);

  return {
    entries: normalizeAuditEntries(entries ?? [], buses ?? [], profiles ?? []).filter(
      (entry) =>
        !entry.busCode ||
        (!isDemoBus({ code: entry.busCode }) &&
          isOperationalRecordDate(entry.recordDate, today)),
    ),
    filters: {
      dateFrom,
      dateTo,
    },
  };
}
