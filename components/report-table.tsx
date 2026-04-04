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
          <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            No hay cierres suficientes para construir este reporte con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[28px] border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{entityLabel}</th>
                  <th className="px-4 py-3">Cierres</th>
                  <th className="px-4 py-3">Ingreso USD</th>
                  <th className="px-4 py-3">Gastos USD</th>
                  <th className="px-4 py-3">Neto USD</th>
                  <th className="px-4 py-3">Dif. acumulada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {rows.map((row) => (
                  <tr key={row.entityId}>
                    <td className="px-4 py-3 font-medium">{row.entityLabel}</td>
                    <td className="px-4 py-3">{row.closureCount}</td>
                    <td className="px-4 py-3">{formatCurrency(row.incomeUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(row.expensesUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(row.netUsd)}</td>
                    <td
                      className={
                        Math.abs(row.differenceTotalUsd) >= 0.01
                          ? "px-4 py-3 font-semibold text-destructive"
                          : "px-4 py-3 font-semibold text-emerald-700"
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
