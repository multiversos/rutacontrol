import "server-only";

import type { Database, Enums, Tables } from "@/lib/supabase/database.types";
import { reconcileMaintenanceAlerts } from "@/lib/alerts";
import { isDemoBus } from "@/lib/demo-data";
import { getBusinessTodayDate, shiftDateString } from "@/lib/formatters";
import {
  MAINTENANCE_POSITION_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from "@/lib/maintenance-config";
import { createClient } from "@/lib/supabase/server";

export type MaintenanceStatusFilter = "all" | Enums<"maintenance_status">;

export type MaintenanceFilters = {
  busId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: MaintenanceStatusFilter;
};

export type MaintenanceCycleItem = {
  busCode: string;
  busId: string;
  componentLabel: string;
  componentPosition: Enums<"maintenance_component_position"> | null;
  debt: {
    balanceDueUsd: string;
    creditor: string;
    id: string;
    status: Tables<"debts">["status"];
  } | null;
  description: string;
  expectedWorkDays: number;
  maintenanceRecordId: string;
  maintenanceType: Enums<"maintenance_type">;
  previousCycleWorkDays: number | null;
  provider: string;
  remainingWorkDays: number;
  serviceDate: string;
  status: Enums<"maintenance_status">;
  totalCostUsd: string;
  workedDays: number;
};

export type MaintenanceHistoryItem = {
  componentLabel: string;
  componentPosition: Enums<"maintenance_component_position"> | null;
  costUsd: string;
  expectedWorkDays: number | null;
  id: string;
  notes: string | null;
  previousCycleWorkDays: number | null;
  currentCycle: MaintenanceCycleItem | null;
};

export type MaintenanceRecordListItem = {
  busCode: string;
  busId: string;
  createdAt: string;
  debt: MaintenanceCycleItem["debt"];
  description: string;
  expectedWorkDays: number | null;
  id: string;
  items: MaintenanceHistoryItem[];
  maintenanceType: Enums<"maintenance_type">;
  notes: string | null;
  previousCycleWorkDays: number | null;
  provider: string;
  serviceDate: string;
  totalCostUsd: string;
  currentCycle: MaintenanceCycleItem | null;
};

type CurrentMaintenanceCycleRow =
  Database["public"]["Functions"]["current_maintenance_cycles"]["Returns"][number];

function normalizeMaintenanceMigrationReady(errorCode?: string | null) {
  return !["42P01", "42883", "PGRST202", "PGRST205"].includes(errorCode ?? "");
}

function toNumber(value: number | string | null | undefined) {
  const normalized =
    typeof value === "number"
      ? value
      : Number.parseFloat(value === "" || value == null ? "0" : value);

  return Number.isFinite(normalized) ? normalized : 0;
}

function getCycleLabel(
  maintenanceType: Enums<"maintenance_type">,
  componentName?: string | null,
  componentPosition?: Enums<"maintenance_component_position"> | null,
) {
  if (componentPosition) {
    return `${MAINTENANCE_TYPE_LABELS[maintenanceType]} · ${MAINTENANCE_POSITION_LABELS[componentPosition]}`;
  }

  if (componentName?.trim()) {
    return `${MAINTENANCE_TYPE_LABELS[maintenanceType]} · ${componentName.trim()}`;
  }

  return MAINTENANCE_TYPE_LABELS[maintenanceType];
}

function normalizeCycle(
  cycle: CurrentMaintenanceCycleRow,
  busCodeMap: Map<string, string>,
  debtMap: Map<string, MaintenanceCycleItem["debt"]>,
): MaintenanceCycleItem {
  const expectedWorkDays = cycle.expected_work_days ?? 0;
  const workedDays = cycle.worked_days ?? 0;
  const remainingWorkDays = Math.max(expectedWorkDays - workedDays, 0);

  return {
    busCode: busCodeMap.get(cycle.bus_id) ?? cycle.bus_id,
    busId: cycle.bus_id,
    componentLabel: getCycleLabel(
      cycle.maintenance_type,
      cycle.component_name,
      cycle.component_position,
    ),
    componentPosition: cycle.component_position,
    debt: cycle.debt_id ? debtMap.get(cycle.debt_id) ?? null : null,
    description: cycle.description,
    expectedWorkDays,
    maintenanceRecordId: cycle.maintenance_record_id,
    maintenanceType: cycle.maintenance_type,
    previousCycleWorkDays: cycle.previous_cycle_work_days ?? null,
    provider: cycle.provider,
    remainingWorkDays,
    serviceDate: cycle.service_date,
    status: cycle.status,
    totalCostUsd: cycle.total_cost_usd,
    workedDays,
  };
}

export async function getMaintenanceData(filters: MaintenanceFilters) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, -119);
  const dateTo = filters.dateTo ?? today;
  const status = filters.status ?? "all";
  const busId = filters.busId;

  await reconcileMaintenanceAlerts(dateTo);

  let recordsQuery = supabase
    .from("maintenance_records")
    .select(
      "id, bus_id, maintenance_type, service_date, provider, description, total_cost_usd, expected_work_days, previous_cycle_work_days, debt_id, notes, created_at, debt:debts!maintenance_records_debt_id_fkey ( id, creditor, balance_due_usd, status ), maintenance_items ( id, component_name, component_position, cost_usd, expected_work_days, previous_cycle_work_days, notes, created_at )",
    )
    .gte("service_date", dateFrom)
    .lte("service_date", dateTo)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (busId) {
    recordsQuery = recordsQuery.eq("bus_id", busId);
  }

  const [
    { data: maintenanceRecords, error: recordsError },
    { data: buses },
    { data: cyclesData, error: cyclesError },
  ] = await Promise.all([
    recordsQuery,
    supabase.from("buses").select("id, code, status").order("code"),
    supabase.rpc("current_maintenance_cycles", {
      _record_date: dateTo,
    }),
  ]);

  const recordsMigrationReady = normalizeMaintenanceMigrationReady(recordsError?.code);
  const cyclesMigrationReady = normalizeMaintenanceMigrationReady(cyclesError?.code);
  const migrationReady = recordsMigrationReady && cyclesMigrationReady;

  if (recordsError && recordsMigrationReady) {
    throw recordsError;
  }

  if (cyclesError && cyclesMigrationReady) {
    throw cyclesError;
  }

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const visibleBusIds = new Set(visibleBuses.map((bus) => bus.id));
  const busCodeMap = new Map((buses ?? []).map((bus) => [bus.id, bus.code]));
  const debtMap = new Map<string, MaintenanceCycleItem["debt"]>();

  (maintenanceRecords ?? []).forEach((record) => {
    const debtRow = Array.isArray(record.debt) ? record.debt[0] : record.debt;

    if (!debtRow?.id) {
      return;
    }

    debtMap.set(debtRow.id, {
      balanceDueUsd: debtRow.balance_due_usd,
      creditor: debtRow.creditor,
      id: debtRow.id,
      status: debtRow.status,
    });
  });

  let currentCycles = (cyclesData ?? []).map((cycle) =>
    normalizeCycle(cycle, busCodeMap, debtMap),
  );

  if (busId) {
    currentCycles = currentCycles.filter((cycle) => cycle.busId === busId);
  }

  currentCycles = currentCycles.filter((cycle) => visibleBusIds.has(cycle.busId));

  if (status !== "all") {
    currentCycles = currentCycles.filter((cycle) => cycle.status === status);
  }

  const cycleByRecordId = new Map(
    currentCycles
      .filter((cycle) => cycle.componentPosition == null)
      .map((cycle) => [cycle.maintenanceRecordId, cycle] as const),
  );
  const cycleByItemId = new Map(
    (cyclesData ?? [])
      .filter((cycle) => cycle.maintenance_item_id)
      .map((cycle) => [
        cycle.maintenance_item_id!,
        normalizeCycle(cycle, busCodeMap, debtMap),
      ] as const),
  );

  const records = (maintenanceRecords ?? [])
    .filter((record) => visibleBusIds.has(record.bus_id))
    .map((record) => {
    const debtRow = Array.isArray(record.debt) ? record.debt[0] : record.debt;
    const debt =
      debtRow?.id != null
        ? {
            balanceDueUsd: debtRow.balance_due_usd,
            creditor: debtRow.creditor,
            id: debtRow.id,
            status: debtRow.status,
          }
        : null;

    const itemRows = Array.isArray(record.maintenance_items)
      ? record.maintenance_items
      : [];

    return {
      busCode: busCodeMap.get(record.bus_id) ?? record.bus_id,
      busId: record.bus_id,
      createdAt: record.created_at,
      debt,
      description: record.description,
      expectedWorkDays: record.expected_work_days ?? null,
      id: record.id,
      items: itemRows.map((item) => ({
        componentLabel: getCycleLabel(
          record.maintenance_type,
          item.component_name,
          item.component_position,
        ),
        componentPosition: item.component_position,
        costUsd: item.cost_usd,
        currentCycle: cycleByItemId.get(item.id) ?? null,
        expectedWorkDays: item.expected_work_days ?? null,
        id: item.id,
        notes: item.notes ?? null,
        previousCycleWorkDays: item.previous_cycle_work_days ?? null,
      })),
      maintenanceType: record.maintenance_type,
      notes: record.notes ?? null,
      previousCycleWorkDays: record.previous_cycle_work_days ?? null,
      provider: record.provider,
      serviceDate: record.service_date,
      totalCostUsd: record.total_cost_usd,
      currentCycle: cycleByRecordId.get(record.id) ?? null,
    } satisfies MaintenanceRecordListItem;
  });

  const visibleDebtBalance = records.reduce((total, record) => {
    if (!record.debt || record.debt.status === "paid") {
      return total;
    }

    return total + toNumber(record.debt.balanceDueUsd);
  }, 0);

  const historyByBus = Array.from(
    records.reduce((groups, record) => {
      const current = groups.get(record.busId) ?? {
        busCode: record.busCode,
        busId: record.busId,
        dueSoonCount: 0,
        overdueCount: 0,
        recordCount: 0,
      };

      current.recordCount += 1;
      current.dueSoonCount += Number(
        record.currentCycle?.status === "due_soon",
      );
      current.overdueCount += Number(
        record.currentCycle?.status === "overdue",
      );
      groups.set(record.busId, current);
      return groups;
    }, new Map<string, { busId: string; busCode: string; dueSoonCount: number; overdueCount: number; recordCount: number }>()),
  ).map(([, value]) => value);

  return {
    busOptions: visibleBuses.map((bus) => ({
      code: bus.code,
      id: bus.id,
      status: bus.status,
    })),
    currentCycles,
    filters: {
      busId,
      dateFrom,
      dateTo,
      status,
    },
    historyByBus: historyByBus.sort((left, right) =>
      left.busCode.localeCompare(right.busCode),
    ),
    maintenanceRecords: records,
    migrationReady,
    summary: {
      dueSoonCount: currentCycles.filter((cycle) => cycle.status === "due_soon").length,
      openDebtUsd: visibleDebtBalance,
      overdueCount: currentCycles.filter((cycle) => cycle.status === "overdue").length,
      trackedBuses: new Set(currentCycles.map((cycle) => cycle.busId)).size,
      visibleRecords: records.length,
    },
  };
}
