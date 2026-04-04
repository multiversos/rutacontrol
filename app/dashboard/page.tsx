import Link from "next/link";
import { ArrowRight, AlertTriangle, CalendarDays, ShieldCheck } from "lucide-react";

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
import { requireRole } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";

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
      <Card>
        <CardHeader>
          <CardTitle>Dashboard admin</CardTitle>
          <CardDescription>
            Supervisa la fecha operativa, revisa diferencias abiertas y detecta
            buses pendientes sin salir del panel principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dashboard-date">
                Fecha operativa
              </label>
              <input
                className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
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
                className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
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
              className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              type="submit"
            >
              Aplicar
            </button>

            <Link
              className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
              href="/dashboard"
            >
              Limpiar
            </Link>
          </form>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="muted">
              Fecha {formatDateLabel(dashboardData.selectedDate)}
            </Badge>
            <p>
              Los KPIs se calculan sobre los registros visibles del dia y respetan los
              filtros aplicados.
            </p>
          </div>
        </CardContent>
      </Card>

      <KpiCards items={dashboardData.kpis} />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operacion visible para la fecha</CardTitle>
            <CardDescription>
              Registros encontrados para {formatDateLabel(dashboardData.selectedDate)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.records.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                No hay registros cargados para la fecha elegida. Puedes abrir el
                formulario diario o revisar el historial completo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[28px] border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/60 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Bus</th>
                      <th className="px-4 py-3">Registrador</th>
                      <th className="px-4 py-3">Ingreso USD</th>
                      <th className="px-4 py-3">Diferencia</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Cierre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white/70">
                    {dashboardData.records.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3 font-medium">{record.busCode}</td>
                        <td className="px-4 py-3">{record.userName ?? "--"}</td>
                        <td className="px-4 py-3">{formatCurrency(record.incomeUsd)}</td>
                        <td
                          className={
                            Math.abs(Number.parseFloat(record.difference)) >= 0.01
                              ? "px-4 py-3 font-semibold text-destructive"
                              : "px-4 py-3 font-semibold text-emerald-700"
                          }
                        >
                          {formatCurrency(record.difference)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              record.status === "closed" ? "success" : "warning"
                            }
                          >
                            {record.status === "closed" ? "Cerrado" : "Borrador"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
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
          <Card>
            <CardHeader>
              <CardTitle>Buses pendientes</CardTitle>
              <CardDescription>
                Unidades activas sin cierre visible para esta fecha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.pendingBuses.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

          <Card>
            <CardHeader>
              <CardTitle>Diferencias abiertas</CardTitle>
              <CardDescription>
                Registros con diferencia distinta de cero para la fecha operativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.differenceRecords.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Accesos administrativos</CardTitle>
            <CardDescription>
              Salta rapido al historial filtrable, catalogos y auditoria visible.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/daily">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Historial diario</p>
                    <p className="text-sm text-muted-foreground">
                      Revisa rango de fechas, bus, resumen semanal y mensual.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir historial <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/audit">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Auditoria</p>
                    <p className="text-sm text-muted-foreground">
                      Consulta quien creo, actualizo o cerro cada registro.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir auditoria <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/alerts">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Alertas internas</p>
                    <p className="text-sm text-muted-foreground">
                      Supervisa inicios de sesion, cierres, diferencias y buses sin cierre sin depender de canales externos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir alertas <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/debts">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Deudas</p>
                    <p className="text-sm text-muted-foreground">
                      Controla compromisos pendientes, pagos parciales y saldo abierto sin salir del panel.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir deudas <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/reports">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Reportes</p>
                    <p className="text-sm text-muted-foreground">
                      Consolida rentabilidad por bus y por ruta, con cierres semanales y mensuales descargables.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir reportes <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/intelligence">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Inteligencia</p>
                    <p className="text-sm text-muted-foreground">
                      Detecta anomalías de ingreso por ruta y revisa el score de confianza por registrador.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir inteligencia <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/repairs">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Reparaciones</p>
                    <p className="text-sm text-muted-foreground">
                      Registra comprobantes reales, consulta historial por unidad y visualiza el proximo servicio sugerido.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir reparaciones <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>

        <Card>
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
              <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                Todavia no hay eventos de auditoria visibles para mostrar.
              </div>
            ) : (
              dashboardData.auditPreview.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[24px] border border-border/80 bg-white/70 px-4 py-3"
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

      <Card className="border-amber-200 bg-amber-50/70">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-900">Lectura operativa del dia</p>
              <p className="text-sm text-amber-800">
                Si detectas buses pendientes o diferencias abiertas, el siguiente paso
                operativo es revisar el historial y luego el detalle del registro.
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
