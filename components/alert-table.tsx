import Link from "next/link";

import {
  markAlertReadAction,
  markVisibleAlertsReadAction,
} from "@/app/dashboard/alerts/actions";
import {
  AlertReadBadge,
  AlertSeverityBadge,
  AlertTypeBadge,
} from "@/components/alert-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatters";
import type { AlertFilters, AlertListItem } from "@/lib/alerts";

type AlertBusOption = {
  code: string;
  id: string;
};

type AlertTableProps = {
  alerts: AlertListItem[];
  busOptions: AlertBusOption[];
  filters: AlertFilters;
};

export function AlertTable({ alerts, busOptions, filters }: AlertTableProps) {
  const unreadCount = alerts.filter((alert) => !alert.read).length;

  return (
    <div className="space-y-4">
      <form className="grid gap-4 rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.92))] p-5 shadow-soft md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="alerts-date-from">
            Desde
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateFrom ?? ""}
            id="alerts-date-from"
            name="dateFrom"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="alerts-date-to">
            Hasta
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateTo ?? ""}
            id="alerts-date-to"
            name="dateTo"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="alerts-severity">
            Severidad
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.severity}
            id="alerts-severity"
            name="severity"
          >
            <option value="all">Todas</option>
            <option value="info">Info</option>
            <option value="warning">Advertencia</option>
            <option value="critical">Critica</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="alerts-read-state">
            Estado
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.readState}
            id="alerts-read-state"
            name="readState"
          >
            <option value="all">Todas</option>
            <option value="unread">No leidas</option>
            <option value="read">Leidas</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="alerts-bus">
            Bus
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.busId ?? ""}
            id="alerts-bus"
            name="busId"
          >
            <option value="">Todos los buses</option>
            {busOptions.map((bus) => (
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
          Aplicar filtros
        </button>

        <Link
          className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
          href="/dashboard/alerts"
        >
          Limpiar
        </Link>
      </form>

      <div className="flex flex-col gap-3 rounded-[30px] border border-border bg-card/95 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Alertas visibles</p>
          <p className="text-sm text-muted-foreground">
            {alerts.length} alerta(s) en el rango actual, {unreadCount} sin leer.
          </p>
        </div>

        <form action={markVisibleAlertsReadAction}>
          <input name="busId" type="hidden" value={filters.busId ?? ""} />
          <input name="dateFrom" type="hidden" value={filters.dateFrom ?? ""} />
          <input name="dateTo" type="hidden" value={filters.dateTo ?? ""} />
          <input name="readState" type="hidden" value={filters.readState} />
          <input name="severity" type="hidden" value={filters.severity} />
          <button
            className={buttonVariants({
              variant: "secondary",
            })}
            disabled={unreadCount === 0}
            type="submit"
          >
            Marcar visibles como leidas
          </button>
        </form>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          No hay alertas para los filtros seleccionados. Prueba otro rango, otro bus o cambia la severidad para revisar el estado operativo.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[30px] border border-border bg-card/95 shadow-soft">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Severidad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Bus</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white/70">
              {alerts.map((alert) => (
                <tr key={alert.id} className="transition-colors hover:bg-secondary/35">
                  <td className="whitespace-nowrap px-4 py-4">{formatDateTime(alert.createdAt)}</td>
                  <td className="px-4 py-4">
                    <AlertTypeBadge type={alert.alertType} />
                  </td>
                  <td className="px-4 py-4">
                    <AlertSeverityBadge severity={alert.severity} />
                  </td>
                  <td className="px-4 py-4">
                    <AlertReadBadge read={alert.read} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-medium">{alert.busCode ?? "--"}</td>
                  <td className="px-4 py-4">
                    {alert.dailyRecordId ? (
                      <Link
                        className="font-mono text-xs text-primary"
                        href={`/dashboard/daily/new?recordId=${alert.dailyRecordId}`}
                      >
                        {alert.dailyRecordId}
                      </Link>
                    ) : (
                      "--"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p>{alert.message}</p>
                      {alert.profileName ? (
                        <p className="text-xs text-muted-foreground">
                          Usuario relacionado: {alert.profileName}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <form action={markAlertReadAction}>
                      <input name="alertId" type="hidden" value={alert.id} />
                      <button
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                        disabled={alert.read}
                        type="submit"
                      >
                        {alert.read ? "Leida" : "Marcar leida"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
