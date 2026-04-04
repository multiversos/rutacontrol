import Link from "next/link";

import { RouteForm } from "@/components/routes/route-form";
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

async function getRoutes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routes")
    .select(
      "id, name, origin, destination, expected_income, active, created_at, updated_at",
    )
    .order("name");

  return data ?? [];
}

type RoutesPageProps = {
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export default async function RoutesPage({ searchParams }: RoutesPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const routes = await getRoutes();
  const selectedRoute = routes.find((route) => route.id === params?.edit) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href="/dashboard/routes"
          >
            Nueva ruta
          </Link>
        }
        badges={[{ label: `${routes.length} visibles`, variant: "muted" }]}
        description="Administra las rutas base que luego se asignan a cada unidad."
        eyebrow="Operacion"
        title="Rutas"
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
          <CardHeader>
            <CardTitle>Catalogo visible</CardTitle>
            <CardDescription>
              Mantiene origen, destino, ingreso esperado y estado operativo de cada ruta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {routes.length === 0 ? (
              <p className="rounded-[28px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                No hay rutas visibles todavia. Cuando apliques el `seed.sql` apareceran aqui.
              </p>
            ) : (
              <div className="overflow-hidden rounded-[30px] border border-border bg-card/95">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3">Origen</th>
                      <th className="px-4 py-3">Destino</th>
                      <th className="px-4 py-3 text-right">Ingreso esperado USD</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white/70">
                    {routes.map((route) => (
                      <tr key={route.id} className="transition-colors hover:bg-secondary/35">
                        <td className="px-4 py-4 font-semibold">{route.name}</td>
                        <td className="px-4 py-4">{route.origin}</td>
                        <td className="px-4 py-4">{route.destination}</td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          {route.expected_income ?? "--"}
                        </td>
                        <td className="px-4 py-4">{route.active ? "Activa" : "Inactiva"}</td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            className="text-sm font-semibold text-primary"
                            href={`/dashboard/routes?edit=${route.id}`}
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
            <CardTitle>{selectedRoute ? "Editar ruta" : "Crear ruta"}</CardTitle>
            <CardDescription>
              {selectedRoute
                ? "Actualiza la configuracion operativa de esta ruta."
                : "Registra una nueva ruta operativa para el sistema."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RouteForm key={selectedRoute?.id ?? "new-route"} route={selectedRoute} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
