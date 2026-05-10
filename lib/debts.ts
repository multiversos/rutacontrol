import "server-only";

import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import {
  isDemoBus,
  isDemoDebtRecord,
  isOperationalRecordDate,
} from "@/lib/demo-data";
import { getBusinessTodayDate } from "@/lib/formatters";
import { OPERATIONAL_ROUTE } from "@/lib/operational-route";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type DebtPaymentRow = Pick<
  Tables<"debt_payments">,
  "amount_usd" | "created_at" | "id" | "notes" | "payment_date"
>;

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

type BusLookup = Pick<
  Tables<"buses">,
  "code" | "id" | "photo_path" | "plate" | "status"
>;

export type DebtStatusFilter = "all" | Tables<"debts">["status"];

export type DebtListItem = {
  amountPaidUsd: string;
  amountUsd: string;
  balanceDueUsd: string;
  busCode: string | null;
  busId: string | null;
  busPhotoUrl: string | null;
  busPlate: string | null;
  createdAt: string;
  creditor: string;
  dailyRecordId: string | null;
  dailyRecordLabel: string | null;
  description: string;
  dueDate: string | null;
  id: string;
  status: Tables<"debts">["status"];
};

export type DebtPaymentListItem = {
  amountUsd: string;
  createdAt: string;
  id: string;
  notes: string | null;
  paymentDate: string;
};

export type DebtRecordOption = {
  busId: string;
  id: string;
  label: string;
};

export type DebtBusOption = {
  code: string;
  id: string;
  photoUrl: string | null;
  plate: string;
  routeName: string;
  status: Tables<"buses">["status"];
};

function resolveBusDetails(
  busMap: Map<
    string,
    {
      code: string;
      photoUrl: string | null;
      plate: string;
      status: Tables<"buses">["status"];
    }
  >,
  busId: string | null,
) {
  if (!busId) {
    return {
      busCode: null,
      busId: null,
      busPhotoUrl: null,
      busPlate: null,
    };
  }

  const bus = busMap.get(busId);

  return {
    busCode: bus?.code ?? busId,
    busId,
    busPhotoUrl: bus?.photoUrl ?? null,
    busPlate: bus?.plate ?? null,
  };
}

function normalizeDebt(
  debt: DebtRow,
  busMap: Map<
    string,
    {
      code: string;
      photoUrl: string | null;
      plate: string;
      status: Tables<"buses">["status"];
    }
  >,
  recordMap: Map<string, string>,
) {
  return {
    amountPaidUsd: debt.amount_paid_usd,
    amountUsd: debt.amount_usd,
    balanceDueUsd: debt.balance_due_usd,
    ...resolveBusDetails(busMap, debt.bus_id),
    createdAt: debt.created_at,
    creditor: debt.creditor,
    dailyRecordId: debt.daily_record_id,
    dailyRecordLabel: debt.daily_record_id
      ? (recordMap.get(debt.daily_record_id) ?? debt.daily_record_id)
      : null,
    description: debt.description,
    dueDate: debt.due_date,
    id: debt.id,
    status: debt.status,
  } satisfies DebtListItem;
}

