import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type DebtPaymentRow = Pick<
  Tables<"debt_payments">,
  "amount_usd" | "created_at" | "id" | "notes" | "payment_date"
>;

export type DebtStatusFilter = "all" | Tables<"debts">["status"];

export type DebtListItem = {
  amountPaidUsd: string;
  amountUsd: string;
  balanceDueUsd: string;
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
  id: string;
  label: string;
};

export async function getDebtsData(filters: {
  payDebtId?: string;
  status?: DebtStatusFilter;
}) {
  const supabase = await createClient();
  const status = filters.status ?? "all";

  let debtsQuery = supabase
    .from("debts")
    .select(
      "id, creditor, description, amount_usd, amount_paid_usd, balance_due_usd, status, daily_record_id, due_date, created_at",
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
      supabase.from("buses").select("id, code").order("code"),
    ]);

  const migrationReady =
    !debtsError || !["42P01", "PGRST205"].includes(debtsError.code ?? "");

  if (debtsError && migrationReady) {
    throw debtsError;
  }

  const busMap = new Map((buses ?? []).map((bus) => [bus.id, bus.code]));
  const recordMap = new Map(
    (recentRecords ?? []).map((record) => [
      record.id,
      `${busMap.get(record.bus_id) ?? record.bus_id} - ${record.record_date}`,
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
        `${busMap.get(record.bus_id) ?? record.bus_id} - ${record.record_date}`,
      );
    });
  }

  const selectedDebt =
    (debts ?? []).find((debt) => debt.id === filters.payDebtId) ?? null;
  const { data: payments } = selectedDebt
    ? await supabase
        .from("debt_payments")
        .select("id, amount_usd, payment_date, notes, created_at")
        .eq("debt_id", selectedDebt.id)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [] as DebtPaymentRow[] };

  const normalizedDebts = (debts ?? []).map((debt) => ({
    amountPaidUsd: debt.amount_paid_usd,
    amountUsd: debt.amount_usd,
    balanceDueUsd: debt.balance_due_usd,
    createdAt: debt.created_at,
    creditor: debt.creditor,
    dailyRecordId: debt.daily_record_id,
    dailyRecordLabel: debt.daily_record_id
      ? recordMap.get(debt.daily_record_id) ?? debt.daily_record_id
      : null,
    description: debt.description,
    dueDate: debt.due_date,
    id: debt.id,
    status: debt.status,
  })) satisfies DebtListItem[];

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
    debts: normalizedDebts,
    filters: {
      payDebtId: filters.payDebtId,
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
    recordOptions: (recentRecords ?? []).map((record) => ({
      id: record.id,
      label: recordMap.get(record.id) ?? record.id,
    })) satisfies DebtRecordOption[],
    selectedDebt:
      selectedDebt == null
        ? null
        : ({
            amountPaidUsd: selectedDebt.amount_paid_usd,
            amountUsd: selectedDebt.amount_usd,
            balanceDueUsd: selectedDebt.balance_due_usd,
            createdAt: selectedDebt.created_at,
            creditor: selectedDebt.creditor,
            dailyRecordId: selectedDebt.daily_record_id,
            dailyRecordLabel: selectedDebt.daily_record_id
              ? recordMap.get(selectedDebt.daily_record_id) ??
                selectedDebt.daily_record_id
              : null,
            description: selectedDebt.description,
            dueDate: selectedDebt.due_date,
            id: selectedDebt.id,
            status: selectedDebt.status,
          } satisfies DebtListItem),
    summary,
  };
}
