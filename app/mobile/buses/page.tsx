import Link from "next/link";
import { Bus, LockKeyhole, Search, ShieldCheck } from "lucide-react";

import { BusIdentity } from "@/components/buses/bus-identity";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { formatDateLabel, formatDateTime } from "@/lib/formatters";
import { getMobileBusCatalog } from "@/lib/mobile-buses";

type MobileBusesPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

const statusLabelMap = {
  active: "Activo",
  inactive: "Inactivo",
  maintenance: "Mantenimiento",
} as const;

export default async function MobileBusesPage({
  searchParams,
}: MobileBusesPageProps) {
  const context = await requireAuth({ redirectTo: "/mobile/buses" });

  if (context.profile.role !== "admin") {
    return (
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="La vista movil de buses sigue reservada al administrador para no abrir permisos nuevos."
            title="Seccion restringida"
          />
          <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Puedes seguir operando desde Inicio y Registrar. Si necesitas
              revisar perfiles de buses, entra con un perfil admin.
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

  const params = searchParams ? await searchParams : undefined;
  const status =
    params?.status === "active" ||
    params?.status === "inactive" ||
    params?.status === "maintenance"
      ? params.status
      : "all";
  const catalog = await getMobileBusCatalog({
    ...(params?.q ? { query: String(params.q) } : {}),
    status,
  });

  return (
    <div className="space-y-4">
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <MobileSectionHeader
              description="Catalogo movil real de la flota, con busqueda simple y acceso tocable al perfil de cada unidad."
              title="Buses"
            />
            <Badge variant="default">Solo admin</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MobileStatCard
              helper="Unidades activas visibles."
              label="Activos"
              tone="success"
              value={String(catalog.counts.active)}
            />
            <MobileStatCard
              helper="Unidades en mantenimiento visibles."
              label="Mantenimiento"
              tone="warning"
              value={String(catalog.counts.maintenance)}
            />
            <MobileStatCard
              helper="Unidades inactivas visibles."
              label="Inactivos"
              value={String(catalog.counts.inactive)}
            />
          </div>

          <form className="grid gap-3" method="get">
            <div className="space-y-2">
              <Label htmlFor="bus-search">Buscar unidad</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  defaultValue={catalog.filters.query}
                  id="bus-search"
                  name="q"
                  placeholder="Buscar por codigo o placa"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="bus-status-filter">Estado</Label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
                  defaultValue={catalog.filters.status}
                  id="bus-status-filter"
                  name="status"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              <button
                className={buttonVariants({
                  className: "w-full sm:w-auto",
                })}
                type="submit"
              >
                Aplicar
              </button>

              <Link
                className={buttonVariants({
                  className: "w-full sm:w-auto",
                  variant: "outline",
                })}
                href="/mobile/buses"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Toca una unidad para abrir su perfil movil con resumen semanal y mensual."
            title="Lista de unidades"
          />

          {catalog.buses.length === 0 ? (
            <MobileEmptyState
              description={
                catalog.totalVisible === 0
                  ? "No hay buses visibles para mostrar en este momento."
                  : "No encontramos buses con esos filtros."
              }
              icon={Bus}
              title="Sin resultados"
            />
          ) : (
            <div className="space-y-3">
              {catalog.buses.map((bus) => (
                <Link
                  className="block rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 transition-colors hover:border-slate-300 hover:bg-white"
                  href={`/mobile/buses/${bus.id}`}
                  key={bus.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <BusIdentity
                      className="min-w-0"
                      code={bus.code}
                      photoUrl={bus.photoUrl}
                      plate={bus.plate}
                      secondaryText="Perfil movil del bus"
                      size="sm"
                      wrap
                    />
                    <Badge
                      variant={
                        bus.status === "active"
                          ? "success"
                          : bus.status === "maintenance"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {statusLabelMap[bus.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Ultimo registro
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {bus.lastRecord
                          ? formatDateLabel(bus.lastRecord.recordDate)
                          : "Sin registros"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {bus.lastRecord
                          ? bus.lastRecord.status === "closed"
                            ? "Cierre completo"
                            : "Borrador visible"
                          : "Todavia no hay actividad visible"}
                      </p>
                    </div>

                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Ultimo movimiento
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {bus.lastRecord
                          ? formatDateTime(bus.lastRecord.updatedAt)
                          : formatDateLabel(bus.updatedAt.slice(0, 10))}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {bus.lastRecord ? "Actualizacion del cierre" : "Actualizacion del catalogo"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Accesos secundarios cuando haga falta salir a la vista web completa."
            title="Siguientes pasos"
          />
          <div className="grid gap-3">
            <Link
              className={buttonVariants({
                className: "w-full",
                variant: "outline",
              })}
              href="/dashboard/buses"
            >
              Abrir catalogo web completo
            </Link>
            <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                El perfil movil reutiliza los mismos datos del sistema y no abre
                permisos nuevos fuera del alcance admin actual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
