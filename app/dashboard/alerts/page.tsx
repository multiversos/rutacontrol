import { AlertTable } from "@/components/alert-table";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAlertsData } from "@/lib/alerts";
import { requireRole } from "@/lib/auth/session";

type AlertsPageProps = {
  searchParams?: Promise<{
    busId?: string;
    dateFrom?: string;
    dateTo?: string;
    readState?: string;
    severity?: string;
  }>;
};

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const alertsData = await getAlertsData({
    busId: params?.busId ? String(params.busId) : undefined,
    dateFrom: params?.dateFrom ? String(params.dateFrom) : undefined,
    dateTo: params?.dateTo ? String(params.dateTo) : undefined,
    readState:
      params?.readState === "read" || params?.readState === "unread"
        ? params.readState
        : "all",
    severity:
      params?.severity === "info" ||
      params?.severity === "warning" ||
      params?.severity === "critical"
        ? params.severity
        : "all",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alertas internas</CardTitle>
          <CardDescription>
            Supervisa inicios de sesion del registrador, cierres completados,
            diferencias de caja, buses activos sin cierre y mantenimientos proximos a vencer o vencidos.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criterio de severidad</CardTitle>
          <CardDescription>
            `info` para login y cierre correcto, `warning` para buses sin cierre y
            mantenimientos proximos, `critical` para diferencias de 10 USD o mas y mantenimientos vencidos.
          </CardDescription>
        </CardHeader>
      </Card>

      <AlertTable
        alerts={alertsData.alerts}
        busOptions={alertsData.busOptions}
        filters={alertsData.filters}
      />

      {!alertsData.migrationReady ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader>
            <CardTitle>Migracion pendiente en Supabase</CardTitle>
            <CardDescription>
              La UI de alertas ya esta lista, pero el esquema `0004_internal_alerts.sql`
              todavia no esta aplicado en la base real. En cuanto se aplique, esta
              vista empezara a mostrar alertas sin cambios adicionales en la app.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
