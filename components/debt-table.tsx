import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { DebtListItem, DebtStatusFilter } from "@/lib/debts";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";

type DebtTableProps = {
  debts: DebtListItem[];
  selectedDebtId?: string;
  status: DebtStatusFilter;
};

function getDebtStatusBadge(status: DebtListItem["status"]) {
  switch (status) {
    case "paid":
      return <Badge variant="success">Pagada</Badge>;
    case "partial":
      return <Badge variant="default">Parcial</Badge>;
    default:
      return <Badge variant="warning">Pendiente</Badge>;
  }
}

function getPayHref(status: DebtStatusFilter, debtId: string) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  params.set("pay", debtId);
  return `/dashboard/debts?${params.toString()}`;
}

export function DebtTable({ debts, selectedDebtId, status }: DebtTableProps) {
  return (
    <div className="space-y-4">
      <form className="grid gap-4 rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.92))] p-5 shadow-soft md:grid-cols-[1fr_auto_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debts-status">
            Estado
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={status}
            id="debts-status"
            name="status"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="partial">Parciales</option>
            <option value="paid">Pagadas</option>
          </select>
        </div>

        <button
          className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          type="submit"
        >
          Aplicar filtro
        </button>

        <Link
          className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
          href="/dashboard/debts"
        >
          Limpiar
        </Link>
      </form>

      {debts.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          No hay deudas visibles para el filtro actual.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[30px] border border-border bg-card/95 shadow-soft">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Acreedor</th>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Abonado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white/70">
              {debts.map((debt) => (
                <tr
                  key={debt.id}
                  className={
                    selectedDebtId === debt.id
                      ? "bg-primary/5 transition-colors"
                      : "transition-colors hover:bg-secondary/35"
                  }
                >
                  <td className="px-4 py-4 font-semibold">{debt.creditor}</td>
                  <td className="px-4 py-4">{debt.description}</td>
                  <td className="px-4 py-4">
                    {debt.dailyRecordLabel ?? "Sin relacion"}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(debt.amountUsd)}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(debt.amountPaidUsd)}</td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums">
                    {formatCurrency(debt.balanceDueUsd)}
                  </td>
                  <td className="px-4 py-4">{getDebtStatusBadge(debt.status)}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {debt.dueDate ? formatDateLabel(debt.dueDate) : "--"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      className="text-sm font-semibold text-primary"
                      href={getPayHref(status, debt.id)}
                    >
                      {selectedDebtId === debt.id ? "Seleccionada" : "Registrar pago"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
