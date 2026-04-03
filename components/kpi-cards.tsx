import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

type KpiCardsProps = {
  totalDifference: number;
  totalIncomeUsd: number;
  totalNetProfitUsd: number;
  totalRecords: number;
};

export function KpiCards({
  totalDifference,
  totalIncomeUsd,
  totalNetProfitUsd,
  totalRecords,
}: KpiCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-3xl font-semibold">
          {totalRecords}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingreso total USD</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-3xl font-semibold">
          {formatCurrency(totalIncomeUsd)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Neto reportado</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-3xl font-semibold">
          {formatCurrency(totalNetProfitUsd)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diferencia acumulada</CardTitle>
        </CardHeader>
        <CardContent
          className={
            Math.abs(totalDifference) >= 0.01
              ? "pt-0 text-3xl font-semibold text-destructive"
              : "pt-0 text-3xl font-semibold text-emerald-700"
          }
        >
          {formatCurrency(totalDifference)}
        </CardContent>
      </Card>
    </section>
  );
}
