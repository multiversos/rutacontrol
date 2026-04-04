import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, isNonZeroAmount } from "@/lib/formatters";

type BusFilterOption = {
  code: string;
  id: string;
};

export type DailyFilters = {
  busId: string | undefined;
  date: string | undefined;
};

type DailyTableRecord = {
  busCode: string;
  calculatedNet: string;
  closedAt: string | null;
  difference: string;
  exchangeRate: string;
  fuelCost: string;
  id: string;
  incomeBs: string;
  incomeUsd: string;
  netProfitUsd: string;
  otherExpenses: string;
  recordDate: string;
  status: string;
  userName: string | undefined;
  workerPayment: string;
};

type DailyTableProps = {
  busOptions: BusFilterOption[];
  filters: DailyFilters;
  isAdmin: boolean;
  records: DailyTableRecord[];
};

export function DailyTable({
  busOptions,
  filters,
  isAdmin,
  records,
}: DailyTableProps) {
  return (
    <div className="space-y-5">
      <form className="grid gap-4 rounded-[28px] border border-border bg-card/90 p-5 shadow-soft md:grid-cols-[1fr_1fr_auto_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="filter-date">
            Filtrar por fecha
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.date ?? ""}
            id="filter-date"
            name="date"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="filter-bus">
            Filtrar por bus
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.busId ?? ""}
            id="filter-bus"
            name="busId"
          >
            <option value="">Todos los buses</option>
            {busOptions.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.code}
              </option>
            ))}
          </select>
        </div>

        <button
          className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          type="submit"
        >
          Aplicar filtros
        </button>

        <Link
          className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
          href="/dashboard/daily"
        >
          Limpiar
        </Link>
      </form>

      {records.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          Todavia no hay registros para los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[28px] border border-border bg-card/90 shadow-soft">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Bus</th>
                {isAdmin ? <th className="px-4 py-3">Registrador</th> : null}
                <th className="px-4 py-3">Ingreso Bs</th>
                <th className="px-4 py-3">Tasa</th>
                <th className="px-4 py-3">Ingreso USD</th>
                <th className="px-4 py-3">Gasto total</th>
                <th className="px-4 py-3">Neto reportado</th>
                <th className="px-4 py-3">Neto calculado</th>
                <th className="px-4 py-3">Diferencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white/70">
              {records.map((record) => {
                const totalExpenses =
                  Number.parseFloat(record.fuelCost) +
                  Number.parseFloat(record.workerPayment) +
                  Number.parseFloat(record.otherExpenses);

                return (
                  <tr key={record.id}>
                    <td className="px-4 py-3">{record.recordDate}</td>
                    <td className="px-4 py-3 font-medium">{record.busCode}</td>
                    {isAdmin ? (
                      <td className="px-4 py-3">{record.userName ?? "--"}</td>
                    ) : null}
                    <td className="px-4 py-3">{formatNumber(record.incomeBs)}</td>
                    <td className="px-4 py-3">{formatNumber(record.exchangeRate, 6)}</td>
                    <td className="px-4 py-3">{formatCurrency(record.incomeUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(totalExpenses)}</td>
                    <td className="px-4 py-3">{formatCurrency(record.netProfitUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(record.calculatedNet)}</td>
                    <td
                      className={
                        isNonZeroAmount(record.difference)
                          ? "px-4 py-3 font-semibold text-destructive"
                          : "px-4 py-3 font-semibold text-emerald-700"
                      }
                    >
                      {formatCurrency(record.difference)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <Badge
                          variant={record.status === "closed" ? "success" : "warning"}
                        >
                          {record.status === "closed" ? "Cerrado" : "Borrador"}
                        </Badge>
                        {record.closedAt ? (
                          <p className="text-xs text-muted-foreground">
                            {record.closedAt}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className="text-sm font-semibold text-primary"
                        href={`/dashboard/daily/new?recordId=${record.id}`}
                      >
                        {record.status === "closed" ? "Ver cierre" : "Editar"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
