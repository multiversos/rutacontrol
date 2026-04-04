import Link from "next/link";

import { MaintenanceStatusBadge } from "@/components/maintenance-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  BusProfileComponentSection,
  BusProfileNextMaintenance,
} from "@/lib/bus-profile";
import type { MaintenanceCycleItem, MaintenanceRecordListItem } from "@/lib/maintenance";
import { MAINTENANCE_TYPE_LABELS } from "@/lib/maintenance-config";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";

type BusMaintenanceHistoryProps = {
  busId: string;
  componentHistory: BusProfileComponentSection[];
  currentCycles: MaintenanceCycleItem[];
  maintenanceRecords: MaintenanceRecordListItem[];
  nextMaintenance: BusProfileNextMaintenance | null;
};

export function BusMaintenanceHistory({
  busId,
  componentHistory,
  currentCycles,
  maintenanceRecords,
  nextMaintenance,
}: BusMaintenanceHistoryProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Mantenimiento y repuestos</CardTitle>
            <CardDescription>
              Historial tecnico de la unidad, ciclos vigentes, repuestos por
              componente y proximos cambios esperados.
            </CardDescription>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href={`/dashboard/maintenance?busId=${busId}`}
          >
            Abrir modulo de mantenimiento
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Proximo cambio esperado
            </p>
            {nextMaintenance ? (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{nextMaintenance.componentLabel}</p>
                  <MaintenanceStatusBadge status={nextMaintenance.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {nextMaintenance.workedDays} de {nextMaintenance.expectedWorkDays} dias
                  trabajados desde {formatDateLabel(nextMaintenance.serviceDate)}.
                </p>
                <p className="text-sm text-muted-foreground">
                  Faltan {nextMaintenance.remainingWorkDays} dias estimados.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No hay un mantenimiento proximo definido con la data actual.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ciclos vigentes
            </p>
            {currentCycles.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No hay ciclos activos registrados.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {currentCycles.map((cycle) => (
                  <div
                    key={`${cycle.maintenanceRecordId}-${cycle.componentPosition ?? cycle.componentLabel}`}
                    className="rounded-3xl border border-border/80 bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{cycle.componentLabel}</p>
                      <MaintenanceStatusBadge status={cycle.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {cycle.workedDays} / {cycle.expectedWorkDays} dias trabajados
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Servicio: {formatDateLabel(cycle.serviceDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Taller: {cycle.provider}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Historial general</h3>
            <p className="text-sm text-muted-foreground">
              Todos los servicios registrados para el bus, con costo, deuda
              asociada y estado operativo del ciclo.
            </p>
          </div>

          {maintenanceRecords.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              No hay mantenimientos registrados para esta unidad.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {maintenanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-3xl border border-border/80 bg-white/80 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">
                      {MAINTENANCE_TYPE_LABELS[record.maintenanceType]}
                    </p>
                    {record.currentCycle ? (
                      <MaintenanceStatusBadge status={record.currentCycle.status} />
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p>Fecha: {formatDateLabel(record.serviceDate)}</p>
                    <p>Costo: {formatCurrency(record.totalCostUsd)}</p>
                    <p>Taller/proveedor: {record.provider}</p>
                    <p>
                      Deuda asociada:{" "}
                      {record.debt?.id ? (
                        <Link
                          className="font-semibold text-primary"
                          href={`/dashboard/debts?pay=${record.debt.id}`}
                        >
                          Ver deuda
                        </Link>
                      ) : (
                        "Sin deuda"
                      )}
                    </p>
                  </div>
                  {record.notes ? (
                    <p className="mt-3 text-sm text-muted-foreground">{record.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Repuestos por componente</h3>
            <p className="text-sm text-muted-foreground">
              Seguimiento detallado por rueda o pieza critica para comparar
              duracion, costos y observaciones.
            </p>
          </div>

          {componentHistory.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              Esta unidad todavia no tiene componentes detallados registrados.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {componentHistory.map((section) => (
                <div
                  key={section.position}
                  className="rounded-3xl border border-border/80 bg-white/80 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold">{section.positionLabel}</h4>
                      <p className="text-sm text-muted-foreground">
                        Historial detallado del componente en esta posicion.
                      </p>
                    </div>
                    <Badge variant="muted">{section.entries.length} cambios</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {section.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-border/70 bg-muted/15 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{entry.description}</p>
                          {entry.currentStatus ? (
                            <MaintenanceStatusBadge status={entry.currentStatus} />
                          ) : null}
                        </div>
                        <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                          <p>Fecha: {formatDateLabel(entry.serviceDate)}</p>
                          <p>Costo: {formatCurrency(entry.costUsd)}</p>
                          <p>
                            Dias trabajados:{" "}
                            {entry.workedDays == null ? "--" : entry.workedDays}
                          </p>
                          <p>
                            Duracion esperada:{" "}
                            {entry.expectedWorkDays == null ? "--" : entry.expectedWorkDays}
                          </p>
                          <p>
                            Duracion del ciclo anterior:{" "}
                            {entry.previousCycleWorkDays == null
                              ? "--"
                              : entry.previousCycleWorkDays}
                          </p>
                          <p>Proveedor: {entry.provider}</p>
                        </div>
                        {entry.notes ? (
                          <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
