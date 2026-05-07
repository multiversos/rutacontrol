import "server-only";

import { getAlertsData, type AlertListItem } from "@/lib/alerts";
import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import { isDemoBus, isOperationalRecordDate } from "@/lib/demo-data";
import {
  formatCurrency,
  getBusinessTodayDate,
  isNonZeroAmount,
  shiftDateString,
} from "@/lib/formatters";
import { getMaintenanceData, type MaintenanceCycleItem, type MaintenanceRecordListItem } from "@/lib/maintenance";
import {
  MAINTENANCE_POSITION_LABELS,
  MAINTENANCE_STATUS_LABELS,
} from "@/lib/maintenance-config";
import { getRepairsData, type RepairListItem } from "@/lib/repairs";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const HISTORY_LOOKBACK_DAYS = -120;
const LONG_HISTORY_LOOKBACK_DAYS = -3650;

type DailyRecordStatusFilter = "all" | Tables<"daily_records">["status"];

type DebtStatus = Tables<"debts">["status"];

type BusRow = Pick<
  Tables<"buses">,
  | "code"
  | "created_at"
  | "id"
  | "photo_path"
  | "plate"
  | "route_id"
  | "status"
  | "updated_at"
>;

type RouteRow = Pick<
  Tables<"routes">,
  "active" | "destination" | "id" | "name" | "origin"
>;

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

type ProfileRow = Pick<Tables<"profiles">, "id" | "name">;

type DebtRow = Pick<
  Tables<"debts">,
  | "amount_paid_usd"
  | "amount_usd"
  | "balance_due_usd"
  | "bus_id"
  | "created_at"
  | "creditor"
  | "daily_record_id"
  | "description"
  | "due_date"
  | "id"
  | "status"
>;

type DebtPaymentRow = Pick<
  Tables<"debt_payments">,
  "amount_usd" | "created_at" | "debt_id" | "id" | "notes" | "payment_date"
>;

type BusProfileFilters = {
  dateFrom?: string;
  dateTo?: string;
  recordStatus?: DailyRecordStatusFilter;
};

export type BusProfileOperationalRecord = {
  closedAt: string | null;
  createdAt: string;
  difference: string;
  expenseUsd: number;
  id: string;
  incomeUsd: string;
  netUsd: string;
  recordDate: string;
  status: Tables<"daily_records">["status"];
  updatedAt: string;
  userName: string | null;
};

export type BusProfileDebtPayment = {
  amountUsd: string;
  createdAt: string;
  id: string;
  notes: string | null;
  paymentDate: string;
};

export type BusProfileDebtItem = {
  amountPaidUsd: string;
  amountUsd: string;
  balanceDueUsd: string;
  createdAt: string;
  creditor: string;
  description: string;
  dueDate: string | null;
  id: string;
  paymentCount: number;
  payments: BusProfileDebtPayment[];
  sourceLabel: string;
  status: DebtStatus;
};

export type BusProfileComponentEntry = {
  componentLabel: string;
  costUsd: string;
  currentStatus: MaintenanceCycleItem["status"] | null;
  description: string;
  expectedWorkDays: number | null;
  id: string;
  notes: string | null;
  previousCycleWorkDays: number | null;
  provider: string;
  serviceDate: string;
  workedDays: number | null;
};

export type BusProfileComponentSection = {
  entries: BusProfileComponentEntry[];
  position: keyof typeof MAINTENANCE_POSITION_LABELS;
  positionLabel: string;
};

export type BusProfileNextMaintenance = {
  componentLabel: string;
  expectedWorkDays: number;
  maintenanceRecordId: string;
  provider: string;
  remainingWorkDays: number;
  serviceDate: string;
  status: MaintenanceCycleItem["status"];
  workedDays: number;
};

export type BusProfileParkedEstimate = {
  basis: string;
  baseDate: string;
  days: number;
};

