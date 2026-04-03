import Link from "next/link";

import { RouteForm } from "@/components/routes/route-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const selectedRoute =
    routes.find((route) => route.id === params?.edit) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Rutas</CardTitle>
              <CardDescription>
                Administra las rutas base que luego se asignan a cada unidad.
              </CardDescription>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
              href="/dashboard/routes"
            >
              Nueva ruta
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay rutas visibles todavia. Cuando apliques el `seed.sql` apareceran
              aqui.
            </p>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Ruta</th>
                    <th className="px-4 py-3">Origen</th>
                    <th className="px-4 py-3">Destino</th>
                    <th className="px-4 py-3">Ingreso esperado USD</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white/70">
                  {routes.map((route) => (
                    <tr key={route.id}>
                      <td className="px-4 py-3 font-medium">{route.name}</td>
                      <td className="px-4 py-3">{route.origin}</td>
                      <td className="px-4 py-3">{route.destination}</td>
                      <td className="px-4 py-3">{route.expected_income ?? "--"}</td>
                      <td className="px-4 py-3">
                        {route.active ? "Activa" : "Inactiva"}
                      </td>
                      <td className="px-4 py-3 text-right">
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

      <Card>
        <CardHeader>
          <CardTitle>{selectedRoute ? "Editar ruta" : "Crear ruta"}</CardTitle>
          <CardDescription>
            {selectedRoute
              ? "Actualiza la configuracion operativa de esta ruta."
              : "Registra una nueva ruta operativa para el sistema."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RouteForm
            key={selectedRoute?.id ?? "new-route"}
            route={selectedRoute}
          />
        </CardContent>
      </Card>
    </div>
  );
}
