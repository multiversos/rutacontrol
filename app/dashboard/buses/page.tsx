import Link from "next/link";

import { DeleteBusButton } from "@/components/buses/delete-bus-button";
import { BusPhoto } from "@/components/buses/bus-photo";
import { BusForm } from "@/components/buses/bus-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { getBusDeletionGuardMap } from "@/lib/bus-deletion";
import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import { isDemoBus } from "@/lib/demo-data";
import { OPERATIONAL_ROUTE } from "@/lib/operational-route";
import { createClient } from "@/lib/supabase/server";

function buildBusesPageHref(options?: {
  edit?: string;
  showInactive?: boolean;
}) {
  const searchParams = new URLSearchParams();

  if (options?.edit) {
    searchParams.set("edit", options.edit);
  }

  if (options?.showInactive) {
    searchParams.set("showInactive", "1");
  }

  const query = searchParams.toString();

  return query ? `/dashboard/buses?${query}` : "/dashboard/buses";
}

async function getBusContext(showInactive: boolean) {
  const supabase = await createClient();
  const { data: buses } = await supabase
    .from("buses")
    .select("id, code, plate, photo_path, route_id, status, created_at, updated_at")
    .order("code");

  const allVisibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const listedBuses = showInactive
    ? allVisibleBuses
    : allVisibleBuses.filter((bus) => bus.status !== "inactive");
  const photoMap = await getBusPhotoUrlMap(supabase, allVisibleBuses);
  const deleteGuardMap = await getBusDeletionGuardMap(
    allVisibleBuses.map((bus) => bus.id),
  );

  return {
    buses: listedBuses,
    deleteGuardMap,
    inactiveCount: allVisibleBuses.filter((bus) => bus.status === "inactive").length,
    photoMap,
    visibleBuses: allVisibleBuses,
  };
}

type BusesPageProps = {
  searchParams?: Promise<{
    edit?: string;
    showInactive?: string;
  }>;
};

export default async function BusesPage({ searchParams }: BusesPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const showInactive = params?.showInactive === "1";
  const { buses, deleteGuardMap, inactiveCount, photoMap, visibleBuses } =
    await getBusContext(showInactive);
  const selectedBus = visibleBuses.find((bus) => bus.id === params?.edit) ?? null;
  const selectedBusDeleteGuard = selectedBus
    ? deleteGuardMap.get(selectedBus.id) ?? null
    : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Buses</CardTitle>
              <CardDescription>
                Controla la flota real de la linea fija {OPERATIONAL_ROUTE.label} y
                abre la ficha historica de cada unidad para revisar operacion,
                finanzas, mantenimiento y reparaciones.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
                href={buildBusesPageHref({ showInactive })}
              >
                Nuevo bus
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
                href={buildBusesPageHref({
                  ...((params?.edit ? { edit: params.edit } : {}) as {
                    edit?: string;
                  }),
                  showInactive: !showInactive,
                })}
              >
                {showInactive ? "Ocultar inactivos" : "Mostrar inactivos"}
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {buses.length === 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {visibleBuses.length === 0
                  ? "Todavia no hay buses reales cargados para la linea fija."
                  : "No hay buses operativos visibles con el filtro actual."}
              </p>
              {!showInactive && inactiveCount > 0 ? (
                <p>
                  Hay {inactiveCount} unidad
                  {inactiveCount === 1 ? "" : "es"} inactiva
                  {inactiveCount === 1 ? "" : "s"} oculta
                  {inactiveCount === 1 ? "" : "s"} en la lista principal.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3">Placa</th>
                    <th className="px-4 py-3">Linea</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white/70">
                  {buses.map((bus) => (
                    <tr key={bus.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BusPhoto
                            code={bus.code}
                            photoUrl={photoMap.get(bus.id) ?? null}
                            size="sm"
                          />
                          <Link
                            className="font-medium text-primary transition-colors hover:text-primary/80"
                            href={`/dashboard/buses/${bus.id}`}
                          >
                            {bus.code}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">{bus.plate}</td>
                      <td className="px-4 py-3">{OPERATIONAL_ROUTE.label}</td>
                      <td className="px-4 py-3">{bus.status}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            className="text-sm font-semibold text-primary"
                            href={`/dashboard/buses/${bus.id}`}
                          >
                            Perfil
                          </Link>
                          <Link
                            className="text-sm font-semibold text-primary"
                            href={`/dashboard/buses?edit=${bus.id}`}
                          >
                            Editar
                          </Link>
                          <DeleteBusButton
                            blockers={deleteGuardMap.get(bus.id)?.blockers ?? []}
                            busCode={bus.code}
                            busId={bus.id}
                            canDelete={deleteGuardMap.get(bus.id)?.canDelete ?? false}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedBus ? "Editar bus" : "Crear bus"}</CardTitle>
          <CardDescription>
            {selectedBus
              ? "Actualiza la unidad, cambia su foto administrativa, dejala inactiva si hace falta o eliminela solo cuando no tenga historial asociado."
              : "Registra una unidad real de la linea fija y deja lista su foto administrativa desde este mismo panel."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusForm
            key={selectedBus?.id ?? "new-bus"}
            bus={selectedBus}
            deleteGuard={selectedBusDeleteGuard}
            photoUrl={selectedBus ? photoMap.get(selectedBus.id) ?? null : null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
