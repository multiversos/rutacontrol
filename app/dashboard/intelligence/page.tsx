import { AnomalyBadge } from "@/components/anomaly-badge";
import { ConfidenceScoreCards } from "@/components/confidence-score-card";
import { KpiCards } from "@/components/kpi-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { getIntelligenceData } from "@/lib/reports";

type IntelligencePageProps = {
  searchParams?: Promise<{
    dateFrom?: string;
    dateTo?: string;
    profileId?: string;
    routeId?: string;
  }>;
};

export default async function IntelligencePage({
  searchParams,
}: IntelligencePageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const data = await getIntelligenceData({
    dateFrom: params?.dateFrom ? String(params.dateFrom) : undefined,
    dateTo: params?.dateTo ? String(params.dateTo) : undefined,
    profileId: params?.profileId ? String(params.profileId) : undefined,
    routeId: params?.routeId ? String(params.routeId) : undefined,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inteligencia operativa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detecta desviaciones de ingreso por ruta y revisa el score de confianza
            del registrador con una formula entendible.
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="intelligence-date-from">
                Desde
              </label>
              <input
                className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
                defaultValue={data.filters.dateFrom}
                id="intelligence-date-from"
                name="dateFrom"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="intelligence-date-to">
                Hasta
              </label>
              <input
                className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
                defaultValue={data.filters.dateTo}
                id="intelligence-date-to"
                name="dateTo"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="intelligence-route">
                Ruta
              </label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
                defaultValue={data.filters.routeId ?? ""}
                id="intelligence-route"
                name="routeId"
              >
                <option value="">Todas las rutas</option>
                {data.routeOptions.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="intelligence-profile">
                Registrador
              </label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
                defaultValue={data.filters.profileId ?? ""}
                id="intelligence-profile"
                name="profileId"
              >
                <option value="">Todos los registradores</option>
                {data.profileOptions.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              type="submit"
            >
              Aplicar
            </button>
            <a
              className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
              href="/dashboard/intelligence"
            >
              Limpiar
            </a>
          </form>
        </CardContent>
      </Card>

      <KpiCards
        items={[
          {
            helper: "Registros visibles fuera del rango esperado por ruta",
            label: "Anomalias detectadas",
            tone: data.summary.anomaliesDetected > 0 ? "danger" : "success",
            value: String(data.summary.anomaliesDetected),
          },
          {
            helper: "Rutas con al menos 5 cierres historicos y desviacion util",
            label: "Rutas evaluables",
            value: String(data.summary.routesWithEnoughHistory),
          },
          {
            helper: "Promedio de confianza para los registradores visibles",
            label: "Confianza promedio",
            tone:
              data.summary.averageConfidence >= 85
                ? "success"
                : data.summary.averageConfidence >= 70
                  ? "warning"
                  : "danger",
            value: `${data.summary.averageConfidence}`,
          },
          {
            helper: "Registradores con score calculado en el rango",
            label: "Registradores evaluados",
            value: String(data.summary.evaluatedRegistrars),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Regla de anomalías</CardTitle>
          <p className="text-sm text-muted-foreground">
            Se marca anomalía cuando el ingreso del cierre supera 1.5 desviaciones
            estándar frente al histórico de su ruta. No se evalúa la ruta hasta tener
            al menos 5 cierres válidos.
          </p>
        </CardHeader>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Anomalias por cierre</CardTitle>
          </CardHeader>
          <CardContent>
            {data.anomalies.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                No hay cierres visibles para evaluar con los filtros actuales.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[28px] border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/60 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Bus</th>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3">Ingreso</th>
                      <th className="px-4 py-3">Promedio</th>
                      <th className="px-4 py-3">Desv. estándar</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white/70">
                    {data.anomalies.map((anomaly) => (
                      <tr key={anomaly.id}>
                        <td className="px-4 py-3">{anomaly.recordDate}</td>
                        <td className="px-4 py-3 font-medium">{anomaly.busCode}</td>
                        <td className="px-4 py-3">{anomaly.routeLabel}</td>
                        <td className="px-4 py-3">{formatCurrency(anomaly.incomeUsd)}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(anomaly.baseline.averageIncomeUsd)}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(anomaly.baseline.standardDeviationUsd)}
                        </td>
                        <td className="space-y-2 px-4 py-3">
                          <AnomalyBadge
                            hasEnoughHistory={anomaly.hasEnoughHistory}
                            isAnomaly={anomaly.isAnomaly}
                            zScore={anomaly.zScore}
                          />
                          <p className="text-xs text-muted-foreground">{anomaly.reason}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baselines por ruta</CardTitle>
            <p className="text-sm text-muted-foreground">
              Promedio y desviacion estándar usados por el motor de anomalías.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.anomalyBaselines.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                Todavía no hay cierres históricos suficientes para construir baselines.
              </div>
            ) : (
              data.anomalyBaselines.map((baseline) => (
                <div
                  key={baseline.routeId}
                  className="rounded-[24px] border border-border bg-white/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{baseline.routeLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        {baseline.observationCount} cierres · umbral{" "}
                        {formatCurrency(baseline.thresholdUsd)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{formatCurrency(baseline.averageIncomeUsd)}</p>
                      <p className="text-muted-foreground">
                        sigma {formatNumber(baseline.standardDeviationUsd)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <ConfidenceScoreCards
        formula={data.confidenceFormula}
        items={data.confidenceScores}
      />
    </div>
  );
}
