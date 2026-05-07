import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
  SquarePen,
} from "lucide-react";

import { MobileActionTile } from "@/components/mobile/mobile-action-tile";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileListItem } from "@/components/mobile/mobile-list-item";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";
import { getMobileHomeData } from "@/lib/mobile";
import {
  getMobileQuickActionSections,
  getMobileSectionIcon,
} from "@/lib/mobile-navigation";

export default async function MobileHomePage() {
  const context = await requireAuth({ redirectTo: "/mobile" });
  const homeData = await getMobileHomeData({
    role: context.profile.role,
    userId: context.user.id,
  });
  const quickActions = getMobileQuickActionSections(context.profile.role);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(15,74,115,1),rgba(15,23,42,0.92))] text-white shadow-[0_22px_50px_rgba(15,23,42,0.24)]">
        <CardContent className="space-y-4 p-5">
          <Badge className="bg-white/12 text-white" variant="muted">
            Home movil activo
          </Badge>

          <MobileSectionHeader
            description={
              homeData.mode === "admin"
                ? "Resumen operativo con KPIs, alertas y actividad reciente del dia."
                : "Resumen corto de tus registros y accesos utiles para seguir operando."
            }
            tone="inverse"
            title={
              homeData.mode === "admin"
                ? "Supervision rapida del dia"
                : "Operacion diaria en telefono"
            }
          />

          <div className="flex flex-wrap gap-2 text-xs text-slate-200">
            <Badge className="bg-white/12 text-white" variant="muted">
              Fecha {formatDateLabel(homeData.businessDate)}
            </Badge>
            <Badge className="bg-emerald-400/18 text-emerald-50" variant="muted">
              Sesion persistente si sigue valida
            </Badge>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2">
        {homeData.mode === "admin"
          ? homeData.kpis.map((item) => (
              <MobileStatCard
                key={item.label}
                helper={item.helper}
                label={item.label}
                tone={
                  item.tone === "danger"
                    ? "danger"
                    : item.tone === "warning"
                      ? "warning"
                      : item.tone === "success"
                        ? "success"
                        : "default"
                }
                value={item.value}
              />
            ))
          : [
              {
                helper: "Registros visibles para la fecha operativa actual.",
                label: "Registros del dia",
                value: String(homeData.todayRecordCount),
              },
              {
                helper: "Registros ya cerrados hoy.",
                label: "Cerrados",
                tone: "success" as const,
                value: String(homeData.closedTodayCount),
              },
              {
                helper: "Registros todavia en borrador.",
                label: "Borradores",
                tone: "warning" as const,
                value: String(homeData.draftTodayCount),
              },
              {
                helper: "Diferencias no resueltas en tus registros del dia.",
                label: "Diferencias abiertas",
                tone:
                  homeData.openDifferenceCount > 0 ? ("danger" as const) : ("success" as const),
                value: String(homeData.openDifferenceCount),
              },
            ].map((item) => (
              <MobileStatCard
                key={item.label}
                helper={item.helper}
                label={item.label}
                {...(item.tone ? { tone: item.tone } : {})}
                value={item.value}
              />
            ))}
      </section>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Navegacion principal de la experiencia movil, sin salir de la shell /mobile."
            title="Accesos rapidos"
          />
          <div className="grid gap-3">
            {quickActions.map((item) => (
              <MobileActionTile
                key={item.id}
                description={item.description}
                disabled={item.disabled}
                href={item.href}
                icon={getMobileSectionIcon(item.iconId)}
                label={item.label}
                {...(item.disabled ? { badge: "Solo admin" } : {})}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {homeData.mode === "admin" ? (
        <>
          <Card className="bg-white/88">
            <CardContent className="space-y-4 p-5">
              <MobileSectionHeader
                description="Alertas recientes reutilizando el modulo y reglas actuales."
                title="Alertas recientes"
              />

              {!homeData.alertsReady ? (
                <MobileEmptyState
                  description="La vista movil ya esta lista, pero el esquema de alertas todavia no esta disponible en este entorno."
                  icon={ShieldAlert}
                  title="Alertas pendientes de migracion"
                />
              ) : homeData.recentAlerts.length === 0 ? (
                <MobileEmptyState
                  description="No hay alertas recientes para mostrar con los filtros visibles del dia."
                  icon={BellRing}
                  title="Sin alertas recientes"
                />
              ) : (
                <div className="space-y-3">
                  {homeData.recentAlerts.map((alert) => (
                    <MobileListItem
                      key={alert.id}
                      badge={
                        <div className="flex flex-col items-end gap-2">
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
                          {!alert.read ? <Badge variant="default">Nueva</Badge> : null}
                        </div>
                      }
                      description={alert.message}
                      icon={BellRing}
                      meta={`${alert.busCode ?? "Sin bus"} - ${formatDateTime(alert.createdAt)}`}
                      title={alert.profileName ?? "Sistema"}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/88">
            <CardContent className="space-y-4 p-5">
              <MobileSectionHeader
                description="Registros visibles hoy para una lectura operativa inmediata."
                title="Actividad reciente"
              />

              {homeData.recentRecords.length === 0 ? (
                <MobileEmptyState
                  description="Todavia no hay registros visibles para mostrar en esta fecha operativa."
                  icon={ClipboardList}
                  title="Sin actividad visible"
                />
              ) : (
                <div className="space-y-3">
                  {homeData.recentRecords.map((record) => (
                    <MobileListItem
                      key={record.id}
                      badge={
                        <Badge
                          variant={record.status === "closed" ? "success" : "warning"}
                        >
                          {record.status === "closed" ? "Cerrado" : "Borrador"}
                        </Badge>
                      }
                      description={`Ingreso ${formatCurrency(record.incomeUsd)}`}
                      icon={CalendarDays}
                      meta={`Diferencia ${formatCurrency(record.difference)}`}
                      title={record.busCode}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-white/88">
          <CardContent className="space-y-4 p-5">
            <MobileSectionHeader
              description="Actividad reciente visible para tu usuario dentro del alcance actual."
              title="Mis registros recientes"
            />

            {homeData.recentRecords.length === 0 ? (
              <MobileEmptyState
                action={
                  <Link
                    className={buttonVariants({
                      className: "w-full",
                    })}
                    href="/mobile/register"
                  >
                    Ir a Registrar
                  </Link>
                }
                description="Aun no hay registros recientes para mostrar desde esta sesion."
                icon={SquarePen}
                title="Sin registros recientes"
              />
            ) : (
              <div className="space-y-3">
                {homeData.recentRecords.map((record) => (
                  <MobileListItem
                    key={record.id}
                    badge={
                      <Badge
                        variant={record.status === "closed" ? "success" : "warning"}
                      >
                        {record.status === "closed" ? "Cerrado" : "Borrador"}
                      </Badge>
                    }
                    description={`Diferencia visible ${formatCurrency(record.difference)}`}
                    icon={CalendarDays}
                    meta={formatDateLabel(record.recordDate)}
                    title={record.busCode}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
