import "server-only";

import { createClient } from "@/lib/supabase/server";

type RelationCountKey =
  | "alertCount"
  | "auditCount"
  | "debtCount"
  | "debtPaymentCount"
  | "dailyRecordCount"
  | "expenseCount"
  | "maintenanceItemCount"
  | "maintenanceCount"
  | "repairAttachmentCount"
  | "repairCount";

export type BusDeletionGuard = {
  alertCount: number;
  auditCount: number;
  blockers: string[];
  canDelete: boolean;
  debtCount: number;
  debtPaymentCount: number;
  dailyRecordCount: number;
  expenseCount: number;
  maintenanceItemCount: number;
  maintenanceCount: number;
  repairAttachmentCount: number;
  repairCount: number;
};

function createEmptyGuard(): BusDeletionGuard {
  return {
    alertCount: 0,
    auditCount: 0,
    blockers: [],
    canDelete: true,
    debtCount: 0,
    debtPaymentCount: 0,
    dailyRecordCount: 0,
    expenseCount: 0,
    maintenanceItemCount: 0,
    maintenanceCount: 0,
    repairAttachmentCount: 0,
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

  if (guard.expenseCount > 0) {
    blockers.push(pluralize(guard.expenseCount, "gasto", "gastos"));
  }

  if (guard.debtCount > 0) {
    blockers.push(pluralize(guard.debtCount, "deuda", "deudas"));
  }

  if (guard.debtPaymentCount > 0) {
    blockers.push(
      pluralize(guard.debtPaymentCount, "pago parcial", "pagos parciales"),
    );
  }

  if (guard.repairCount > 0) {
    blockers.push(pluralize(guard.repairCount, "reparacion", "reparaciones"));
  }

  if (guard.repairAttachmentCount > 0) {
    blockers.push(
      pluralize(
        guard.repairAttachmentCount,
        "comprobante de reparacion",
        "comprobantes de reparacion",
      ),
    );
  }

  if (guard.maintenanceCount > 0) {
    blockers.push(
      pluralize(guard.maintenanceCount, "mantenimiento", "mantenimientos"),
    );
  }

  if (guard.maintenanceItemCount > 0) {
    blockers.push(
      pluralize(
        guard.maintenanceItemCount,
        "item de mantenimiento",
        "items de mantenimiento",
      ),
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
        debtCount: 0,
        debtPaymentCount: 0,
        dailyRecordCount: 0,
        expenseCount: 0,
        maintenanceItemCount: 0,
        maintenanceCount: 0,
        repairAttachmentCount: 0,
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
    supabase.from("daily_records").select("id, bus_id").in("bus_id", normalizedBusIds),
    supabase.from("repairs").select("id, bus_id").in("bus_id", normalizedBusIds),
    supabase
      .from("maintenance_records")
      .select("bus_id, debt_id, id")
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

  const dailyRecordIds = Array.from(
    new Set((dailyRecords ?? []).map((record) => record.id)),
  );

  repairs?.forEach((repair) => {
    incrementGuardCount(baseMap, repair.bus_id, "repairCount");
  });

  const repairIds = Array.from(new Set((repairs ?? []).map((repair) => repair.id)));

  maintenanceRecords?.forEach((record) => {
    incrementGuardCount(baseMap, record.bus_id, "maintenanceCount");
  });

  const maintenanceRecordIds = Array.from(
    new Set((maintenanceRecords ?? []).map((record) => record.id)),
  );
  const maintenanceDebtIds = Array.from(
    new Set(
      (maintenanceRecords ?? [])
        .map((record) => record.debt_id)
        .filter((debtId): debtId is string => Boolean(debtId)),
    ),
  );

  alerts?.forEach((alert) => {
    if (alert.bus_id) {
      incrementGuardCount(baseMap, alert.bus_id, "alertCount");
    }
  });

  auditEntries?.forEach((entry) => {
    incrementGuardCount(baseMap, entry.record_id, "auditCount");
  });

  const [
    { data: expenses, error: expensesError },
    { data: repairAttachments, error: repairAttachmentsError },
    { data: maintenanceItems, error: maintenanceItemsError },
    { data: debtsFromBus, error: debtsFromBusError },
    { data: debtsFromRecords, error: debtsFromRecordsError },
    { data: debtsFromMaintenance, error: debtsFromMaintenanceError },
  ] = await Promise.all([
    dailyRecordIds.length > 0
      ? supabase
          .from("expenses")
          .select("daily_record_id")
          .in("daily_record_id", dailyRecordIds)
      : Promise.resolve({ data: [], error: null }),
    repairIds.length > 0
      ? supabase
          .from("repair_attachments")
          .select("repair_id")
          .in("repair_id", repairIds)
      : Promise.resolve({ data: [], error: null }),
    maintenanceRecordIds.length > 0
      ? supabase
          .from("maintenance_items")
          .select("maintenance_record_id")
          .in("maintenance_record_id", maintenanceRecordIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("debts").select("bus_id, id").in("bus_id", normalizedBusIds),
    dailyRecordIds.length > 0
      ? supabase
          .from("debts")
          .select("daily_record_id, id")
          .in("daily_record_id", dailyRecordIds)
      : Promise.resolve({ data: [], error: null }),
    maintenanceDebtIds.length > 0
      ? supabase.from("debts").select("id").in("id", maintenanceDebtIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (expensesError) {
    throw expensesError;
  }

  if (repairAttachmentsError) {
    throw repairAttachmentsError;
  }

  if (maintenanceItemsError) {
    throw maintenanceItemsError;
  }

  if (debtsFromBusError) {
    throw debtsFromBusError;
  }

  if (debtsFromRecordsError) {
    throw debtsFromRecordsError;
  }

  if (debtsFromMaintenanceError) {
    throw debtsFromMaintenanceError;
  }

  const dailyRecordToBusId = new Map(
    (dailyRecords ?? []).map((record) => [record.id, record.bus_id]),
  );
  const repairToBusId = new Map((repairs ?? []).map((repair) => [repair.id, repair.bus_id]));
  const maintenanceToBusId = new Map(
    (maintenanceRecords ?? []).map((record) => [record.id, record.bus_id]),
  );
  const maintenanceDebtToBusId = new Map(
    (maintenanceRecords ?? [])
      .filter((record) => Boolean(record.debt_id))
      .map((record) => [record.debt_id as string, record.bus_id]),
  );

  expenses?.forEach((expense) => {
    const busId = dailyRecordToBusId.get(expense.daily_record_id);

    if (busId) {
      incrementGuardCount(baseMap, busId, "expenseCount");
    }
  });

  repairAttachments?.forEach((attachment) => {
    const busId = repairToBusId.get(attachment.repair_id);

    if (busId) {
      incrementGuardCount(baseMap, busId, "repairAttachmentCount");
    }
  });

  maintenanceItems?.forEach((item) => {
    const busId = maintenanceToBusId.get(item.maintenance_record_id);

    if (busId) {
      incrementGuardCount(baseMap, busId, "maintenanceItemCount");
    }
  });

  const debtIdsByBus = new Map<string, Set<string>>();

  debtsFromBus?.forEach((debt) => {
    if (!debt.bus_id) {
      return;
    }

    const current = debtIdsByBus.get(debt.bus_id) ?? new Set<string>();
    current.add(debt.id);
    debtIdsByBus.set(debt.bus_id, current);
  });

  debtsFromRecords?.forEach((debt) => {
    const busId = debt.daily_record_id
      ? dailyRecordToBusId.get(debt.daily_record_id)
      : undefined;

    if (!busId) {
      return;
    }

    const current = debtIdsByBus.get(busId) ?? new Set<string>();
    current.add(debt.id);
    debtIdsByBus.set(busId, current);
  });

  debtsFromMaintenance?.forEach((debt) => {
    const busId = maintenanceDebtToBusId.get(debt.id);

    if (!busId) {
      return;
    }

    const current = debtIdsByBus.get(busId) ?? new Set<string>();
    current.add(debt.id);
    debtIdsByBus.set(busId, current);
  });

  debtIdsByBus.forEach((debtIds, busId) => {
    const current = baseMap.get(busId);

    if (!current) {
      return;
    }

    current.debtCount = debtIds.size;
  });

  const allDebtIds = Array.from(
    new Set(
      Array.from(debtIdsByBus.values()).flatMap((debtIds) => Array.from(debtIds)),
    ),
  );

  if (allDebtIds.length > 0) {
    const { data: debtPayments, error: debtPaymentsError } = await supabase
      .from("debt_payments")
      .select("debt_id")
      .in("debt_id", allDebtIds);

    if (debtPaymentsError) {
      throw debtPaymentsError;
    }

    const debtIdToBusId = new Map<string, string>();

    debtIdsByBus.forEach((debtIds, busId) => {
      debtIds.forEach((debtId) => {
        debtIdToBusId.set(debtId, busId);
      });
    });

    debtPayments?.forEach((payment) => {
      const busId = debtIdToBusId.get(payment.debt_id);

      if (busId) {
        incrementGuardCount(baseMap, busId, "debtPaymentCount");
      }
    });
  }

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
