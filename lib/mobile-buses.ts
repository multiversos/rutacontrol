import "server-only";

import { getAlertsData } from "@/lib/alerts";
import type {
  BusProfileDebtItem,
  BusProfileOperationalRecord,
  BusProfileSummary,
} from "@/lib/bus-profile";
import { getBusProfileData } from "@/lib/bus-profile";
import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import { isDemoBus } from "@/lib/demo-data";
import { getCalendarPeriod, isDateInRange, type CalendarPeriodView } from "@/lib/periods";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type MobileBusCatalogStatusFilter = "all" | Tables<"buses">["status"];

type MobileBusLatestRecord = {
  id: string;
  recordDate: string;
  status: Tables<"daily_records">["status"];
  updatedAt: string;
};

export type MobileBusCatalogItem = {
  code: string;
  id: string;
  lastRecord: MobileBusLatestRecord | null;
  photoUrl: string | null;
  plate: string;
  status: Tables<"buses">["status"];
  updatedAt: string;
};

export type MobileBusProfileMovement = {
  description: string;
  id: string;
  kind: "alert" | "debt" | "payment" | "record";
  meta: string;
  occurredAt: string;
  title: string;
  tone: "default" | "danger" | "success" | "warning";
};

function toNumber(value: number | string | null | undefined) {
  const normalized =
    typeof value === "number"
      ? value
      : Number.parseFloat(value == null || value === "" ? "0" : value);

  return Number.isFinite(normalized) ? normalized : 0;
}

function summarizeOperations(records: BusProfileOperationalRecord[]) {
  return records.reduce(
    (accumulator, record) => ({
      closedRecordCount:
        accumulator.closedRecordCount + (record.status === "closed" ? 1 : 0),
      daysOperated: accumulator.recordDates.add(record.recordDate).size,
      differenceUsd: accumulator.differenceUsd + toNumber(record.difference),
      expenseUsd: accumulator.expenseUsd + record.expenseUsd,
      incomeUsd: accumulator.incomeUsd + toNumber(record.incomeUsd),
      lastMovementAt:
        accumulator.lastMovementAt && accumulator.lastMovementAt > record.updatedAt
          ? accumulator.lastMovementAt
          : record.updatedAt,
      netUsd: accumulator.netUsd + toNumber(record.netUsd),
      recordCount: accumulator.recordCount + 1,
      recordDates: accumulator.recordDates,
    }),
    {
      closedRecordCount: 0,
      daysOperated: 0,
      differenceUsd: 0,
      expenseUsd: 0,
      incomeUsd: 0,
      lastMovementAt: null as string | null,
      netUsd: 0,
      recordCount: 0,
      recordDates: new Set<string>(),
    },
  );
}

function buildDebtActivitySummary(debts: BusProfileDebtItem[], start: string, end: string) {
  const periodDebts = debts.filter((debt) =>
    isDateInRange(debt.createdAt.slice(0, 10), start, end),
  );
  const periodPayments = debts.flatMap((debt) =>
    debt.payments
      .filter((payment) => isDateInRange(payment.paymentDate, start, end))
      .map((payment) => ({
        amountUsd: payment.amountUsd,
        createdAt: payment.createdAt,
        debtId: debt.id,
        id: payment.id,
        notes: payment.notes,
        paymentDate: payment.paymentDate,
        sourceLabel: debt.sourceLabel,
        title: debt.creditor,
      })),
  );

  return {
    debtAmountUsd: periodDebts.reduce(
      (total, debt) => total + toNumber(debt.amountUsd),
      0,
    ),
    debtCount: periodDebts.length,
    paymentAmountUsd: periodPayments.reduce(
      (total, payment) => total + toNumber(payment.amountUsd),
      0,
    ),
    paymentCount: periodPayments.length,
    periodDebts,
    periodPayments,
  };
}

export async function getMobileBusCatalog(filters: {
  query?: string;
  status?: MobileBusCatalogStatusFilter;
}) {
  const supabase = await createClient();
  const { data: buses, error } = await supabase
    .from("buses")
    .select("id, code, plate, photo_path, status, updated_at")
    .order("code");

  if (error) {
    throw error;
  }

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses);
  const busIds = visibleBuses.map((bus) => bus.id);
  const { data: dailyRecords, error: recordsError } =
    busIds.length > 0
      ? await supabase
          .from("daily_records")
          .select("id, bus_id, record_date, status, updated_at")
          .in("bus_id", busIds)
          .order("record_date", { ascending: false })
          .order("updated_at", { ascending: false })
      : { data: [], error: null };

  if (recordsError) {
    throw recordsError;
  }

  const latestRecordMap = new Map<string, MobileBusLatestRecord>();
  (dailyRecords ?? []).forEach((record) => {
    if (!latestRecordMap.has(record.bus_id)) {
      latestRecordMap.set(record.bus_id, {
        id: record.id,
        recordDate: record.record_date,
        status: record.status,
        updatedAt: record.updated_at,
      });
    }
  });

  const status = filters.status ?? "all";
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? "";
  const listedBuses = visibleBuses
    .filter((bus) => (status === "all" ? true : bus.status === status))
    .filter((bus) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${bus.code} ${bus.plate}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .map((bus) => ({
      code: bus.code,
      id: bus.id,
      lastRecord: latestRecordMap.get(bus.id) ?? null,
      photoUrl: photoMap.get(bus.id) ?? null,
      plate: bus.plate,
      status: bus.status,
      updatedAt: bus.updated_at,
    })) satisfies MobileBusCatalogItem[];

  return {
    buses: listedBuses,
    counts: {
      active: visibleBuses.filter((bus) => bus.status === "active").length,
      inactive: visibleBuses.filter((bus) => bus.status === "inactive").length,
      maintenance: visibleBuses.filter((bus) => bus.status === "maintenance").length,
    },
    filters: {
      query: filters.query?.trim() ?? "",
      status,
    },
    totalVisible: visibleBuses.length,
  };
}

