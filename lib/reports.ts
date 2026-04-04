import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { detectRouteIncomeAnomalies } from "@/lib/anomaly-engine";
import {
  buildRegistrarConfidenceScores,
  CONFIDENCE_SCORE_FORMULA,
} from "@/lib/scoring";
import {
  formatDateLabel,
  getBusinessTodayDate,
  shiftDateString,
} from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

type DailyRecordRow = Pick<
  Tables<"daily_records">,
  | "bus_id"
  | "calculated_net"
  | "closed_at"
  | "created_at"
  | "difference"
  | "id"
  | "income_usd"
  | "record_date"
  | "status"
  | "updated_at"
  | "user_id"
>;

type BusRow = Pick<Tables<"buses">, "code" | "id" | "route_id" | "status">;
type RouteRow = Pick<Tables<"routes">, "destination" | "id" | "name" | "origin">;
type ProfileRow = Pick<Tables<"profiles">, "id" | "name" | "role">;
export type ReportFilters = {
  busId?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  routeId?: string | undefined;
};

export type IntelligenceFilters = ReportFilters & {
  profileId?: string | undefined;
};

type EnrichedRecord = {
  busCode: string;
  busId: string;
  calculatedNet: number;
  closedAt: string | null;
  createdAt: string;
  difference: number;
  id: string;
  incomeUsd: number;
  recordDate: string;
  routeId: string;
  routeLabel: string;
  status: Tables<"daily_records">["status"];
  updatedAt: string;
  userId: string;
  userName: string;
};

export type FilterOption = {
  id: string;
  label: string;
};

export type ProfitabilityReportRow = {
  closureCount: number;
  differenceTotalUsd: number;
  entityId: string;
  entityLabel: string;
  expensesUsd: number;
  incomeUsd: number;
  netUsd: number;
};

export type ConsolidatedClosureRow = {
  busCount: number;
  closureCount: number;
  differenceTotalUsd: number;
  periodKey: string;
  routeCount: number;
  totalExpensesUsd: number;
  totalIncomeUsd: number;
  totalNetUsd: number;
};

function toNumber(value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number) {
  return Number.parseFloat(value.toFixed(2));
}

function getWeekStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

function getMonthStart(dateValue: string) {
  return `${dateValue.slice(0, 7)}-01`;
}

