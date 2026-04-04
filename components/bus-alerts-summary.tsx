import Link from "next/link";

import {
  AlertReadBadge,
  AlertSeverityBadge,
  AlertTypeBadge,
} from "@/components/alert-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AlertListItem } from "@/lib/alerts";
import { formatDateTime } from "@/lib/formatters";

type BusAlertsSummaryProps = {
  alerts: AlertListItem[];
  busId: string;
};

export function BusAlertsSummary({ alerts, busId }: BusAlertsSummaryProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Alertas relacionadas al bus</CardTitle>
            <CardDescription>
              Alertas recientes de cierres, diferencias y mantenimiento ligadas a
              esta unidad.
            </CardDescription>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href={`/dashboard/alerts?busId=${busId}`}
          >
            Abrir modulo de alertas
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            No hay alertas recientes asociadas a este bus.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-3xl border border-border/80 bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTypeBadge type={alert.alertType} />
                  <AlertSeverityBadge severity={alert.severity} />
                  <AlertReadBadge read={alert.read} />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{alert.message}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{formatDateTime(alert.createdAt)}</span>
                  {alert.profileName ? <span>Usuario: {alert.profileName}</span> : null}
                  {alert.busCode ? <span>Bus: {alert.busCode}</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
