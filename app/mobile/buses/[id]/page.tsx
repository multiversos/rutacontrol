import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BellRing,
  CalendarDays,
  LockKeyhole,
  TriangleAlert,
  Wrench,
  WalletCards,
} from "lucide-react";

import { BusPhoto } from "@/components/buses/bus-photo";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileListItem } from "@/components/mobile/mobile-list-item";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";
import { getMobileBusProfileViewData } from "@/lib/mobile-buses";
import type { CalendarPeriodView } from "@/lib/periods";

type MobileBusProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    anchor?: string;
    view?: string;
  }>;
};

const statusLabelMap = {
  active: "Activo",
  inactive: "Inactivo",
  maintenance: "Mantenimiento",
} as const;

function buildProfileHref(busId: string, view: CalendarPeriodView, anchor: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("view", view);
  searchParams.set("anchor", anchor);

  return `/mobile/buses/${busId}?${searchParams.toString()}`;
}

export default async function MobileBusProfilePage({
  params,
  searchParams,
}: MobileBusProfilePageProps) {
  const resolvedParams = await params;
  const context = await requireAuth({
    redirectTo: `/mobile/buses/${resolvedParams.id}`,
  });
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (context.profile.role !== "admin") {
    return (
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="El perfil movil del bus conserva el mismo alcance admin del modulo web."
            title="Perfil restringido"
          />
          <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              No se abrieron permisos nuevos para perfiles de buses en movil.
              Vuelve a Inicio o entra con una sesion admin.
            </p>
          </div>
          <Link
            className={buttonVariants({
              className: "w-full",
              variant: "outline",
            })}
            href="/mobile"
          >
            Volver a Inicio
          </Link>
        </CardContent>
      </Card>
    );
  }

  const view =
    resolvedSearchParams?.view === "month" || resolvedSearchParams?.view === "week"
      ? (resolvedSearchParams.view as CalendarPeriodView)
      : "week";
  const profileData = await getMobileBusProfileViewData({
    ...(resolvedSearchParams?.anchor ? { anchor: resolvedSearchParams.anchor } : {}),
    busId: resolvedParams.id,
    view,
  });

  if (!profileData) {
    notFound();
  }

  const { currentPeriodSummary, debtActivity, movements, period, profile } = profileData;
  const summary = profile.summary;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(15,74,115,1),rgba(15,23,42,0.92))] text-white shadow-[0_22px_50px_rgba(15,23,42,0.24)]">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              className={buttonVariants({
                className: "bg-white/12 text-white hover:bg-white/20",
                variant: "ghost",
              })}
              href="/mobile/buses"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
            <Badge className="bg-white/12 text-white" variant="muted">
              Perfil del bus
            </Badge>
          </div>

          <div className="rounded-[28px] bg-white/10 p-4">
            <div className="flex items-center gap-4">
              <BusPhoto
                className="shrink-0 border-white/20 bg-white/10"
                code={summary.bus.code}
                photoUrl={summary.photoUrl}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-white">
                  {summary.bus.code}
                </p>
                <p className="truncate text-sm text-slate-200">
                  Placa {summary.bus.plate}
                </p>
                <p className="mt-1 text-sm text-slate-200">{summary.routeLabel}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/12 text-white" variant="muted">
                {statusLabelMap[summary.bus.status]}
              </Badge>
              <Badge className="bg-white/12 text-white" variant="muted">
                {summary.routeStatusLabel}
              </Badge>
              <Badge className="bg-emerald-400/18 text-emerald-50" variant="muted">
                Deuda abierta {formatCurrency(summary.pendingDebtUsd)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-200">
                Ultimo registro visible
              </p>
              <p className="mt-2 text-base font-semibold">
                {summary.lastOperationalRecord
                  ? formatDateLabel(summary.lastOperationalRecord.recordDate)
                  : "Sin registros visibles"}
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {summary.lastOperationalRecord
                  ? `Neto ${formatCurrency(summary.lastOperationalRecord.netUsd)}`
                  : "Todavia no hay cierre operativo visible"}
              </p>
            </div>

            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-200">
                Contexto tecnico
              </p>
              <p className="mt-2 text-base font-semibold">
                {summary.nextMaintenance
                  ? summary.nextMaintenance.componentLabel
                  : summary.parkedEstimate
                    ? `${summary.parkedEstimate.days} dias parado`
                    : "Sin alerta tecnica inmediata"}
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {summary.nextMaintenance
                  ? `${summary.nextMaintenance.workedDays} de ${summary.nextMaintenance.expectedWorkDays} dias trabajados`
                  : summary.parkedEstimate
                    ? summary.parkedEstimate.basis
                    : "No hay mantenimiento vencido destacado"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Elige una vista por semana real lunes-domingo o por mes calendario completo."
            title="Periodo visible"
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <Link
              aria-current={view === "week" ? "page" : undefined}
              className={
                view === "week"
                  ? buttonVariants({ className: "w-full" })
                  : buttonVariants({ className: "w-full", variant: "outline" })
              }
              href={buildProfileHref(summary.bus.id, "week", period.anchor)}
            >
              Vista semanal
            </Link>
            <Link
              aria-current={view === "month" ? "page" : undefined}
              className={
                view === "month"
                  ? buttonVariants({ className: "w-full" })
                  : buttonVariants({ className: "w-full", variant: "outline" })
              }
              href={buildProfileHref(summary.bus.id, "month", period.anchor)}
            >
              Vista mensual
            </Link>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{period.label}</p>
                <p className="mt-1 text-sm text-slate-500">{period.rangeLabel}</p>
              </div>
              <Badge variant="muted">
                {view === "week" ? "Lun a dom" : "Mes calendario"}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                className={buttonVariants({
                  className: "w-full",
                  variant: "outline",
                })}
                href={buildProfileHref(summary.bus.id, view, period.previousAnchor)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Periodo anterior
              </Link>
              <Link
                className={buttonVariants({
                  className: "w-full",
                  variant: "outline",
                })}
                href={buildProfileHref(summary.bus.id, view, period.nextAnchor)}
              >
                Periodo siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2">
        <MobileStatCard
          helper="Registros visibles del periodo actual."
          label="Registros"
          value={String(currentPeriodSummary.recordCount)}
        />
        <MobileStatCard
          helper="Dias distintos con actividad visible en el periodo."
          label="Dias con actividad"
          tone={currentPeriodSummary.daysOperated > 0 ? "success" : "default"}
          value={String(currentPeriodSummary.daysOperated)}
        />
        <MobileStatCard
          helper="Ingreso total visible en el periodo."
          label="Ingreso"
          value={formatCurrency(currentPeriodSummary.incomeUsd)}
        />
        <MobileStatCard
          helper="Gasto operativo total visible en el periodo."
          label="Gasto"
          value={formatCurrency(currentPeriodSummary.expenseUsd)}
        />
        <MobileStatCard
          helper="Neto visible del periodo actual."
          label="Neto"
          tone={currentPeriodSummary.netUsd >= 0 ? "success" : "danger"}
          value={formatCurrency(currentPeriodSummary.netUsd)}
        />
        <MobileStatCard
          helper="Diferencia acumulada visible del periodo."
          label="Diferencia"
          tone={Math.abs(currentPeriodSummary.differenceUsd) >= 0.01 ? "warning" : "success"}
          value={formatCurrency(currentPeriodSummary.differenceUsd)}
        />
        <MobileStatCard
          helper="Deudas creadas dentro del periodo visible."
          label="Deudas del periodo"
          tone={debtActivity.debtCount > 0 ? "warning" : "default"}
          value={`${debtActivity.debtCount} / ${formatCurrency(debtActivity.debtAmountUsd)}`}
        />
        <MobileStatCard
          helper="Abonos registrados dentro del periodo visible."
          label="Abonos del periodo"
          tone={debtActivity.paymentCount > 0 ? "success" : "default"}
          value={`${debtActivity.paymentCount} / ${formatCurrency(debtActivity.paymentAmountUsd)}`}
        />
      </section>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Lectura corta del periodo seleccionado usando solo datos reales del sistema."
            title="Contexto del periodo"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Alertas del periodo
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {profileData.alertsReady
                  ? String(profileData.alerts.length)
                  : "Pendiente de migracion"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {profileData.alertsReady
                  ? "Alertas reales filtradas por el rango visible."
                  : "Este entorno todavia no tiene el esquema de alertas disponible."}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Ultimo movimiento del periodo
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {movements[0]?.occurredAt
                  ? formatDateTime(movements[0].occurredAt)
                  : "Sin movimiento visible"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {currentPeriodSummary.closedRecordCount} cierres visibles y deuda abierta actual de{" "}
                {formatCurrency(debtActivity.openBalanceUsd)}.
              </p>
            </div>
          </div>

          {summary.nextMaintenance || summary.parkedEstimate ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.nextMaintenance ? (
                <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Proximo mantenimiento
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {summary.nextMaintenance.componentLabel}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {summary.nextMaintenance.workedDays} de {summary.nextMaintenance.expectedWorkDays} dias desde{" "}
                    {formatDateLabel(summary.nextMaintenance.serviceDate)}.
                  </p>
                </div>
              ) : null}

              {summary.parkedEstimate ? (
                <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Estimado de parada
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {summary.parkedEstimate.days} dias
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {summary.parkedEstimate.basis} desde {formatDateLabel(summary.parkedEstimate.baseDate)}.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Movimientos recientes del rango visible, sin comprimir tablas de escritorio."
            title="Movimientos del periodo"
          />

          {movements.length === 0 ? (
            <MobileEmptyState
              description="No hay movimientos visibles para este bus dentro del periodo seleccionado."
              icon={CalendarDays}
              title="Sin actividad en el periodo"
            />
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <MobileListItem
                  key={`${movement.kind}-${movement.id}`}
                  badge={
                    <Badge
                      variant={
                        movement.tone === "danger"
                          ? "warning"
                          : movement.tone === "success"
                            ? "success"
                            : movement.tone === "warning"
                              ? "warning"
                              : "muted"
                      }
                    >
                      {movement.kind === "record"
                        ? "Registro"
                        : movement.kind === "alert"
                          ? "Alerta"
                          : movement.kind === "debt"
                            ? "Deuda"
                            : "Abono"}
                    </Badge>
                  }
                  description={movement.description}
                  icon={
                    movement.kind === "record"
                      ? CalendarDays
                      : movement.kind === "alert"
                        ? TriangleAlert
                        : movement.kind === "debt"
                          ? WalletCards
                          : ArrowLeftRight
                  }
                  meta={`${movement.meta} - ${formatDateTime(movement.occurredAt)}`}
                  title={movement.title}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Accesos secundarios para ampliar la revision cuando haga falta."
            title="Siguientes pasos"
          />
          <div className="grid gap-3">
            <Link
              className={buttonVariants({
                className: "w-full",
                variant: "outline",
              })}
              href="/mobile/buses"
            >
              Volver a la lista de buses
            </Link>
            <Link
              className={buttonVariants({
                className: "w-full",
                variant: "outline",
              })}
              href={`/dashboard/buses/${summary.bus.id}`}
            >
              Abrir perfil web completo
            </Link>
            {profileData.alertsReady && profileData.alerts.length > 0 ? (
              <Link
                className={buttonVariants({
                  className: "w-full",
                  variant: "outline",
                })}
                href={`/dashboard/alerts?busId=${summary.bus.id}`}
              >
                <BellRing className="mr-2 h-4 w-4" />
                Abrir alertas del bus
              </Link>
            ) : null}
            {summary.nextMaintenance ? (
              <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
                <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  La proxima alerta tecnica destacada es {summary.nextMaintenance.componentLabel}
                  y sigue viniendo de la logica real de mantenimiento ya existente.
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
