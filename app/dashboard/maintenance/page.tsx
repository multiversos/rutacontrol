import { MaintenanceForm } from "@/components/maintenance-form";
import { MaintenanceTable } from "@/components/maintenance-table";
import { KpiCards } from "@/components/kpi-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/formatters";
import { getMaintenanceData, type MaintenanceStatusFilter } from "@/lib/maintenance";

type MaintenancePageProps = {
  searchParams?: Promise<{
    busId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }>;
};

export default async function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const status =
    params?.status === "up_to_date" ||
    params?.status === "due_soon" ||
    params?.status === "overdue"
      ? (params.status as MaintenanceStatusFilter)
      : "all";
  const maintenanceData = await getMaintenanceData({
    ...(params?.busId ? { busId: String(params.busId) } : {}),
    ...(params?.dateFrom ? { dateFrom: String(params.dateFrom) } : {}),
    ...(params?.dateTo ? { dateTo: String(params.dateTo) } : {}),
    status,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mantenimiento por bus</CardTitle>
          <CardDescription>
            Controla cambios de aceite, bandas, filtros, repuestos y servicios con
            deuda asociada, dias trabajados reales y proximo vencimiento operativo.
          </CardDescription>
        </CardHeader>
      </Card>

      <KpiCards
        items={[
          {
            helper: "Buses activos con ciclos de mantenimiento visibles",
            label: "Buses monitoreados",
            value: String(maintenanceData.summary.trackedBuses),
          },
          {
            helper: "Mantenimientos con umbral que ya estan cerca del limite",
            label: "Proximos a vencer",
            tone: maintenanceData.summary.dueSoonCount > 0 ? "warning" : "success",
            value: String(maintenanceData.summary.dueSoonCount),
          },
          {
            helper: "Ciclos que ya superaron su duracion esperada",
            label: "Vencidos",
            tone: maintenanceData.summary.overdueCount > 0 ? "danger" : "success",
            value: String(maintenanceData.summary.overdueCount),
          },
          {
            helper: "Saldo pendiente asociado a los mantenimientos visibles",
            label: "Deuda visible",
            tone:
              maintenanceData.summary.openDebtUsd > 0 ? "warning" : "success",
            value: formatCurrency(maintenanceData.summary.openDebtUsd),
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MaintenanceTable
          busOptions={maintenanceData.busOptions}
          currentCycles={maintenanceData.currentCycles}
          filters={{
            busId: maintenanceData.filters.busId ?? "",
            dateFrom: maintenanceData.filters.dateFrom!,
            dateTo: maintenanceData.filters.dateTo!,
            status: maintenanceData.filters.status!,
          }}
          historyByBus={maintenanceData.historyByBus}
          maintenanceRecords={maintenanceData.maintenanceRecords}
        />

        <div className="space-y-6">
          {!maintenanceData.migrationReady ? (
            <Card className="border-amber-200 bg-amber-50/70">
              <CardHeader>
                <CardTitle>Migraciones pendientes en Supabase</CardTitle>
                <CardDescription>
                  Aplica `0008_maintenance_repuestos.sql` y
                  `0009_maintenance_alerts.sql` para habilitar el modulo completo.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Registrar mantenimiento</CardTitle>
              <CardDescription>
                Usa este formulario para dejar trazabilidad por bus, por rueda y por
                deuda sin depender de calculos manuales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceData.migrationReady ? (
                <MaintenanceForm
                  buses={maintenanceData.busOptions.filter(
                    (bus) => bus.status !== "inactive",
                  )}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  El formulario quedara operativo apenas la base tenga las
                  migraciones nuevas aplicadas.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regla operativa del modulo</CardTitle>
              <CardDescription>
                El sistema cuenta dias trabajados a partir de registros diarios
                cerrados posteriores al mantenimiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                `Al dia`: el componente o servicio aun no consumio su umbral
                esperado.
              </p>
              <p>
                `Proximo a vencer`: quedan 3 dias o menos, o el 10% final del umbral,
                lo que resulte mayor.
              </p>
              <p>
                `Vencido`: ya alcanzo o supero los dias trabajados esperados.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
