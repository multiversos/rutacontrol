import { RepairForm } from "@/components/repair-form";
import { RepairTable } from "@/components/repair-table";
import { KpiCards } from "@/components/kpi-cards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";
import { getRepairsData } from "@/lib/repairs";

type RepairsPageProps = {
  searchParams?: Promise<{
    busId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function RepairsPage({ searchParams }: RepairsPageProps) {
  const context = await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const repairsData = await getRepairsData({
    ...(params?.busId ? { busId: String(params.busId) } : {}),
    ...(params?.dateFrom ? { dateFrom: String(params.dateFrom) } : {}),
    ...(params?.dateTo ? { dateTo: String(params.dateTo) } : {}),
  });
  const totals = repairsData.repairs.reduce(
    (accumulator, repair) => ({
      nextServiceCount:
        accumulator.nextServiceCount + (repair.nextServiceDueDate ? 1 : 0),
      totalCostUsd: accumulator.totalCostUsd + Number.parseFloat(repair.costUsd),
      totalRepairs: accumulator.totalRepairs + 1,
      uniqueBuses: accumulator.uniqueBuses.add(repair.busId),
    }),
    {
      nextServiceCount: 0,
      totalCostUsd: 0,
      totalRepairs: 0,
      uniqueBuses: new Set<string>(),
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badges={[
          { label: `${repairsData.repairs.length} visibles`, variant: "muted" },
          { label: "Comprobante obligatorio", variant: "warning" },
        ]}
        description="Registra reparaciones con comprobante obligatorio, revisa historial por bus y deja visible el proximo servicio sugerido."
        eyebrow="Finanzas"
        title="Reparaciones por unidad"
      />

      <KpiCards
        items={[
          {
            helper: "Costo acumulado de las reparaciones visibles",
            label: "Costo visible",
            value: formatCurrency(totals.totalCostUsd),
          },
          {
            helper: "Cantidad de reparaciones en el rango filtrado",
            label: "Reparaciones visibles",
            value: String(totals.totalRepairs),
          },
          {
            helper: "Unidades afectadas dentro del filtro actual",
            label: "Buses con reparaciones",
            value: String(totals.uniqueBuses.size),
          },
          {
            helper: "Reparaciones que dejaron proximo servicio sugerido",
            label: "Siguientes servicios",
            tone: totals.nextServiceCount > 0 ? "warning" : "default",
            value: String(totals.nextServiceCount),
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <RepairTable
          busOptions={repairsData.busOptions}
          filters={{
            busId: repairsData.filters.busId ?? "",
            dateFrom: repairsData.filters.dateFrom!,
            dateTo: repairsData.filters.dateTo!,
          }}
          repairs={repairsData.repairs}
        />

        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
          <CardHeader>
            <CardTitle>Registrar reparacion</CardTitle>
            <CardDescription>
              La reparacion solo se guarda si el comprobante se sube a Supabase Storage y la base valida la operacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!repairsData.migrationReady ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                La migracion `0006_debts_repairs.sql` todavia no esta aplicada en Supabase real. Apenas se aplique, este formulario quedara listo para persistir reparaciones y comprobantes.
              </div>
            ) : (
              <RepairForm buses={repairsData.busOptions} currentUserId={context.profile.id} />
            )}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Un comprobante real es obligatorio. El sistema no acepta reparaciones completas sin archivo adjunto valido.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
        <CardHeader>
          <CardTitle>Proximo servicio sugerido por bus</CardTitle>
          <CardDescription>
            Esta lectura toma la ultima sugerencia registrada por unidad activa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-[30px] border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3">Proximo servicio</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {repairsData.suggestedServices.map((service) => (
                  <tr key={service.busId} className="transition-colors hover:bg-secondary/35">
                    <td className="px-4 py-4 font-semibold">{service.busCode}</td>
                    <td className="px-4 py-4">
                      {service.nextServiceDueDate ? (
                        <Badge variant="warning">
                          {formatDateLabel(service.nextServiceDueDate)}
                        </Badge>
                      ) : (
                        "Sin sugerencia"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {service.repairDate ? formatDateLabel(service.repairDate) : "--"}
                    </td>
                    <td className="px-4 py-4">
                      {service.notes?.trim() ? service.notes : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
