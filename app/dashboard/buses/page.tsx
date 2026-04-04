import Link from "next/link";

import { BusForm } from "@/components/buses/bus-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href="/dashboard/buses"
          >
            Nuevo bus
          </Link>
        }
        badges={[{ label: `${buses.length} visibles`, variant: "muted" }]}
        description="Cada unidad debe tener una ruta fija y un estado operativo claro."
        eyebrow="Operacion"
        title="Buses"
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
          <CardHeader>
            <CardTitle>Catalogo visible</CardTitle>
            <CardDescription>
              Revisa codigo, placa, ruta asignada y estado operativo de cada unidad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {buses.length === 0 ? (
              <p className="rounded-[28px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                No hay buses visibles todavia. El `seed.sql` deja tres ejemplos listos.
              </p>
            ) : (
              <div className="overflow-hidden rounded-[30px] border border-border bg-card/95">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Codigo</th>
                      <th className="px-4 py-3">Placa</th>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white/70">
                    {buses.map((bus) => (
                      <tr key={bus.id} className="transition-colors hover:bg-secondary/35">
                        <td className="px-4 py-4 font-semibold">{bus.code}</td>
                        <td className="px-4 py-4">{bus.plate}</td>
                        <td className="px-4 py-4">{routeMap.get(bus.route_id) ?? bus.route_id}</td>
                        <td className="px-4 py-4">{bus.status}</td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            className="text-sm font-semibold text-primary"
                            href={`/dashboard/buses?edit=${bus.id}`}
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
          <CardHeader>
            <CardTitle>{selectedBus ? "Editar bus" : "Crear bus"}</CardTitle>
            <CardDescription>
              {selectedBus
                ? "Actualiza la unidad y su relacion con la ruta."
                : "Registra una unidad operativa y asignale una ruta fija."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusForm key={selectedBus?.id ?? "new-bus"} bus={selectedBus} routes={routes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
