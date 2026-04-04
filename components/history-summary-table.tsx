import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export type HistorySummaryRow = {
  busCount: number;
  closedRecords: number;
  label: string;
  openDifferences: number;
  periodKey: string;
  totalCalculatedNet: number;
  totalDifference: number;
  totalIncomeUsd: number;
  totalRecords: number;
};

type HistorySummaryTableProps = {
  description: string;
  rows: HistorySummaryRow[];
  title: string;
};

export function HistorySummaryTable({
  description,
  rows,
  title,
}: HistorySummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            No hay movimientos suficientes para construir este historial con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[30px] border border-border bg-card/95">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-right">Registros</th>
                  <th className="px-4 py-3 text-right">Buses</th>
                  <th className="px-4 py-3 text-right">Cerrados</th>
                  <th className="px-4 py-3 text-right">Dif. abiertas</th>
                  <th className="px-4 py-3 text-right">Ingreso USD</th>
                  <th className="px-4 py-3 text-right">Neto calculado</th>
                  <th className="px-4 py-3 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {rows.map((row) => (
                  <tr key={row.periodKey} className="transition-colors hover:bg-secondary/35">
                    <td className="px-4 py-4 font-semibold">{row.label}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{row.totalRecords}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{row.busCount}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{row.closedRecords}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{row.openDifferences}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(row.totalIncomeUsd)}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(row.totalCalculatedNet)}
                    </td>
                    <td
                      className={
                        Math.abs(row.totalDifference) >= 0.01
                          ? "px-4 py-4 text-right font-semibold tabular-nums text-destructive"
                          : "px-4 py-4 text-right font-semibold tabular-nums text-emerald-700"
                      }
                    >
                      {formatCurrency(row.totalDifference)}
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
