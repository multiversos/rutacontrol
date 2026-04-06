import Link from "next/link";

import { BusPhoto } from "@/components/buses/bus-photo";
import { MaintenanceStatusBadge } from "@/components/maintenance-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";
import type { BusProfileSummary } from "@/lib/bus-profile";
import { cn } from "@/lib/utils";

const busStatusLabelMap = {
  active: "Activo",
  inactive: "Inactivo",
  maintenance: "En mantenimiento",
} as const;

const busStatusVariantMap = {
  active: "success",
  inactive: "muted",
  maintenance: "warning",
} as const;

type BusProfileHeaderProps = {
  summary: BusProfileSummary;
};

export function BusProfileHeader({ summary }: BusProfileHeaderProps) {
  const { bus, lastOperationalRecord, nextMaintenance, parkedEstimate } = summary;
  const routeLabel = summary.routeLabel.replaceAll("Ã‚Â·", "-").replaceAll("Â·", "-");

  return (
    <Card>
      <CardHeader className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <BusPhoto
              className="shrink-0"
              code={bus.code}
              photoUrl={summary.photoUrl}
              size="lg"
            />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={busStatusVariantMap[bus.status]}>
                  {busStatusLabelMap[bus.status]}
                </Badge>
                <Badge variant="muted">{summary.routeStatusLabel}</Badge>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl tracking-tight">
                  {bus.code} - {bus.plate}
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm">
                  Ficha historica completa de la unidad, con operacion diaria,
                  finanzas, mantenimiento, repuestos, deudas y reparaciones en una
                  sola vista.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Linea operativa: {routeLabel}</span>
                <span>Creado: {formatDateLabel(bus.created_at.slice(0, 10))}</span>
                <span>
                  Ultima actualizacion: {formatDateLabel(bus.updated_at.slice(0, 10))}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href="/dashboard/buses"
            >
              Volver a buses
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "default" }))}
              href={`/dashboard/buses?edit=${bus.id}`}
            >
              Editar unidad
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ultimo registro diario
          </p>
          {lastOperationalRecord ? (
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold">
                {formatDateLabel(lastOperationalRecord.recordDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                Neto {formatCurrency(lastOperationalRecord.netUsd)} - Diferencia{" "}
                {formatCurrency(lastOperationalRecord.difference)}
              </p>
              <p className="text-sm text-muted-foreground">
                Responsable: {lastOperationalRecord.userName ?? "Sin nombre"}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Esta unidad todavia no tiene cierres historicos visibles.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Deuda pendiente total
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {formatCurrency(summary.pendingDebtUsd)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Incluye deudas ligadas a operacion diaria y mantenimientos del bus.
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Proximo mantenimiento importante
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
                Taller/proveedor: {nextMaintenance.provider}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No hay ciclos vigentes registrados para esta unidad.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Estado de parada
          </p>
          {parkedEstimate ? (
            <div className="mt-3 space-y-1">
              <p className="text-2xl font-semibold">{parkedEstimate.days} dias</p>
              <p className="text-sm text-muted-foreground">{parkedEstimate.basis}</p>
              <p className="text-sm text-muted-foreground">
                Base usada: {formatDateLabel(parkedEstimate.baseDate)}
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold">Sin parada activa</p>
              <p className="text-sm text-muted-foreground">
                La unidad no esta marcada como en mantenimiento o no hay base
                suficiente para estimar dias parada.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
