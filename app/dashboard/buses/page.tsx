import Link from "next/link";

import { BusForm } from "@/components/buses/bus-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function getBusContext() {
  const supabase = await createClient();
  const [{ data: buses }, { data: routes }] = await Promise.all([
    supabase
      .from("buses")
      .select("id, code, plate, route_id, status, created_at, updated_at")
      .order("code"),
    supabase.from("routes").select("id, name").order("name"),
  ]);

  return {
    buses: buses ?? [],
    routeMap: new Map((routes ?? []).map((route) => [route.id, route.name])),
    routes: routes ?? [],
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
  const { buses, routeMap, routes } = await getBusContext();
  const selectedBus = buses.find((bus) => bus.id === params?.edit) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Buses</CardTitle>
              <CardDescription>
                Revisa el estado de cada unidad y abre su ficha historica completa
                para ver operacion, finanzas, mantenimiento y reparaciones.
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
              No hay buses visibles todavia. El `seed.sql` deja tres ejemplos listos.
            </p>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Codigo</th>
                    <th className="px-4 py-3">Placa</th>
                    <th className="px-4 py-3">Ruta</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white/70">
                  {buses.map((bus) => (
                    <tr key={bus.id}>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          className="text-primary transition-colors hover:text-primary/80"
                          href={`/dashboard/buses/${bus.id}`}
                        >
                          {bus.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{bus.plate}</td>
                      <td className="px-4 py-3">
                        {routeMap.get(bus.route_id) ?? bus.route_id}
                      </td>
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
              ? "Actualiza los datos base de la unidad; su historia completa vive en la ficha del bus."
              : "Registra una unidad operativa para empezar a cargar su historia diaria y tecnica."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusForm
            key={selectedBus?.id ?? "new-bus"}
            bus={selectedBus}
            routes={routes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
