import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, ShieldCheck } from "lucide-react";

import { KpiCards } from "@/components/kpi-cards";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";
import { OPERATIONAL_ROUTE_LABEL } from "@/lib/operational-route";

type DashboardPageProps = {
  searchParams?: Promise<{
    busId?: string;
    date?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const dashboardData = await getAdminDashboardData({
    busId: params?.busId ? String(params.busId) : undefined,
    date: params?.date ? String(params.date) : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badges={[
          { label: `Fecha ${formatDateLabel(dashboardData.selectedDate)}`, variant: "muted" },
          { label: OPERATIONAL_ROUTE_LABEL, variant: "muted" },
          {
            label: dashboardData.filters.busId ? "Bus filtrado" : "Todos los buses",
            variant: "muted",
          },
        ]}
        description="Supervisa la operacion diaria de la linea fija, detecta diferencias abiertas y resuelve buses pendientes sin salir del panel principal."
        eyebrow="Control admin"
        title="Dashboard operativo"
      />

      <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
          <CardHeader>
            <CardTitle>Filtro rapido del panel</CardTitle>
            <CardDescription>
              Ajusta la fecha operativa y enfoca el resumen por bus dentro de la linea fija.
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dashboard-date">
                Fecha operativa
              </label>
              <input
                className="flex h-12 w-full rounded-[20px] border border-input/90 bg-white/95 px-4 py-3 text-sm"
                defaultValue={dashboardData.filters.date}
                id="dashboard-date"
                name="date"
                type="date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dashboard-bus">
                Filtrar por bus
              </label>
              <select
                className="flex h-12 w-full rounded-[20px] border border-input/90 bg-white/95 px-4 py-3 text-sm"
                defaultValue={dashboardData.filters.busId ?? ""}
                id="dashboard-bus"
                name="busId"
              >
                <option value="">Todos los buses</option>
                {dashboardData.busOptions.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.code}
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

            <Link
              className="inline-flex h-12 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
              href="/dashboard"
            >
              Limpiar
            </Link>
          </form>

          <div className="grid gap-3 rounded-[24px] bg-secondary/35 p-4 text-sm text-muted-foreground md:grid-cols-[auto_1fr] md:items-center">
            <Badge variant="muted">KPIs activos</Badge>
            <p>
              Las metricas del panel se recalculan solo con los registros visibles del dia y respetan todos los filtros aplicados.
            </p>
          </div>
        </CardContent>
      </Card>

      <KpiCards items={dashboardData.kpis} />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
          <CardHeader>
            <CardTitle>Operacion visible para la fecha</CardTitle>
            <CardDescription>
              Registros encontrados para {formatDateLabel(dashboardData.selectedDate)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.records.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                No hay registros cargados para la fecha elegida. Puedes abrir el formulario diario o revisar el historial completo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[30px] border border-border bg-card/95">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Bus</th>
                      <th className="px-4 py-3">Registrador</th>
                      <th className="px-4 py-3 text-right">Ingreso USD</th>
                      <th className="px-4 py-3 text-right">Diferencia</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Cierre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white/70">
                    {dashboardData.records.map((record) => (
                      <tr key={record.id} className="transition-colors hover:bg-secondary/35">
                        <td className="px-4 py-4 font-semibold">{record.busCode}</td>
                        <td className="px-4 py-4">{record.userName ?? "--"}</td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          {formatCurrency(record.incomeUsd)}
                        </td>
                        <td
                          className={
                            Math.abs(Number.parseFloat(record.difference)) >= 0.01
                              ? "px-4 py-4 text-right font-semibold tabular-nums text-destructive"
                              : "px-4 py-4 text-right font-semibold tabular-nums text-emerald-700"
                          }
                        >
                          {formatCurrency(record.difference)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={record.status === "closed" ? "success" : "warning"}>
                            {record.status === "closed" ? "Cerrado" : "Borrador"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {record.closedAt ? formatDateTime(record.closedAt) : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
            <CardHeader>
              <CardTitle>Buses pendientes</CardTitle>
              <CardDescription>
                Unidades activas sin cierre visible para esta fecha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.pendingBuses.length === 0 ? (
                <div className="rounded-[24px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  No hay buses pendientes con los filtros actuales.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {dashboardData.pendingBuses.map((busCode) => (
                    <Badge key={busCode} variant="warning">
                      {busCode}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
            <CardHeader>
              <CardTitle>Diferencias abiertas</CardTitle>
              <CardDescription>
                Registros con difference distinta de cero para la fecha operativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.differenceRecords.length === 0 ? (
                <div className="rounded-[24px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  No hay diferencias abiertas en el alcance visible.
                </div>
              ) : (
                dashboardData.differenceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-[24px] border border-destructive/20 bg-destructive/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{record.busCode}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.userName ?? "Usuario no disponible"}
                        </p>
                      </div>
                      <p className="font-semibold text-destructive">
                        {formatCurrency(record.difference)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
          <CardHeader>
            <CardTitle>Accesos administrativos</CardTitle>
            <CardDescription>
              Salta rapido a operacion, monitoreo, finanzas y analisis sin perder contexto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                description: "Revisa rango de fechas, bus, resumen semanal y mensual.",
                href: "/dashboard/daily",
                label: "Historial diario",
              },
              {
                description: "Consulta quien creo, actualizo o cerro cada registro.",
                href: "/dashboard/audit",
                label: "Auditoria",
              },
              {
                description: "Supervisa logins, cierres, diferencias y buses sin cierre.",
                href: "/dashboard/alerts",
                label: "Alertas internas",
              },
              {
                description: "Controla compromisos pendientes, pagos parciales y saldo abierto.",
                href: "/dashboard/debts",
                label: "Deudas",
              },
              {
                description: "Consulta rentabilidad por bus y por la linea fija, con cierres descargables.",
                href: "/dashboard/reports",
                label: "Reportes",
              },
              {
                description: "Detecta anomalias de ingreso sobre la linea fija y revisa confianza por registrador.",
                href: "/dashboard/intelligence",
                label: "Inteligencia",
              },
              {
                description: "Registra comprobantes reales y revisa historial por unidad.",
                href: "/dashboard/repairs",
                label: "Reparaciones",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full border-border/70 bg-white/80 transition-transform hover:-translate-y-0.5">
                  <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                    <div className="space-y-2">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      Abrir modulo <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Auditoria reciente</CardTitle>
                <CardDescription>
                  Ultimos eventos visibles sobre registros diarios.
                </CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.auditPreview.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                Todavia no hay eventos de auditoria visibles para mostrar.
              </div>
            ) : (
              dashboardData.auditPreview.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[24px] border border-border/80 bg-white/75 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.note}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.actorName} · {entry.busCode ?? "Sin bus"} ·{" "}
                        {entry.recordDate ? formatDateLabel(entry.recordDate) : "--"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>{formatDateTime(entry.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <Link
              className={buttonVariants({
                className: "w-full",
                variant: "secondary",
              })}
              href="/dashboard/audit"
            >
              Ver auditoria completa
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card className="border-amber-200 bg-amber-50/80">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-900">Lectura operativa del dia</p>
              <p className="text-sm text-amber-800">
                Si detectas buses pendientes o diferencias abiertas, el siguiente paso operativo es revisar el historial y luego el detalle del registro.
              </p>
            </div>
          </div>
          <Link
            className={buttonVariants({
              variant: "outline",
            })}
            href={`/dashboard/daily?dateFrom=${dashboardData.selectedDate}&dateTo=${dashboardData.selectedDate}`}
          >
            Revisar historial del dia
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