export type BusProfileSummary = {
  bus: BusRow;
  route: RouteRow | null;
  routeLabel: string;
  routeStatusLabel: string;
  photoUrl: string | null;
  lastOperationalRecord: BusProfileOperationalRecord | null;
  nextMaintenance: BusProfileNextMaintenance | null;
  parkedEstimate: BusProfileParkedEstimate | null;
  pendingDebtUsd: number;
};

export type BusProfileFinancialSummary = {
  averageIncomeUsd: number;
  averageNetUsd: number;
  closedRecordCount: number;
  differenceRecords: number;
  expenseUsd: number;
  incomeUsd: number;
  lastWorkedDate: string | null;
  netUsd: number;
  openDebtUsd: number;
};

export type BusProfilePeriodSummary = {
  closedRecordCount: number;
  daysOperated: number;
  differenceUsd: number;
  expenseUsd: number;
  incomeUsd: number;
  netUsd: number;
  periodEnd: string;
  periodLabel: string;
  periodStart: string;
  recordCount: number;
};

export type BusProfileKpi = {
  helper: string;
  label: string;
  tone?: "default" | "danger" | "success" | "warning";
  value: string;
};

export type BusProfileData = {
  alerts: AlertListItem[];
  debtSummary: {
    associatedDebts: BusProfileDebtItem[];
    openBalanceUsd: number;
  };
  filters: {
    dateFrom: string;
    dateTo: string;
    recordStatus: DailyRecordStatusFilter;
  };
  financialSummary: BusProfileFinancialSummary;
  kpis: BusProfileKpi[];
  maintenance: {
    componentHistory: BusProfileComponentSection[];
    currentCycles: MaintenanceCycleItem[];
    maintenanceRecords: MaintenanceRecordListItem[];
  };
  periodSummaries: {
    monthly: BusProfilePeriodSummary[];
    weekly: BusProfilePeriodSummary[];
  };
  operationHistory: BusProfileOperationalRecord[];
  repairs: {
    nextServiceSuggestion: {
      dueDate: string | null;
      notes: string | null;
      repairDate: string | null;
    } | null;
    repairs: RepairListItem[];
  };
  summary: BusProfileSummary;
};

function toNumber(value: number | string | null | undefined) {
  const normalized =
    typeof value === "number"
      ? value
      : Number.parseFloat(value === "" || value == null ? "0" : value);

  return Number.isFinite(normalized) ? normalized : 0;
}

function differenceInDays(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  return Math.max(
    0,
    Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function buildRouteLabel(route: RouteRow | null) {
  if (!route) {
    return "Ruta no disponible";
  }

  const fixedRouteLabel = `${route.origin} <-> ${route.destination}`;
  return route.name === fixedRouteLabel
    ? fixedRouteLabel
    : `${route.name} · ${fixedRouteLabel}`;
}

function getRouteStatusLabel(route: RouteRow | null) {
  if (!route) {
    return "Sin ruta";
  }

  return route.active ? "Ruta operativa" : "Ruta inactiva";
}

function parseUtcDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(dateString: string) {
  const date = parseUtcDate(dateString);
  const weekday = date.getUTCDay();
  const offset = (weekday + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);

  return date;
}

function getWeekEnd(weekStart: Date) {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + 6);

  return date;
}

function getMonthStart(dateString: string) {
  const date = parseUtcDate(dateString);
  date.setUTCDate(1);

  return date;
}

function getMonthEnd(monthStart: Date) {
  const date = new Date(monthStart);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);

  return date;
}

function formatShortMonthDay(dateString: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(parseUtcDate(dateString))
    .replace(".", "");
}

function formatDayNumber(dateString: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(parseUtcDate(dateString));
}

function formatShortMonthYear(dateString: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  })
    .format(parseUtcDate(dateString))
    .replace(".", "");
}