export async function getMobileBusProfileViewData(options: {
  anchor?: string;
  busId: string;
  view: CalendarPeriodView;
}): Promise<{
  alerts: Awaited<ReturnType<typeof getAlertsData>>["alerts"];
  alertsReady: boolean;
  currentPeriodSummary: {
    closedRecordCount: number;
    daysOperated: number;
    differenceUsd: number;
    expenseUsd: number;
    incomeUsd: number;
    lastMovementAt: string | null;
    netUsd: number;
    recordCount: number;
  };
  debtActivity: {
    debtAmountUsd: number;
    debtCount: number;
    openBalanceUsd: number;
    paymentAmountUsd: number;
    paymentCount: number;
  };
  movements: MobileBusProfileMovement[];
  period: ReturnType<typeof getCalendarPeriod>;
  profile: {
    operationHistory: BusProfileOperationalRecord[];
    summary: BusProfileSummary;
  };
} | null> {
  const period = getCalendarPeriod(options.view, options.anchor);
  const [profile, alertsData] = await Promise.all([
    getBusProfileData(options.busId, {
      dateFrom: period.start,
      dateTo: period.end,
      recordStatus: "all",
    }),
    getAlertsData({
      busId: options.busId,
      dateFrom: period.start,
      dateTo: period.end,
      readState: "all",
      severity: "all",
    }),
  ]);

  if (!profile) {
    return null;
  }

  const currentPeriodSummary = summarizeOperations(profile.operationHistory);
  const debtActivity = buildDebtActivitySummary(
    profile.debtSummary.associatedDebts,
    period.start,
    period.end,
  );

  const movements = [
    ...profile.operationHistory.map((record) => ({
      description: `Ingreso ${record.incomeUsd} - Neto ${record.netUsd}`,
      id: record.id,
      kind: "record" as const,
      meta: `${record.status === "closed" ? "Cierre" : "Borrador"} - ${record.recordDate}`,
      occurredAt: record.updatedAt,
      title: `Registro diario ${record.recordDate}`,
      tone: record.status === "closed" ? ("success" as const) : ("warning" as const),
    })),
    ...alertsData.alerts.map((alert) => ({
      description: alert.message,
      id: alert.id,
      kind: "alert" as const,
      meta: `${alert.severity} - ${alert.profileName ?? "Sistema"}`,
      occurredAt: alert.createdAt,
      title: alert.busCode ? `Alerta ${alert.busCode}` : "Alerta del sistema",
      tone:
        alert.severity === "critical"
          ? ("danger" as const)
          : alert.severity === "warning"
            ? ("warning" as const)
            : ("default" as const),
    })),
    ...debtActivity.periodDebts.map((debt) => ({
      description: debt.description,
      id: debt.id,
      kind: "debt" as const,
      meta: `${debt.sourceLabel} - ${debt.amountUsd} USD`,
      occurredAt: debt.createdAt,
      title: `Deuda ${debt.creditor}`,
      tone: debt.status === "paid" ? ("success" as const) : ("warning" as const),
    })),
    ...debtActivity.periodPayments.map((payment) => ({
      description: payment.notes?.trim() || "Sin notas adicionales.",
      id: payment.id,
      kind: "payment" as const,
      meta: `${payment.sourceLabel} - ${payment.amountUsd} USD`,
      occurredAt: payment.createdAt,
      title: `Abono ${payment.title}`,
      tone: "success" as const,
    })),
  ]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 10);

  return {
    alerts: alertsData.alerts,
    alertsReady: alertsData.migrationReady,
    currentPeriodSummary: {
      closedRecordCount: currentPeriodSummary.closedRecordCount,
      daysOperated: currentPeriodSummary.recordDates.size,
      differenceUsd: currentPeriodSummary.differenceUsd,
      expenseUsd: currentPeriodSummary.expenseUsd,
      incomeUsd: currentPeriodSummary.incomeUsd,
      lastMovementAt: currentPeriodSummary.lastMovementAt,
      netUsd: currentPeriodSummary.netUsd,
      recordCount: currentPeriodSummary.recordCount,
    },
    debtActivity: {
      debtAmountUsd: debtActivity.debtAmountUsd,
      debtCount: debtActivity.debtCount,
      openBalanceUsd: profile.debtSummary.openBalanceUsd,
      paymentAmountUsd: debtActivity.paymentAmountUsd,
      paymentCount: debtActivity.paymentCount,
    },
    movements,
    period,
    profile: {
      operationHistory: profile.operationHistory,
      summary: profile.summary,
    },
  };
}
