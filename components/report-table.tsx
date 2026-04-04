import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { ProfitabilityReportRow } from "@/lib/reports";

type ReportTableProps = {
  entityLabel: string;
  rows: ProfitabilityReportRow[];
  title: string;
};

export function ReportTable({ entityLabel, rows, title }: ReportTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Muestra ingreso, gastos, neto, cierres y diferencias acumuladas por {entityLabel.toLowerCase()}.
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            No hay cierres suficientes para construir este reporte con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[30px] border border-border bg-card/95">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{entityLabel}</th>
                  <th className="px-4 py-3 text-right">Cierres</th>
                  <th className="px-4 py-3 text-right">Ingreso USD</th>
                  <th className="px-4 py-3 text-right">Gastos USD</th>
                  <th className="px-4 py-3 text-right">Neto USD</th>
                  <th className="px-4 py-3 text-right">Dif. acumulada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {rows.map((row) => (
                  <tr key={row.entityId} className="transition-colors hover:bg-secondary/35">
                    <td className="px-4 py-4 font-semibold">{row.entityLabel}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{row.closureCount}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(row.incomeUsd)}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(row.expensesUsd)}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(row.netUsd)}</td>
                    <td
                      className={
                        Math.abs(row.differenceTotalUsd) >= 0.01
                          ? "px-4 py-4 text-right font-semibold tabular-nums text-destructive"
                          : "px-4 py-4 text-right font-semibold tabular-nums text-emerald-700"
                      }
                    >
                      {formatCurrency(row.differenceTotalUsd)}
                    </td>
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
