import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusProfilePeriodSummary } from "@/lib/bus-profile";
import { formatCurrency, formatNumber, isNonZeroAmount } from "@/lib/formatters";

type BusPeriodHistoryProps = {
  monthly: BusProfilePeriodSummary[];
  weekly: BusProfilePeriodSummary[];
};

type PeriodSummaryTableProps = {
  description: string;
  emptyMessage: string;
  periods: BusProfilePeriodSummary[];
  title: string;
};

function PeriodSummaryTable({
  description,
  emptyMessage,
  periods,
  title,
}: PeriodSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {periods.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card/80">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3">Ingreso</th>
                  <th className="px-4 py-3">Gastos</th>
                  <th className="px-4 py-3">Neto</th>
                  <th className="px-4 py-3">Diferencia</th>
                  <th className="px-4 py-3">Dias</th>
                  <th className="px-4 py-3">Cierres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {periods.map((period) => (
                  <tr key={`${period.periodStart}-${period.periodEnd}`}>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{period.periodLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {period.periodStart} al {period.periodEnd}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(period.incomeUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(period.expenseUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(period.netUsd)}</td>
                    <td
                      className={
                        isNonZeroAmount(period.differenceUsd)
                          ? "px-4 py-3 font-semibold text-destructive"
                          : "px-4 py-3 font-semibold text-emerald-700"
                      }
                    >
                      {formatCurrency(period.differenceUsd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {formatNumber(period.daysOperated, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(period.recordCount, 0)} registros
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatNumber(period.closedRecordCount, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BusPeriodHistory({ monthly, weekly }: BusPeriodHistoryProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <PeriodSummaryTable
        description="Agrupa la operacion del bus por semanas operativas de lunes a domingo usando la fecha real del registro."
        emptyMessage="No hay registros suficientes para armar resumen semanal en el rango actual."
        periods={weekly}
        title="Resumen semanal"
      />
      <PeriodSummaryTable
        description="Agrupa la operacion del bus por mes calendario para detectar cambios de rendimiento a lo largo del tiempo."
        emptyMessage="No hay registros suficientes para armar resumen mensual en el rango actual."
        periods={monthly}
        title="Resumen mensual"
      />
    </section>
  );
}