function formatMonthLabel(dateValue: string) {
  return new Intl.DateTimeFormat("es-VE", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${dateValue}T00:00:00Z`));
}

function buildRouteLabel(route: RouteRow) {
  return `${route.name} (${route.origin} -> ${route.destination})`;
}

function buildProfitabilityRows(
  records: EnrichedRecord[],
  mode: "bus" | "route",
) {
  const groups = new Map<string, ProfitabilityReportRow>();

  records.forEach((record) => {
    const entityId = mode === "bus" ? record.busId : record.routeId;
    const entityLabel = mode === "bus" ? record.busCode : record.routeLabel;
    const expensesUsd = round(record.incomeUsd - record.calculatedNet);
    const current = groups.get(entityId);

    if (current) {
      current.closureCount += 1;
      current.differenceTotalUsd = round(
        current.differenceTotalUsd + record.difference,
      );
      current.expensesUsd = round(current.expensesUsd + expensesUsd);
      current.incomeUsd = round(current.incomeUsd + record.incomeUsd);
      current.netUsd = round(current.netUsd + record.calculatedNet);
      return;
    }

    groups.set(entityId, {
      closureCount: 1,
      differenceTotalUsd: round(record.difference),
      entityId,
      entityLabel,
      expensesUsd,
      incomeUsd: round(record.incomeUsd),
      netUsd: round(record.calculatedNet),
    });
  });

  return Array.from(groups.values()).sort((left, right) => right.netUsd - left.netUsd);
}

function buildConsolidatedClosures(
  records: EnrichedRecord[],
  mode: "month" | "week",
) {
  const groups = new Map<
    string,
    ConsolidatedClosureRow & {
      busIds: Set<string>;
      routeIds: Set<string>;
    }
  >();

  records.forEach((record) => {
    const periodKey =
      mode === "week" ? getWeekStart(record.recordDate) : getMonthStart(record.recordDate);
    const current = groups.get(periodKey);
    const expensesUsd = round(record.incomeUsd - record.calculatedNet);

    if (current) {
      current.busIds.add(record.busId);
      current.routeIds.add(record.routeId);
      current.closureCount += 1;
      current.differenceTotalUsd = round(
        current.differenceTotalUsd + record.difference,
      );
      current.totalExpensesUsd = round(current.totalExpensesUsd + expensesUsd);
      current.totalIncomeUsd = round(current.totalIncomeUsd + record.incomeUsd);
      current.totalNetUsd = round(current.totalNetUsd + record.calculatedNet);
      return;
    }

    groups.set(periodKey, {
      busCount: 1,
      busIds: new Set([record.busId]),
      closureCount: 1,
      differenceTotalUsd: round(record.difference),
      periodKey,
      routeCount: 1,
      routeIds: new Set([record.routeId]),
      totalExpensesUsd: expensesUsd,
      totalIncomeUsd: round(record.incomeUsd),
      totalNetUsd: round(record.calculatedNet),
    });
  });

  return Array.from(groups.values())
    .map(({ busIds, routeIds, ...row }) => ({
      ...row,
      busCount: busIds.size,
      routeCount: routeIds.size,
    }))
    .sort((left, right) => right.periodKey.localeCompare(left.periodKey));
}

function normalizeRecords(
  records: DailyRecordRow[],
  buses: BusRow[],
  profiles: ProfileRow[],
  routes: RouteRow[],
) {
  const busMap = new Map(buses.map((bus) => [bus.id, bus]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const routeMap = new Map(routes.map((route) => [route.id, route]));

  return records
    .map((record) => {
      const bus = busMap.get(record.bus_id);
      const route = bus ? routeMap.get(bus.route_id) : null;
      const profile = profileMap.get(record.user_id);

      if (!bus || !route || !profile) {
        return null;
      }

      return {
        busCode: bus.code,
        busId: bus.id,
        calculatedNet: toNumber(record.calculated_net),
        closedAt: record.closed_at,
        createdAt: record.created_at,
        difference: toNumber(record.difference),
        id: record.id,
        incomeUsd: toNumber(record.income_usd),
        recordDate: record.record_date,
        routeId: route.id,
        routeLabel: buildRouteLabel(route),
        status: record.status,
        updatedAt: record.updated_at,
        userId: profile.id,
        userName: profile.name,
      } satisfies EnrichedRecord;
    })
    .filter((record): record is EnrichedRecord => Boolean(record));
}

function filterRecords(
  records: EnrichedRecord[],
  filters: IntelligenceFilters,
  options?: {
    closedOnly?: boolean;
  },
) {
  return records.filter((record) => {
    if (options?.closedOnly && record.status !== "closed") {
      return false;
    }

    if (filters.busId && record.busId !== filters.busId) {
      return false;
    }

    if (filters.routeId && record.routeId !== filters.routeId) {
      return false;
    }

    if (filters.profileId && record.userId !== filters.profileId) {
      return false;
    }

    if (filters.dateFrom && record.recordDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && record.recordDate > filters.dateTo) {
      return false;
    }

    return true;
  });
}

export async function getReportsData(filters: ReportFilters) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, -89);
  const dateTo = filters.dateTo ?? today;

  const [{ data: records }, { data: buses }, { data: routes }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("daily_records")
        .select(
          "id, bus_id, user_id, record_date, income_usd, calculated_net, difference, status, closed_at, created_at, updated_at",
        )
        .gte("record_date", dateFrom)
        .lte("record_date", dateTo)
        .order("record_date", { ascending: false }),
      supabase.from("buses").select("id, code, route_id, status").order("code"),
      supabase
        .from("routes")
        .select("id, name, origin, destination")
        .order("name"),
      supabase.from("profiles").select("id, name, role").order("name"),
    ]);

  const normalizedRecords = normalizeRecords(
    records ?? [],
    buses ?? [],
    profiles ?? [],
    routes ?? [],
  );
  const filteredClosedRecords = filterRecords(
    normalizedRecords,
    {
      ...filters,
      dateFrom,
      dateTo,
    },
    {
      closedOnly: true,
    },
  );

  const profitabilityByBus = buildProfitabilityRows(filteredClosedRecords, "bus");
  const profitabilityByRoute = buildProfitabilityRows(filteredClosedRecords, "route");
  const weeklyClosures = buildConsolidatedClosures(filteredClosedRecords, "week");
  const monthlyClosures = buildConsolidatedClosures(filteredClosedRecords, "month");

  return {
    busOptions: (buses ?? []).map((bus) => ({
      id: bus.id,
      label: bus.code,
    })) satisfies FilterOption[],
    filters: {
      busId: filters.busId,
      dateFrom,
      dateTo,
      routeId: filters.routeId,
    },
    profitabilityByBus,
    profitabilityByRoute,
    routeOptions: (routes ?? []).map((route) => ({
      id: route.id,
      label: buildRouteLabel(route),
    })) satisfies FilterOption[],
    summary: {
      closureCount: filteredClosedRecords.length,
      differenceTotalUsd: round(
        filteredClosedRecords.reduce((total, record) => total + record.difference, 0),
      ),
      expensesUsd: round(
        filteredClosedRecords.reduce(
          (total, record) => total + (record.incomeUsd - record.calculatedNet),
          0,
        ),
      ),
      incomeUsd: round(
        filteredClosedRecords.reduce((total, record) => total + record.incomeUsd, 0),
      ),
      netUsd: round(
        filteredClosedRecords.reduce((total, record) => total + record.calculatedNet, 0),
      ),
    },
    weeklyClosures,
    monthlyClosures,
  };
}

export async function getIntelligenceData(filters: IntelligenceFilters) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, -89);
  const dateTo = filters.dateTo ?? today;

  const [
    { data: historyRecords },
    { data: visibleRecords },
    { data: buses },
    { data: routes },
    { data: profiles },
    { data: auditEntries },
  ] = await Promise.all([
    supabase
      .from("daily_records")
      .select(
        "id, bus_id, user_id, record_date, income_usd, calculated_net, difference, status, closed_at, created_at, updated_at",
      )
      .eq("status", "closed")
      .order("record_date", { ascending: false }),
    supabase
      .from("daily_records")
      .select(
        "id, bus_id, user_id, record_date, income_usd, calculated_net, difference, status, closed_at, created_at, updated_at",
      )
      .gte("record_date", dateFrom)
      .lte("record_date", dateTo)
      .order("record_date", { ascending: false }),
    supabase.from("buses").select("id, code, route_id, status").order("code"),
    supabase
      .from("routes")
      .select("id, name, origin, destination")
      .order("name"),
    supabase.from("profiles").select("id, name, role").order("name"),
    supabase
      .from("audit_log")
      .select("id, action, created_at, user_id, table_name")
      .eq("table_name", "daily_records")
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59.999Z`)
      .order("created_at", { ascending: false }),
  ]);

  const allClosedRecords = normalizeRecords(
    historyRecords ?? [],
    buses ?? [],
    profiles ?? [],
    routes ?? [],
  );
  const filteredRecords = filterRecords(
    normalizeRecords(visibleRecords ?? [], buses ?? [], profiles ?? [], routes ?? []),
    {
      ...filters,
      dateFrom,
      dateTo,
    },
  );
  const closedFilteredRecords = filteredRecords.filter(
    (record) => record.status === "closed",
  );
  const anomalyData = detectRouteIncomeAnomalies({
    historyRecords: allClosedRecords.map((record) => ({
      incomeUsd: record.incomeUsd,
      routeId: record.routeId,
      routeLabel: record.routeLabel,
    })),
    records: closedFilteredRecords.map((record) => ({
      busCode: record.busCode,
      difference: record.difference,
      id: record.id,
      incomeUsd: record.incomeUsd,
      recordDate: record.recordDate,
      routeId: record.routeId,
      routeLabel: record.routeLabel,
      userName: record.userName,
    })),
  });
  const confidenceScores = buildRegistrarConfidenceScores({
    auditEntries: (auditEntries ?? []).map((entry) => ({
      action: entry.action,
      createdAt: entry.created_at,
      userId: entry.user_id,
    })),
    profiles: (profiles ?? []).map((profile) => ({
      id: profile.id,
      name: profile.name,
      role: profile.role,
    })),
    records: filteredRecords.map((record) => ({
      closedAt: record.closedAt,
      createdAt: record.createdAt,
      difference: record.difference,
      userId: record.userId,
    })),
  }).filter((entry) => (filters.profileId ? entry.userId === filters.profileId : true));

  return {
    anomalyBaselines: anomalyData.baselines,
    anomalies: anomalyData.results,
    busOptions: (buses ?? []).map((bus) => ({
      id: bus.id,
      label: bus.code,
    })) satisfies FilterOption[],
    confidenceFormula: CONFIDENCE_SCORE_FORMULA,
    confidenceScores,
    filters: {
      busId: filters.busId,
      dateFrom,
      dateTo,
      profileId: filters.profileId,
      routeId: filters.routeId,
    },
    profileOptions: (profiles ?? [])
      .filter((profile) => profile.role === "registrador")
      .map((profile) => ({
        id: profile.id,
        label: profile.name,
      })) satisfies FilterOption[],
    routeOptions: (routes ?? []).map((route) => ({
      id: route.id,
      label: buildRouteLabel(route),
    })) satisfies FilterOption[],
    summary: {
      anomaliesDetected: anomalyData.results.filter((entry) => entry.isAnomaly).length,
      averageConfidence:
        confidenceScores.length === 0
          ? 0
          : Math.round(
              confidenceScores.reduce((total, entry) => total + entry.score, 0) /
                confidenceScores.length,
            ),
      evaluatedRegistrars: confidenceScores.length,
      routesWithEnoughHistory: anomalyData.baselines.filter(
        (entry) => entry.observationCount >= 5 && entry.standardDeviationUsd >= 0.01,
      ).length,
    },
  };
}

