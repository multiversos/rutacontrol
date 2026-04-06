import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusProfileFinancialSummary } from "@/lib/bus-profile";
import { formatCurrency, formatDateLabel, formatNumber } from "@/lib/formatters";

type BusFinancialSummaryProps = {
  summary: BusProfileFinancialSummary;
};

export function BusFinancialSummary({ summary }: BusFinancialSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Finanzas historicas del bus</CardTitle>
        <CardDescription>
          Consolidado real de ingresos, gastos, neto, deuda y comportamiento de
          cierres de esta unidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-sm text-muted-foreground">Ingreso acumulado</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(summary.incomeUsd)}
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-sm text-muted-foreground">Gasto acumulado</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(summary.expenseUsd)}
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-sm text-muted-foreground">Neto acumulado</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.netUsd)}</p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-sm text-muted-foreground">Deuda pendiente</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(summary.openDebtUsd)}
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-sm text-muted-foreground">Registros cerrados</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(summary.closedRecordCount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ultimo dia trabajado:{" "}
            {summary.lastWorkedDate ? formatDateLabel(summary.lastWorkedDate) : "Sin cierre"}
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-sm text-muted-foreground">Promedio por dia trabajado</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(summary.averageNetUsd)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Diferencias con impacto: {formatNumber(summary.differenceRecords)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
