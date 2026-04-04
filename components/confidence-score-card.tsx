import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { RegistrarConfidenceScore } from "@/lib/scoring";

type ConfidenceScoreCardsProps = {
  formula: string;
  items: RegistrarConfidenceScore[];
};

function getBandVariant(band: RegistrarConfidenceScore["band"]) {
  if (band === "Alta") {
    return "success";
  }

  if (band === "Media") {
    return "warning";
  }

  return "danger";
}

export function ConfidenceScoreCards({
  formula,
  items,
}: ConfidenceScoreCardsProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score de confianza</CardTitle>
          <p className="text-sm text-muted-foreground">
            Todavia no hay suficientes registros del rango seleccionado para
            calcular score por registrador.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Formula del score</CardTitle>
          <p className="text-sm text-muted-foreground">{formula}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <Card key={item.userId}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle>{item.userName}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.helper}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold">{item.score}</p>
                <Badge variant={getBandVariant(item.band)}>{item.band}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="font-medium text-foreground">Registros</p>
                <p>{item.totalRecords}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Correcciones</p>
                <p>
                  {item.correctionCount} ({formatNumber(item.correctionRate * 100)}%)
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Dif. acumuladas</p>
                <p>{formatCurrency(item.totalDifferenceUsd)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Horarios atipicos</p>
                <p>{item.atypicalTimingCount}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Penalizacion correcciones</p>
                <p>{formatNumber(item.correctionPenalty)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Penalizacion diferencias</p>
                <p>{formatNumber(item.differencePenalty)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Penalizacion horarios</p>
                <p>{formatNumber(item.timingPenalty)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Registros con diferencia</p>
                <p>{item.nonZeroDifferenceCount}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
