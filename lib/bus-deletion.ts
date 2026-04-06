import "server-only";

import { createClient } from "@/lib/supabase/server";

type RelationCountKey =
  | "alertCount"
  | "auditCount"
  | "dailyRecordCount"
  | "maintenanceCount"
  | "repairCount";

export type BusDeletionGuard = {
  alertCount: number;
  auditCount: number;
  blockers: string[];
  canDelete: boolean;
  dailyRecordCount: number;
  maintenanceCount: number;
  repairCount: number;
};

function createEmptyGuard(): BusDeletionGuard {
  return {
    alertCount: 0,
    auditCount: 0,
    blockers: [],
    canDelete: true,
    dailyRecordCount: 0,
    maintenanceCount: 0,
    repairCount: 0,
  };
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildBlockers(guard: Omit<BusDeletionGuard, "blockers" | "canDelete">) {
  const blockers: string[] = [];

  if (guard.auditCount > 0) {
    blockers.push(
      pluralize(guard.auditCount, "entrada de auditoria", "entradas de auditoria"),
    );
  }

  if (guard.dailyRecordCount > 0) {
    blockers.push(
      pluralize(guard.dailyRecordCount, "registro diario", "registros diarios"),
    );
  }

  if (guard.repairCount > 0) {
    blockers.push(pluralize(guard.repairCount, "reparacion", "reparaciones"));
  }

  if (guard.maintenanceCount > 0) {
    blockers.push(
      pluralize(guard.maintenanceCount, "mantenimiento", "mantenimientos"),
    );
  }

  if (guard.alertCount > 0) {
    blockers.push(pluralize(guard.alertCount, "alerta", "alertas"));
  }

  return blockers;
}

function finalizeGuard(
  guard: Omit<BusDeletionGuard, "blockers" | "canDelete">,
): BusDeletionGuard {
  const blockers = buildBlockers(guard);

  return {
    ...guard,
    blockers,
    canDelete: blockers.length === 0,
  };
}

function incrementGuardCount(
  guards: Map<string, Omit<BusDeletionGuard, "blockers" | "canDelete">>,
  busId: string,
  key: RelationCountKey,
) {
  const current = guards.get(busId);

  if (!current) {
    return;
  }

  current[key] += 1;
}

export async function getBusDeletionGuardMap(busIds: string[]) {
  const normalizedBusIds = Array.from(
    new Set(busIds.map((busId) => busId.trim()).filter(Boolean)),
  );

  const baseMap = new Map<
    string,
    Omit<BusDeletionGuard, "blockers" | "canDelete">
  >(
    normalizedBusIds.map((busId) => [
      busId,
      {
        alertCount: 0,
        auditCount: 0,
        dailyRecordCount: 0,
        maintenanceCount: 0,
        repairCount: 0,
      },
    ]),
  );

  if (normalizedBusIds.length === 0) {
    return new Map<string, BusDeletionGuard>();
  }

  const supabase = await createClient();
  const [
    { data: dailyRecords, error: dailyRecordsError },
    { data: repairs, error: repairsError },
    { data: maintenanceRecords, error: maintenanceError },
    { data: alerts, error: alertsError },
    { data: auditEntries, error: auditEntriesError },
  ] = await Promise.all([
    supabase.from("daily_records").select("bus_id").in("bus_id", normalizedBusIds),
    supabase.from("repairs").select("bus_id").in("bus_id", normalizedBusIds),
    supabase
      .from("maintenance_records")
      .select("bus_id")
      .in("bus_id", normalizedBusIds),
    supabase.from("alerts").select("bus_id").in("bus_id", normalizedBusIds),
    supabase
      .from("audit_log")
      .select("record_id")
      .eq("table_name", "buses")
      .in("record_id", normalizedBusIds),
  ]);

  if (dailyRecordsError) {
    throw dailyRecordsError;
  }

  if (repairsError) {
    throw repairsError;
  }

  if (maintenanceError) {
    throw maintenanceError;
  }

  if (alertsError) {
    throw alertsError;
  }

  if (auditEntriesError) {
    throw auditEntriesError;
  }

  dailyRecords?.forEach((record) => {
    incrementGuardCount(baseMap, record.bus_id, "dailyRecordCount");
  });

  repairs?.forEach((repair) => {
    incrementGuardCount(baseMap, repair.bus_id, "repairCount");
  });

  maintenanceRecords?.forEach((record) => {
    incrementGuardCount(baseMap, record.bus_id, "maintenanceCount");
  });

  alerts?.forEach((alert) => {
    if (alert.bus_id) {
      incrementGuardCount(baseMap, alert.bus_id, "alertCount");
    }
  });

  auditEntries?.forEach((entry) => {
    incrementGuardCount(baseMap, entry.record_id, "auditCount");
  });

  return new Map(
    Array.from(baseMap.entries()).map(([busId, guard]) => [
      busId,
      finalizeGuard(guard),
    ]),
  );
}

export async function getBusDeletionGuard(busId: string) {
  const normalizedBusId = busId.trim();

  if (!normalizedBusId) {
    return createEmptyGuard();
  }

  const guardMap = await getBusDeletionGuardMap([normalizedBusId]);

  return guardMap.get(normalizedBusId) ?? createEmptyGuard();
}
