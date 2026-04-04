import Link from "next/link";

import { HistorySummaryTable } from "@/components/history-summary-table";
import { KpiCards } from "@/components/kpi-cards";
import { ReportTable } from "@/components/report-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/formatters";
import { OPERATIONAL_ROUTE_LABEL } from "@/lib/operational-route";
import { getReportsData } from "@/lib/reports";

type ReportsPageProps = {
  searchParams?: Promise<{
    busId?: string;
    dateFrom?: string;
    dateTo?: string;
    routeId?: string;
  }>;
};

function buildExportUrl(scope: string, filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  params.set("scope", scope);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `/dashboard/reports/export?${params.toString()}`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const data = await getReportsData({
    busId: params?.busId ? String(params.busId) : undefined,
    dateFrom: params?.dateFrom ? String(params.dateFrom) : undefined,
    dateTo: params?.dateTo ? String(params.dateTo) : undefined,
    routeId: params?.routeId ? String(params.routeId) : undefined,
  });

  const filterParams = {
    busId: data.filters.busId,
    dateFrom: data.filters.dateFrom,
    dateTo: data.filters.dateTo,
    routeId: data.filters.routeId,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badges={[
          { label: `${data.summary.closureCount} cierres`, variant: "muted" },
          { label: OPERATIONAL_ROUTE_LABEL, variant: "muted" },
          { label: "CSV descargable", variant: "muted" },
        ]}
        description="Consolida cierres por bus, linea fija, semana y mes sin alterar el flujo diario ya aprobado."
        eyebrow="Analisis"
        title="Reportes de rentabilidad"
      />

      <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
        <CardContent className="pt-6">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reports-date-from">
                Desde
              </label>
              <input
                className="flex h-12 w-full rounded-[20px] border border-input/90 bg-white/95 px-4 py-3 text-sm"
                defaultValue={data.filters.dateFrom}
                id="reports-date-from"
                name="dateFrom"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reports-date-to">
                Hasta
              </label>
              <input
                className="flex h-12 w-full rounded-[20px] border border-input/90 bg-white/95 px-4 py-3 text-sm"
                defaultValue={data.filters.dateTo}
                id="reports-date-to"
                name="dateTo"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reports-bus">
                Bus
              </label>
              <select
                className="flex h-12 w-full rounded-[20px] border border-input/90 bg-white/95 px-4 py-3 text-sm"
                defaultValue={data.filters.busId ?? ""}
                id="reports-bus"
                name="busId"
              >
                <option value="">Todos los buses</option>
                {data.busOptions.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="inline-flex h-12 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              type="submit"
            >
              Aplicar
            </button>
            <a
              className="inline-flex h-12 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
              href="/dashboard/reports"
            >
              Limpiar
            </a>
          </form>
        </CardContent>
      </Card>

      <KpiCards
        items={[
          {
            helper: "Cierres consolidados con los filtros actuales",
            label: "Cierres visibles",
            value: String(data.summary.closureCount),
          },
          {
            helper: "Ingreso total del rango filtrado",
            label: "Ingreso USD",
            value: formatCurrency(data.summary.incomeUsd),
          },
          {
            helper: "Neto calculado total del rango filtrado",
            label: "Neto USD",
            value: formatCurrency(data.summary.netUsd),
          },
          {
            helper: "Diferencia acumulada de los cierres visibles",
            label: "Dif. acumulada",
            tone: Math.abs(data.summary.differenceTotalUsd) >= 0.01 ? "danger" : "success",
            value: formatCurrency(data.summary.differenceTotalUsd),
          },
        ]}
      />

      <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
        <CardHeader>
          <CardTitle>Exportacion descargable</CardTitle>
          <p className="text-sm text-muted-foreground">
            Descarga CSV con datos reales de rentabilidad y cierres consolidados.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href={buildExportUrl("bus", filterParams)}
          >
            Exportar por bus
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href={buildExportUrl("route", filterParams)}
          >
            Exportar linea operativa
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href={buildExportUrl("weekly", filterParams)}
          >
            Exportar semanal
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href={buildExportUrl("monthly", filterParams)}
          >
            Exportar mensual
          </Link>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <ReportTable
          entityLabel="Bus"
          rows={data.profitabilityByBus}
          title="Rentabilidad por bus"
        />
        <ReportTable
          entityLabel="Linea"
          rows={data.profitabilityByRoute}
          title="Rentabilidad de la linea fija"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <HistorySummaryTable
          description="Cierres automaticos consolidados por semana operativa."
          rows={data.weeklyClosures.map((row) => ({
            busCount: row.busCount,
            closedRecords: row.closureCount,
            label: `${row.periodKey} - semana operativa`,
            openDifferences: Math.abs(row.differenceTotalUsd) >= 0.01 ? 1 : 0,
            periodKey: row.periodKey,
            totalCalculatedNet: row.totalNetUsd,
            totalDifference: row.differenceTotalUsd,
            totalIncomeUsd: row.totalIncomeUsd,
            totalRecords: row.closureCount,
          }))}
          title="Cierre semanal consolidado"
        />
        <HistorySummaryTable
          description="Cierres automaticos consolidados por mes calendario."
          rows={data.monthlyClosures.map((row) => ({
            busCount: row.busCount,
            closedRecords: row.closureCount,
            label: `${row.periodKey} - consolidado mensual`,
            openDifferences: Math.abs(row.differenceTotalUsd) >= 0.01 ? 1 : 0,
            periodKey: row.periodKey,
            totalCalculatedNet: row.totalNetUsd,
            totalDifference: row.differenceTotalUsd,
            totalIncomeUsd: row.totalIncomeUsd,
            totalRecords: row.closureCount,
          }))}
          title="Cierre mensual consolidado"
        />
      </section>
    </div>
  );
}