function formatMonthYearLabel(dateString: string) {
  const label = new Intl.DateTimeFormat("es-VE", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(parseUtcDate(dateString));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildWeeklyLabel(periodStart: string, periodEnd: string) {
  const startDate = parseUtcDate(periodStart);
  const endDate = parseUtcDate(periodEnd);
  const sameMonth =
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCFullYear() === endDate.getUTCFullYear();
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();

  if (sameMonth) {
    return `Semana del lun ${formatDayNumber(periodStart)} al dom ${formatShortMonthDay(periodEnd)} ${endDate.getUTCFullYear()}`;
  }

  if (sameYear) {
    return `Semana del lun ${formatShortMonthDay(periodStart)} al dom ${formatShortMonthDay(periodEnd)} ${endDate.getUTCFullYear()}`;
  }

  return `Semana del lun ${formatShortMonthYear(periodStart)} al dom ${formatShortMonthYear(periodEnd)}`;
}

function buildPeriodSummaries(
  records: BusProfileOperationalRecord[],
  period: "month" | "week",
) {
  const groupedPeriods = new Map<
    string,
    Omit<BusProfilePeriodSummary, "daysOperated" | "periodLabel"> & {
      recordDates: Set<string>;
    }
  >();

  records.forEach((record) => {
    const periodStartDate =
      period === "week"
        ? getWeekStart(record.recordDate)
        : getMonthStart(record.recordDate);
    const periodEndDate =
      period === "week"
        ? getWeekEnd(periodStartDate)
        : getMonthEnd(periodStartDate);
    const periodStart = toIsoDate(periodStartDate);
    const periodEnd = toIsoDate(periodEndDate);
    const currentPeriod = groupedPeriods.get(periodStart) ?? {
      closedRecordCount: 0,
      differenceUsd: 0,
      expenseUsd: 0,
      incomeUsd: 0,
      netUsd: 0,
      periodEnd,
      periodStart,
      recordCount: 0,
      recordDates: new Set<string>(),
    };

    currentPeriod.closedRecordCount += record.status === "closed" ? 1 : 0;
    currentPeriod.differenceUsd += toNumber(record.difference);
    currentPeriod.expenseUsd += record.expenseUsd;
    currentPeriod.incomeUsd += toNumber(record.incomeUsd);
    currentPeriod.netUsd += toNumber(record.netUsd);
    currentPeriod.recordCount += 1;
    currentPeriod.recordDates.add(record.recordDate);

    groupedPeriods.set(periodStart, currentPeriod);
  });

  return Array.from(groupedPeriods.values())
    .map((summary) => ({
      closedRecordCount: summary.closedRecordCount,
      daysOperated: summary.recordDates.size,
      differenceUsd: summary.differenceUsd,
      expenseUsd: summary.expenseUsd,
      incomeUsd: summary.incomeUsd,
      netUsd: summary.netUsd,
      periodEnd: summary.periodEnd,
      periodLabel:
        period === "week"
          ? buildWeeklyLabel(summary.periodStart, summary.periodEnd)
          : formatMonthYearLabel(summary.periodStart),
      periodStart: summary.periodStart,
      recordCount: summary.recordCount,
    }))
    .sort((left, right) => right.periodStart.localeCompare(left.periodStart));
}

function getNextMaintenance(cycles: MaintenanceCycleItem[]) {
  if (cycles.length === 0) {
    return null;
  }

  const severityRank: Record<MaintenanceCycleItem["status"], number> = {
    overdue: 0,
    due_soon: 1,
    up_to_date: 2,
  };

  const selectedCycle = [...cycles].sort((left, right) => {
    const rankDifference =
      severityRank[left.status] - severityRank[right.status];

    if (rankDifference !== 0) {
      return rankDifference;
    }

    if (left.remainingWorkDays !== right.remainingWorkDays) {
      return left.remainingWorkDays - right.remainingWorkDays;
    }

    return left.serviceDate.localeCompare(right.serviceDate);
  })[0];

  if (!selectedCycle) {
    return null;
  }

  return {
    componentLabel: selectedCycle.componentLabel,
    expectedWorkDays: selectedCycle.expectedWorkDays,
    maintenanceRecordId: selectedCycle.maintenanceRecordId,
    provider: selectedCycle.provider,
    remainingWorkDays: selectedCycle.remainingWorkDays,
    serviceDate: selectedCycle.serviceDate,
    status: selectedCycle.status,
    workedDays: selectedCycle.workedDays,
  } satisfies BusProfileNextMaintenance;
}

function getParkedEstimate(
  bus: BusRow,
  latestRepair: RepairListItem | null,
  latestMaintenance: MaintenanceRecordListItem | null,
  today: string,
) {
  if (bus.status !== "maintenance") {
    return null;
  }

  const baseDate =
    latestRepair?.repairDate ??
    latestMaintenance?.serviceDate ??
    bus.updated_at.slice(0, 10);
  const basis = latestRepair
    ? "Ultima reparacion registrada"
    : latestMaintenance
      ? "Ultimo mantenimiento registrado"
      : "Ultima actualizacion del estado del bus";

  return {
    basis,
    baseDate,
    days: differenceInDays(baseDate, today),
  } satisfies BusProfileParkedEstimate;
}

function buildOperationRecord(
  record: DailyRecordRow,
  profileMap: Map<string, string>,
) {
  const incomeUsd = toNumber(record.income_usd);
  const netUsd = toNumber(record.calculated_net);

  return {
    closedAt: record.closed_at,
    createdAt: record.created_at,
    difference: record.difference,
    expenseUsd: Math.max(incomeUsd - netUsd, 0),
    id: record.id,
    incomeUsd: record.income_usd ?? "0.00",
    netUsd: record.calculated_net,
    recordDate: record.record_date,
    status: record.status,
    updatedAt: record.updated_at,
    userName: profileMap.get(record.user_id) ?? null,
  } satisfies BusProfileOperationalRecord;
}

function buildDebtSourceMaps(
  operationHistory: BusProfileOperationalRecord[],
  maintenanceRecords: MaintenanceRecordListItem[],
) {
  const recordLabelMap = new Map(
    operationHistory.map((record) => [
      record.id,
      `Registro diario · ${record.recordDate}`,
    ]),
  );
  const maintenanceLabelMap = new Map(
    maintenanceRecords
      .filter((record) => record.debt?.id)
      .map((record) => [
        record.debt!.id,
        `Mantenimiento · ${record.description}`,
      ]),
  );

  return {
    maintenanceLabelMap,
    recordLabelMap,
  };
}

function buildComponentHistory(records: MaintenanceRecordListItem[]) {
  const groupedEntries = new Map<
    keyof typeof MAINTENANCE_POSITION_LABELS,
    BusProfileComponentEntry[]
  >();

  records.forEach((record) => {
    record.items.forEach((item) => {
      if (!item.componentPosition) {
        return;
      }

      const position = item.componentPosition as keyof typeof MAINTENANCE_POSITION_LABELS;
      const currentEntries = groupedEntries.get(position) ?? [];

      currentEntries.push({
        componentLabel: item.componentLabel,
        costUsd: item.costUsd,
        currentStatus: item.currentCycle?.status ?? null,
        description: record.description,
        expectedWorkDays: item.expectedWorkDays,
        id: item.id,
        notes: item.notes,
        previousCycleWorkDays: item.previousCycleWorkDays,
        provider: record.provider,
        serviceDate: record.serviceDate,
        workedDays: item.currentCycle?.workedDays ?? null,
      });

      groupedEntries.set(position, currentEntries);
    });
  });

  return Array.from(groupedEntries.entries())
    .map(([position, entries]) => ({
      entries: entries.sort((left, right) =>
        right.serviceDate.localeCompare(left.serviceDate),
      ),
      position,
      positionLabel: MAINTENANCE_POSITION_LABELS[position],
    }))
    .sort((left, right) => left.positionLabel.localeCompare(right.positionLabel));
}

export async function getBusProfileData(
  busId: string,
  filters: BusProfileFilters,
): Promise<BusProfileData | null> {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, HISTORY_LOOKBACK_DAYS);
  const dateTo = filters.dateTo ?? today;
  const recordStatus = filters.recordStatus ?? "all";
  const longHistoryFrom = shiftDateString(today, LONG_HISTORY_LOOKBACK_DAYS);

  const { data: bus } = await supabase
    .from("buses")
    .select("id, code, plate, photo_path, route_id, status, created_at, updated_at")
    .eq("id", busId)
    .maybeSingle();

  if (!bus) {
    return null;
  }

  if (isDemoBus(bus)) {
    return null;
  }

  const [
    { data: route },
    { data: dailyRecords },
    maintenanceData,
    repairsData,
    alertsData,
    photoMap,
  ] = await Promise.all([
    supabase
      .from("routes")
      .select("id, name, origin, destination, active")
      .eq("id", bus.route_id)
      .maybeSingle(),
    supabase
      .from("daily_records")
      .select(
        "id, bus_id, record_date, income_usd, calculated_net, difference, status, closed_at, user_id, created_at, updated_at",
      )
      .eq("bus_id", busId)
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false }),
    getMaintenanceData({
      busId,
      dateFrom: longHistoryFrom,
      dateTo: today,
      status: "all",
    }),
    getRepairsData({
      busId,
      dateFrom: longHistoryFrom,
      dateTo: today,
    }),
    getAlertsData({
      busId,
      dateFrom: shiftDateString(today, -90),
      dateTo: today,
      readState: "all",
      severity: "all",
    }),
    getBusPhotoUrlMap(supabase, [{ id: busId, photo_path: bus.photo_path }]),
  ]);

  const userIds = Array.from(
    new Set((dailyRecords ?? []).map((record) => record.user_id)),
  );
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", userIds)
      : { data: [] as ProfileRow[] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
  const allOperationRecords = (dailyRecords ?? []).map((record) =>
    buildOperationRecord(record, profileMap),
  ).filter((record) => isOperationalRecordDate(record.recordDate, today));

  const operationHistory = allOperationRecords.filter((record) => {
    if (record.recordDate < dateFrom || record.recordDate > dateTo) {
      return false;
    }

    if (recordStatus !== "all" && record.status !== recordStatus) {
      return false;
    }

    return true;
  });
  const weeklySummary = buildPeriodSummaries(operationHistory, "week");
  const monthlySummary = buildPeriodSummaries(operationHistory, "month");

  const closedRecords = allOperationRecords.filter((record) => record.status === "closed");
  const recentWorkedDays = closedRecords.filter(
    (record) => record.recordDate >= shiftDateString(today, -29),
  ).length;

  const { maintenanceLabelMap, recordLabelMap } = buildDebtSourceMaps(
    allOperationRecords,
    maintenanceData.maintenanceRecords,
  );
  const maintenanceDebtIds = Array.from(maintenanceLabelMap.keys());
  const recordIds = allOperationRecords.map((record) => record.id);

  const [{ data: dailyDebts }, { data: maintenanceDebts }, { data: directBusDebts }] =
    await Promise.all([
    recordIds.length > 0
      ? supabase
          .from("debts")
          .select(
            "id, creditor, description, amount_usd, amount_paid_usd, balance_due_usd, status, bus_id, daily_record_id, due_date, created_at",
          )
          .in("daily_record_id", recordIds)
      : Promise.resolve({ data: [] as DebtRow[] }),
    maintenanceDebtIds.length > 0
      ? supabase
          .from("debts")
          .select(
            "id, creditor, description, amount_usd, amount_paid_usd, balance_due_usd, status, bus_id, daily_record_id, due_date, created_at",
          )
          .in("id", maintenanceDebtIds)
      : Promise.resolve({ data: [] as DebtRow[] }),
    supabase
      .from("debts")
      .select(
        "id, creditor, description, amount_usd, amount_paid_usd, balance_due_usd, status, bus_id, daily_record_id, due_date, created_at",
      )
      .eq("bus_id", bus.id),
  ]);

  const associatedDebtMap = new Map<string, DebtRow>();
  [...(dailyDebts ?? []), ...(maintenanceDebts ?? []), ...(directBusDebts ?? [])].forEach(
    (debt) => {
    associatedDebtMap.set(debt.id, debt);
    },
  );

  const associatedDebtIds = Array.from(associatedDebtMap.keys());
  const { data: debtPayments } =
    associatedDebtIds.length > 0
      ? await supabase
          .from("debt_payments")
          .select("id, debt_id, amount_usd, payment_date, notes, created_at")
          .in("debt_id", associatedDebtIds)
          .order("payment_date", { ascending: false })
          .order("created_at", { ascending: false })
      : { data: [] as DebtPaymentRow[] };

  const paymentsByDebtId = new Map<string, BusProfileDebtPayment[]>();
  (debtPayments ?? []).forEach((payment) => {
    const currentPayments = paymentsByDebtId.get(payment.debt_id) ?? [];
    currentPayments.push({
      amountUsd: payment.amount_usd,
      createdAt: payment.created_at,
      id: payment.id,
      notes: payment.notes,
      paymentDate: payment.payment_date,
    });
    paymentsByDebtId.set(payment.debt_id, currentPayments);
  });

  const associatedDebts = Array.from(associatedDebtMap.values())
    .map((debt) => ({
      amountPaidUsd: debt.amount_paid_usd,
      amountUsd: debt.amount_usd,
      balanceDueUsd: debt.balance_due_usd,
      createdAt: debt.created_at,
      creditor: debt.creditor,
      description: debt.description,
      dueDate: debt.due_date,
      id: debt.id,
      paymentCount: (paymentsByDebtId.get(debt.id) ?? []).length,
      payments: paymentsByDebtId.get(debt.id) ?? [],
      sourceLabel:
        maintenanceLabelMap.get(debt.id) ??
        (debt.daily_record_id
          ? recordLabelMap.get(debt.daily_record_id) ?? "Registro diario"
          : debt.bus_id
            ? "Bus asociado"
            : "Relacion manual"),
      status: debt.status,
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const financialSummary = closedRecords.reduce(
    (accumulator, record) => ({
      averageIncomeUsd: 0,
      averageNetUsd: 0,
      closedRecordCount: accumulator.closedRecordCount + 1,
      differenceRecords:
        accumulator.differenceRecords + Number(isNonZeroAmount(record.difference)),
      expenseUsd: accumulator.expenseUsd + record.expenseUsd,
      incomeUsd: accumulator.incomeUsd + toNumber(record.incomeUsd),
      lastWorkedDate: accumulator.lastWorkedDate ?? record.recordDate,
      netUsd: accumulator.netUsd + toNumber(record.netUsd),
      openDebtUsd: 0,
    }),
    {
      averageIncomeUsd: 0,
      averageNetUsd: 0,
      closedRecordCount: 0,
      differenceRecords: 0,
      expenseUsd: 0,
      incomeUsd: 0,
      lastWorkedDate: null as string | null,
      netUsd: 0,
      openDebtUsd: 0,
    },
  );

  const openDebtUsd = associatedDebts.reduce((total, debt) => {
    if (debt.status === "paid") {
      return total;
    }

    return total + toNumber(debt.balanceDueUsd);
  }, 0);

  financialSummary.openDebtUsd = openDebtUsd;
  financialSummary.averageIncomeUsd =
    financialSummary.closedRecordCount > 0
      ? financialSummary.incomeUsd / financialSummary.closedRecordCount
      : 0;
  financialSummary.averageNetUsd =
    financialSummary.closedRecordCount > 0
      ? financialSummary.netUsd / financialSummary.closedRecordCount
      : 0;

  const nextMaintenance = getNextMaintenance(maintenanceData.currentCycles);
  const parkedEstimate = getParkedEstimate(
    bus,
    repairsData.repairs[0] ?? null,
    maintenanceData.maintenanceRecords[0] ?? null,
    today,
  );

  const routeLabel = buildRouteLabel(route ?? null);
  const routeStatusLabel = getRouteStatusLabel(route ?? null);
  const componentHistory = buildComponentHistory(maintenanceData.maintenanceRecords);

  const nextRepairService =
    repairsData.suggestedServices.find((repair) => repair.busId === busId) ?? null;

  const kpis: BusProfileKpi[] = [
    {
      helper: "Suma historica de registros diarios cerrados del bus.",
      label: "Ingreso acumulado",
      value: formatCurrency(financialSummary.incomeUsd),
    },
    {
      helper: "Neto acumulado del bus despues de gastos operativos.",
      label: "Neto acumulado",
      tone: financialSummary.netUsd >= 0 ? "success" : "danger",
      value: formatCurrency(financialSummary.netUsd),
    },
    {
      helper: "Deuda abierta ligada al bus por operacion o mantenimiento.",
      label: "Deuda pendiente",
      tone: openDebtUsd > 0 ? "warning" : "success",
      value: formatCurrency(openDebtUsd),
    },
    {
      helper: "Ciclos de mantenimiento ya vencidos para esta unidad.",
      label: "Mantenimientos vencidos",
      tone:
        maintenanceData.currentCycles.filter((cycle) => cycle.status === "overdue")
          .length > 0
          ? "danger"
          : "success",
      value: String(
        maintenanceData.currentCycles.filter((cycle) => cycle.status === "overdue")
          .length,
      ),
    },
    {
      helper: "Dias trabajados acumulados en los ultimos 30 dias.",
      label: "Dias trabajados recientes",
      tone: recentWorkedDays > 0 ? "default" : "warning",
      value: String(recentWorkedDays),
    },
  ];

  if (nextMaintenance) {
    kpis.push({
      helper: `${MAINTENANCE_STATUS_LABELS[nextMaintenance.status]} · ${nextMaintenance.workedDays} de ${nextMaintenance.expectedWorkDays} dias.`,
      label: "Proximo mantenimiento",
      tone:
        nextMaintenance.status === "overdue"
          ? "danger"
          : nextMaintenance.status === "due_soon"
            ? "warning"
            : "success",
      value: nextMaintenance.componentLabel,
    });
  }

  if (parkedEstimate) {
    kpis.push({
      helper: `${parkedEstimate.basis} desde ${parkedEstimate.baseDate}.`,
      label: "Dias parado estimados",
      tone: parkedEstimate.days > 0 ? "warning" : "default",
      value: String(parkedEstimate.days),
    });
  }

  return {
    alerts: alertsData.alerts.slice(0, 10),
    debtSummary: {
      associatedDebts,
      openBalanceUsd: openDebtUsd,
    },
    filters: {
      dateFrom,
      dateTo,
      recordStatus,
    },
    financialSummary,
    kpis,
    maintenance: {
      componentHistory,
      currentCycles: maintenanceData.currentCycles,
      maintenanceRecords: maintenanceData.maintenanceRecords,
    },
    periodSummaries: {
      monthly: monthlySummary,
      weekly: weeklySummary,
    },
    operationHistory,
    repairs: {
      nextServiceSuggestion: nextRepairService
        ? {
            dueDate: nextRepairService.nextServiceDueDate,
            notes: nextRepairService.notes,
            repairDate: nextRepairService.repairDate,
          }
        : null,
      repairs: repairsData.repairs,
    },
    summary: {
      bus,
      lastOperationalRecord: allOperationRecords[0] ?? null,
      nextMaintenance,
      parkedEstimate,
      pendingDebtUsd: openDebtUsd,
      photoUrl: photoMap.get(busId) ?? null,
      route: route ?? null,
      routeLabel,
      routeStatusLabel,
    },
  };
}
