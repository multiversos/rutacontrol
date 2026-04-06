import Link from "next/link";

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
import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import { isDemoBus } from "@/lib/demo-data";
import { OPERATIONAL_ROUTE } from "@/lib/operational-route";
import { createClient } from "@/lib/supabase/server";

async function getBusContext() {
  const supabase = await createClient();
  const { data: buses } = await supabase
    .from("buses")
    .select("id, code, plate, photo_path, route_id, status, created_at, updated_at")
    .order("code");

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses);

  return {
    buses: visibleBuses,
    photoMap,
  };
}

type BusesPageProps = {
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export default async function BusesPage({ searchParams }: BusesPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const { buses, photoMap } = await getBusContext();
  const selectedBus = buses.find((bus) => bus.id === params?.edit) ?? null;

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
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
              href="/dashboard/buses"
            >
              Nuevo bus
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {buses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavia no hay buses reales cargados para la linea fija.
            </p>
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
              ? "Actualiza la unidad, cambia su foto administrativa y mantenla lista para la operacion diaria."
              : "Registra una unidad real de la linea fija y deja lista su foto administrativa desde este mismo panel."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusForm
            key={selectedBus?.id ?? "new-bus"}
            bus={selectedBus}
            photoUrl={selectedBus ? photoMap.get(selectedBus.id) ?? null : null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