function csvEscape(value: string | number | null | undefined) {
  const normalized = value == null ? "" : String(value);
  if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
    return `"${normalized.replaceAll("\"", "\"\"")}"`;
  }
  return normalized;
}

export function buildReportCsv(options: {
  dateFrom: string;
  dateTo: string;
  rows: ConsolidatedClosureRow[] | ProfitabilityReportRow[];
  scope: "bus" | "monthly" | "route" | "weekly";
}) {
  const headerPrefix = `Reporte ${options.scope},${options.dateFrom},${options.dateTo}`;
  const rows =
    options.scope === "bus" || options.scope === "route"
      ? [
          "entidad,cierres,ingreso_usd,gastos_usd,neto_usd,diferencia_usd",
          ...(options.rows as ProfitabilityReportRow[]).map((row) =>
            [
              csvEscape(row.entityLabel),
              row.closureCount,
              row.incomeUsd.toFixed(2),
              row.expensesUsd.toFixed(2),
              row.netUsd.toFixed(2),
              row.differenceTotalUsd.toFixed(2),
            ].join(","),
          ),
        ]
      : [
          "periodo,cierres,buses,rutas,ingreso_usd,gastos_usd,neto_usd,diferencia_usd",
          ...(options.rows as ConsolidatedClosureRow[]).map((row) =>
            [
              csvEscape(
                options.scope === "weekly"
                  ? `${formatDateLabel(row.periodKey)} - ${formatDateLabel(
                      shiftDateString(row.periodKey, 6),
                    )}`
                  : formatMonthLabel(row.periodKey),
              ),
              row.closureCount,
              row.busCount,
              row.routeCount,
              row.totalIncomeUsd.toFixed(2),
              row.totalExpensesUsd.toFixed(2),
              row.totalNetUsd.toFixed(2),
              row.differenceTotalUsd.toFixed(2),
            ].join(","),
          ),
        ];

  return [headerPrefix, ...rows].join("\n");
}
