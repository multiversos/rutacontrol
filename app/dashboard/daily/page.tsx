import Link from "next/link";

import { DailyTable, type DailyFilters } from "@/components/daily-table";
import { HistorySummaryTable } from "@/components/history-summary-table";
import { KpiCards } from "@/components/kpi-cards";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/lib/auth/session";
import { getDailyHistoryData } from "@/lib/dashboard";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";

type DailyPageProps = {
  searchParams?: Promise<{
    busId?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function DailyPage({ searchParams }: DailyPageProps) {
  const context = await requireAuth();
  const params = searchParams ? await searchParams : undefined;
  const filters: DailyFilters = {
    busId: params?.busId ? String(params.busId) : undefined,
    dateFrom: params?.dateFrom
      ? String(params.dateFrom)
      : params?.date
        ? String(params.date)
        : undefined,
    dateTo: params?.dateTo
      ? String(params.dateTo)
      : params?.date
        ? String(params.date)
        : undefined,
  };
  const historyData = await getDailyHistoryData(filters);
  const totals = historyData.records.reduce(
    (accumulator, record) => ({
      differenceCount:
        accumulator.differenceCount +
        (Math.abs(Number.parseFloat(record.difference)) >= 0.01 ? 1 : 0),
      incomeUsd: accumulator.incomeUsd + Number.parseFloat(record.incomeUsd),
      netCalculated:
        accumulator.netCalculated + Number.parseFloat(record.calculatedNet),
      totalRecords: accumulator.totalRecords + 1,
    }),
    {
      differenceCount: 0,
      incomeUsd: 0,
      netCalculated: 0,
      totalRecords: 0,
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badges={[
          {
            label: context.profile.role === "admin" ? "Vista administrativa" : "Vista personal",
            variant: "muted",
          },
          ...(historyData.filters.busId ? [{ label: "Bus filtrado", variant: "muted" as const }] : []),
        ]}
        description={
          context.profile.role === "admin"
            ? "Filtra por rango y por bus, revisa el historial agrupado y detecta diferencias abiertas."
            : "Consulta tus registros guardados y filtralos por rango de fechas o por bus."
        }
        eyebrow={context.profile.role === "admin" ? "Operacion" : "Registrador"}
        title={
          context.profile.role === "admin" ? "Historial operativo" : "Mis registros diarios"
        }
      />

      {context.profile.role === "admin" ? (
        <>
          <KpiCards
            items={[
              {
                helper: "Registros visibles con los filtros actuales",
                label: "Registros visibles",
                value: String(totals.totalRecords),
              },
              {
                helper: "Suma del ingreso USD en el rango filtrado",
                label: "Ingreso USD filtrado",
                value: formatCurrency(totals.incomeUsd),
              },
              {
                helper: "Suma del neto calculado en el rango filtrado",
                label: "Neto calculado",
                value: formatCurrency(totals.netCalculated),
              },
              {
                helper: "Registros con difference distinta de 0",
                label: "Diferencias abiertas",
                tone: totals.differenceCount > 0 ? "danger" : "success",
                value: String(totals.differenceCount),
              },
            ]}
          />

          <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <CardTitle>Lectura del rango actual</CardTitle>
                <CardDescription>
                  El historial visible se arma con los filtros activos del admin.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {historyData.filters.dateFrom ? (
                  <Badge variant="muted">
                    Desde {formatDateLabel(historyData.filters.dateFrom)}
                  </Badge>
                ) : null}
                {historyData.filters.dateTo ? (
                  <Badge variant="muted">
                    Hasta {formatDateLabel(historyData.filters.dateTo)}
                  </Badge>
                ) : null}
                {historyData.filters.busId ? (
                  <Badge variant="muted">Bus filtrado</Badge>
                ) : null}
              </div>
            </CardHeader>
          </Card>
        </>
      ) : null}

      <DailyTable
        busOptions={historyData.busOptions}
        filters={historyData.filters}
        isAdmin={context.profile.role === "admin"}
        records={historyData.records}
      />

      {context.profile.role === "admin" ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <HistorySummaryTable
              description="Agrupa registros por semana para revisar tendencia operativa sin salir del modulo."
              rows={historyData.weeklySummary}
              title="Historial semanal"
            />
            <HistorySummaryTable
              description="Agrupa registros por mes para comparar volumen, neto calculado y diferencias."
              rows={historyData.monthlySummary}
              title="Historial mensual"
            />
          </section>

          <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Auditoria visible</CardTitle>
                <CardDescription>
                  Si necesitas revisar quien creo, actualizo o cerro un registro, abre la vista dedicada de auditoria.
                </CardDescription>
              </div>
              <Link
                className={buttonVariants({
                  variant: "secondary",
                })}
                href="/dashboard/audit"
              >
                Abrir auditoria
              </Link>
            </CardHeader>
          </Card>
        </>
      ) : null}
    </div>
  );
}
