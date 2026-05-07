import Link from "next/link";
import {
  BellRing,
  LockKeyhole,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

import {
  markAlertReadAction,
  markVisibleAlertsReadAction,
} from "@/app/dashboard/alerts/actions";
import { MobileActionTile } from "@/components/mobile/mobile-action-tile";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AlertListItem } from "@/lib/alerts";
import { requireAuth } from "@/lib/auth/session";
import { formatDateLabel, formatDateTime } from "@/lib/formatters";
import { getMobileAlertsViewData } from "@/lib/mobile";

function AlertCard({ alert }: { alert: AlertListItem }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-slate-900">
            {alert.profileName ?? "Sistema"}
          </p>
          <p className="text-xs font-medium text-slate-500">
            {alert.busCode ?? "Sin bus"} · {formatDateTime(alert.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge
            variant={
              alert.severity === "critical"
                ? "warning"
                : alert.severity === "warning"
                  ? "muted"
                  : "success"
            }
          >
            {alert.severity}
          </Badge>
          {!alert.read ? <Badge variant="default">Pendiente</Badge> : null}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{alert.message}</p>

      {!alert.read ? (
        <form action={markAlertReadAction} className="mt-4">
          <input name="alertId" type="hidden" value={alert.id} />
          <button
            className={buttonVariants({
              className: "w-full",
              variant: "outline",
            })}
            type="submit"
          >
            Marcar como leida
          </button>
        </form>
      ) : null}
    </div>
  );
}

export default async function MobileAlertsPage() {
  const context = await requireAuth({ redirectTo: "/mobile/alerts" });

  if (context.profile.role !== "admin") {
    return (
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Esta pestana sigue reservada a administracion, igual que en la web actual."
            title="Alertas para administracion"
          />
          <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              El registrador no recibe permisos nuevos en movil. Mantuvimos el
              mismo alcance que ya existe hoy.
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

  const viewData = await getMobileAlertsViewData();

  return (
    <div className="space-y-4">
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <MobileSectionHeader
              description="Priorizacion movil sobre alertas reales del sistema, con lectura y marcado conectados al modulo actual."
              title="Alertas"
            />
            <Badge variant="default">{formatDateLabel(viewData.businessDate)}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MobileStatCard
              helper="Alertas visibles que todavia no se han marcado como leidas."
              label="Pendientes"
              tone={viewData.unreadCount > 0 ? "warning" : "success"}
              value={String(viewData.unreadCount)}
            />
            <MobileStatCard
              helper="Alertas criticas todavia sin lectura."
              label="Criticas"
              tone={viewData.criticalUnread.length > 0 ? "danger" : "success"}
              value={String(viewData.criticalUnread.length)}
            />
            <MobileStatCard
              helper="Alertas warning visibles en la ventana movil actual."
              label="Warning"
              tone={viewData.warningCount > 0 ? "warning" : "default"}
              value={String(viewData.warningCount)}
            />
            <MobileStatCard
              helper="Total de alertas visibles en la vista movil actual."
              label="Visibles"
              value={String(viewData.totalCount)}
            />
          </div>

          {viewData.alertsReady && viewData.unreadCount > 0 ? (
            <form action={markVisibleAlertsReadAction}>
              <input name="busId" type="hidden" value={viewData.filters.busId ?? ""} />
              <input
                name="dateFrom"
                type="hidden"
                value={viewData.filters.dateFrom ?? ""}
              />
              <input
                name="dateTo"
                type="hidden"
                value={viewData.filters.dateTo ?? ""}
              />
              <input
                name="readState"
                type="hidden"
                value={viewData.filters.readState}
              />
              <input
                name="severity"
                type="hidden"
                value={viewData.filters.severity}
              />
              <button
                className={buttonVariants({
                  className: "w-full",
                  variant: "outline",
                })}
                type="submit"
              >
                Marcar visibles como leidas
              </button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {!viewData.alertsReady ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="space-y-3 p-5">
            <MobileSectionHeader
              description="La UI movil esta lista, pero el esquema de alertas todavia no esta disponible en este entorno."
              title="Alertas pendientes de migracion"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Lo mas urgente primero: criticas sin lectura en la ventana operativa actual."
            title="Atencion inmediata"
          />

          {viewData.criticalUnread.length === 0 ? (
            <MobileEmptyState
              description="No hay alertas criticas pendientes en este momento."
              icon={ShieldAlert}
              title="Sin alertas criticas pendientes"
            />
          ) : (
            <div className="space-y-3">
              {viewData.criticalUnread.map((alert) => (
                <AlertCard alert={alert} key={alert.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Pendientes no criticos que todavia requieren seguimiento."
            title="Pendientes"
          />

          {viewData.pendingAlerts.length === 0 ? (
            <MobileEmptyState
              description="No hay alertas pendientes adicionales para revisar."
              icon={BellRing}
              title="Sin pendientes extra"
            />
          ) : (
            <div className="space-y-3">
              {viewData.pendingAlerts.map((alert) => (
                <AlertCard alert={alert} key={alert.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Lectura reciente para conservar contexto despues de atender lo urgente."
            title="Recientes"
          />

          {viewData.recentAlerts.length === 0 ? (
            <MobileEmptyState
              description="No hay alertas recientes adicionales para mostrar."
              icon={TriangleAlert}
              title="Sin alertas recientes"
            />
          ) : (
            <div className="space-y-3">
              {viewData.recentAlerts.slice(0, 8).map((alert) => (
                <AlertCard alert={alert} key={alert.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Conecta alertas con el resto de las tareas operativas del dia."
            title="Siguientes pasos"
          />
          <div className="grid gap-3">
            <MobileActionTile
              description="Crear una deuda nueva desde la experiencia movil actual."
              href="/mobile/register/debts"
              icon={BellRing}
              label="Ir a Deudas"
            />
            <MobileActionTile
              description="Registrar un gasto complementario ligado a un borrador."
              href="/mobile/register/expenses"
              icon={TriangleAlert}
              label="Ir a Gastos"
            />
            <MobileActionTile
              description="Abrir el modulo web completo de alertas internas."
              href="/dashboard/alerts"
              icon={ShieldAlert}
              label="Abrir modulo completo"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
