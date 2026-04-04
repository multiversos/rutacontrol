import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/session";
import {
  findOperationalRouteInList,
  OPERATIONAL_ROUTE_DESTINATION,
  OPERATIONAL_ROUTE_LABEL,
  OPERATIONAL_ROUTE_NAME,
  OPERATIONAL_ROUTE_ORIGIN,
} from "@/lib/operational-route";
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

export default async function RoutesPage() {
  await requireRole("admin");
  const routes = await getRoutes();
  const operationalRoute = findOperationalRouteInList(routes);
  const hiddenHistoricalRoutes = Math.max(
    0,
    routes.filter((route) => !findOperationalRouteInList([route])).length,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badges={[
          { label: OPERATIONAL_ROUTE_LABEL, variant: "muted" },
          { label: "Pantalla interna", variant: "muted" },
        ]}
        description="RutaControl opera sobre una sola linea fija. Esta pantalla queda fuera del flujo diario y solo conserva compatibilidad interna."
        eyebrow="Compatibilidad"
        title="Trayecto operativo fijo"
      />

      <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]">
        <CardHeader>
          <CardTitle>Configuracion conservada por compatibilidad</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-border/80 bg-white/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Linea fija
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Nombre:</span>{" "}
                {OPERATIONAL_ROUTE_NAME}
              </p>
              <p>
                <span className="font-semibold text-foreground">Origen:</span>{" "}
                {OPERATIONAL_ROUTE_ORIGIN}
              </p>
              <p>
                <span className="font-semibold text-foreground">Destino:</span>{" "}
                {OPERATIONAL_ROUTE_DESTINATION}
              </p>
              <p>
                <span className="font-semibold text-foreground">Estado:</span>{" "}
                {operationalRoute?.active ? "Activa" : "Pendiente de asegurar"}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/80 bg-white/80 p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Como se usa ahora</p>
            <div className="mt-4 space-y-3">
              <p>
                Los buses nuevos y editados se vinculan automaticamente a la linea fija,
                sin exponer administracion multirruta en el flujo normal.
              </p>
              <p>
                {operationalRoute
                  ? "La ruta fija ya existe en base y se mantiene como referencia interna del sistema."
                  : "Si la ruta fija no existe todavia, el sistema la asegura automaticamente al guardar un bus."}
              </p>
              {hiddenHistoricalRoutes > 0 ? (
                <p>
                  Se conservan {hiddenHistoricalRoutes} rutas historicas fuera del flujo
                  principal para no romper compatibilidad con datos anteriores.
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