export async function getDebtsData(filters: {
  payDebtId?: string;
  payDebtQuery?: string;
  status?: DebtStatusFilter;
}) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const status = filters.status ?? "all";

  let debtsQuery = supabase
    .from("debts")
    .select(
      "id, creditor, description, amount_usd, amount_paid_usd, balance_due_usd, status, bus_id, daily_record_id, due_date, created_at",
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    debtsQuery = debtsQuery.eq("status", status);
  }

  const [{ data: debts, error: debtsError }, { data: recentRecords }, { data: buses }] =
    await Promise.all([
      debtsQuery,
      supabase
        .from("daily_records")
        .select("id, bus_id, record_date")
        .order("record_date", { ascending: false })
        .limit(80),
      supabase
        .from("buses")
        .select("id, code, plate, photo_path, status")
        .order("code"),
    ]);

  const migrationReady =
    !debtsError ||
    !["42P01", "42703", "PGRST204", "PGRST205"].includes(debtsError.code ?? "");

  if (debtsError && migrationReady) {
    throw debtsError;
  }

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const activeBusOptions = visibleBuses.filter((bus) => bus.status === "active");
  const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses as BusLookup[]);
  const visibleBusIds = new Set(visibleBuses.map((bus) => bus.id));
  const busMap = new Map(
    (buses ?? []).map((bus) => [
      bus.id,
      {
        code: bus.code,
        photoUrl: photoMap.get(bus.id) ?? null,
        plate: bus.plate,
        status: bus.status,
      },
    ]),
  );

  const recordMap = new Map(
    (recentRecords ?? [])
      .filter(
        (record) =>
          visibleBusIds.has(record.bus_id) &&
          isOperationalRecordDate(record.record_date, today),
      )
      .map((record) => [
        record.id,
        `${busMap.get(record.bus_id)?.code ?? record.bus_id} - ${record.record_date}`,
      ]),
  );

  const debtRecordIds = Array.from(
    new Set(
      (debts ?? [])
        .map((debt) => debt.daily_record_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (debtRecordIds.length > 0) {
    const { data: linkedRecords } = await supabase
      .from("daily_records")
      .select("id, bus_id, record_date")
      .in("id", debtRecordIds);

    (linkedRecords ?? []).forEach((record) => {
      recordMap.set(
        record.id,
        `${busMap.get(record.bus_id)?.code ?? record.bus_id} - ${record.record_date}`,
      );
    });
  }

  const payDebtQuery = filters.payDebtQuery?.trim().toLowerCase();
  const selectedDebt =
    (debts ?? []).find((debt) => debt.id === filters.payDebtId) ??
    (payDebtQuery
      ? ((debts ?? []).find((debt) => {
          const searchable = `${debt.creditor} ${debt.description}`.toLowerCase();
          return debt.status !== "paid" && searchable.includes(payDebtQuery);
        }) ?? null)
      : null);
  const { data: payments } = selectedDebt
    ? await supabase
        .from("debt_payments")
        .select("id, amount_usd, payment_date, notes, created_at")
        .eq("debt_id", selectedDebt.id)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [] as DebtPaymentRow[] };

  const normalizedDebts = (debts ?? [])
    .filter((debt) => !isDemoDebtRecord(debt))
    .map((debt) => normalizeDebt(debt, busMap, recordMap));

  const summary = normalizedDebts.reduce(
    (accumulator, debt) => ({
      openBalanceUsd:
        accumulator.openBalanceUsd + Number.parseFloat(debt.balanceDueUsd),
      paidCount: accumulator.paidCount + (debt.status === "paid" ? 1 : 0),
      partialCount: accumulator.partialCount + (debt.status === "partial" ? 1 : 0),
      pendingCount: accumulator.pendingCount + (debt.status === "pending" ? 1 : 0),
      totalAmountUsd: accumulator.totalAmountUsd + Number.parseFloat(debt.amountUsd),
      totalPaidUsd:
        accumulator.totalPaidUsd + Number.parseFloat(debt.amountPaidUsd),
    }),
    {
      openBalanceUsd: 0,
      paidCount: 0,
      partialCount: 0,
      pendingCount: 0,
      totalAmountUsd: 0,
      totalPaidUsd: 0,
    },
  );

  return {
    busOptions: activeBusOptions.map((bus) => ({
      code: bus.code,
      id: bus.id,
      photoUrl: photoMap.get(bus.id) ?? null,
      plate: bus.plate,
      routeName: OPERATIONAL_ROUTE.label,
      status: bus.status,
    })) satisfies DebtBusOption[],
    debts: normalizedDebts,
    filters: {
      payDebtId: filters.payDebtId,
      payDebtQuery: filters.payDebtQuery,
      status,
    },
    migrationReady,
    paymentHistory: (payments ?? []).map((payment) => ({
      amountUsd: payment.amount_usd,
      createdAt: payment.created_at,
      id: payment.id,
      notes: payment.notes,
      paymentDate: payment.payment_date,
    })) satisfies DebtPaymentListItem[],
    recordOptions: (recentRecords ?? [])
      .filter((record) => visibleBusIds.has(record.bus_id))
      .map((record) => ({
        busId: record.bus_id,
        id: record.id,
        label: recordMap.get(record.id) ?? record.id,
      })) satisfies DebtRecordOption[],
    selectedDebt:
      selectedDebt == null ? null : normalizeDebt(selectedDebt, busMap, recordMap),
    summary,
  };
}
