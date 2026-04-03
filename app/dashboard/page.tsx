import { ArrowRight, BusFront, CalendarDays, MapPinned } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDefaultDashboardPath } from "@/lib/auth/routing";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function getDashboardCounts() {
  const supabase = await createClient();
  const [routesResult, busesResult, draftsResult] = await Promise.all([
    supabase.from("routes").select("*", { count: "exact", head: true }),
    supabase.from("buses").select("*", { count: "exact", head: true }),
    supabase
      .from("daily_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
  ]);

  return {
    buses: busesResult.count ?? 0,
    drafts: draftsResult.count ?? 0,
    routes: routesResult.count ?? 0,
  };
}

export default async function DashboardPage() {
  const context = await requireAuth();

  if (context.profile.role === "registrador") {
    redirect(getDefaultDashboardPath(context.profile.role));
  }
  const counts = await getDashboardCounts();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Rutas disponibles</CardDescription>
            <CardTitle className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-primary" />
              <span>{counts?.routes ?? "--"}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Buses registrados</CardDescription>
            <CardTitle className="flex items-center gap-3">
              <BusFront className="h-5 w-5 text-primary" />
              <span>{counts?.buses ?? "--"}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Registros en borrador</CardDescription>
            <CardTitle className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>{counts?.drafts ?? "--"}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <Badge variant="muted">Sprint 1 operativo</Badge>
            <CardTitle>El MVP ya tiene sus modulos base en marcha.</CardTitle>
            <CardDescription>
              Rutas, buses y registros diarios ya viven sobre auth, RLS, triggers y
              layout protegido. Desde aqui el admin puede supervisar toda la operacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/routes">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Rutas</p>
                    <p className="text-sm text-muted-foreground">
                      Catalogo operativo con altas y edicion para administracion.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir modulo <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/buses">
              <Card className="h-full bg-white/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
                  <div className="space-y-2">
                    <p className="font-semibold">Buses</p>
                    <p className="text-sm text-muted-foreground">
                      Unidades ligadas a rutas fijas y estados operativos claros.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Abrir modulo <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobertura actual del MVP</CardTitle>
            <CardDescription>
              Estas son las capacidades que ya quedaron listas en Sprint 1.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>1. CRUD de rutas con Server Actions y validaciones.</p>
            <p>2. CRUD de buses con ruta obligatoria y control por rol.</p>
            <p>3. Formulario diario con calculo en vivo y bloqueo de duplicados.</p>
            <p>4. Tabla filtrable por fecha y por bus con principales montos financieros.</p>
            <p>5. Persistencia completa en Supabase con recalculo en SQL.</p>
            <Link
              className={buttonVariants({
                className: "w-full",
                variant: "secondary",
              })}
              href="/dashboard/daily/new"
            >
              Revisar formulario base
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
