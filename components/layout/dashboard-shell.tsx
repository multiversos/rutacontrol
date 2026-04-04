import Link from "next/link";
import {
  ArrowUpRight,
  LogOut,
} from "lucide-react";

import { signOutAction } from "@/app/dashboard/actions";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDefaultDashboardPath } from "@/lib/auth/routing";
import { ROLE_LABELS, type Profile } from "@/lib/auth/types";

type DashboardNavIcon =
  | "alerts"
  | "audit"
  | "bus"
  | "calendar"
  | "debt"
  | "dashboard"
  | "intelligence"
  | "repair"
  | "reports";

type DashboardShellProps = {
  children: React.ReactNode;
  profile: Profile;
};

export function DashboardShell({
  children,
  profile,
}: DashboardShellProps) {
  const navSections =
    profile.role === "admin"
      ? [
          {
            items: [
              {
                href: "/dashboard",
                icon: "dashboard" as DashboardNavIcon,
                label: "Resumen",
              },
              {
                href: "/dashboard/daily/new",
                icon: "calendar" as DashboardNavIcon,
                label: "Nuevo registro",
              },
              {
                href: "/dashboard/daily",
                icon: "calendar" as DashboardNavIcon,
                label: "Registros diarios",
              },
              {
                href: "/dashboard/buses",
                icon: "bus" as DashboardNavIcon,
                label: "Buses",
              },
            ],
            label: "Operacion",
          },
          {
            items: [
              {
                href: "/dashboard/alerts",
                icon: "alerts" as DashboardNavIcon,
                label: "Alertas",
              },
              {
                href: "/dashboard/audit",
                icon: "audit" as DashboardNavIcon,
                label: "Auditoria",
              },
            ],
            label: "Monitoreo",
          },
          {
            items: [
              {
                href: "/dashboard/debts",
                icon: "debt" as DashboardNavIcon,
                label: "Deudas",
              },
              {
                href: "/dashboard/repairs",
                icon: "repair" as DashboardNavIcon,
                label: "Reparaciones",
              },
            ],
            label: "Finanzas",
          },
          {
            items: [
              {
                href: "/dashboard/reports",
                icon: "reports" as DashboardNavIcon,
                label: "Reportes",
              },
              {
                href: "/dashboard/intelligence",
                icon: "intelligence" as DashboardNavIcon,
                label: "Inteligencia",
              },
            ],
            label: "Analisis",
          },
        ]
      : [
          {
            items: [
              {
                href: "/dashboard/daily/new",
                icon: "calendar" as DashboardNavIcon,
                label: "Nuevo registro",
              },
              {
                href: "/dashboard/daily",
                icon: "calendar" as DashboardNavIcon,
                label: "Mis registros",
              },
            ],
            label: "Operacion",
          },
        ];

  return (
    <div className="surface-grid min-h-screen bg-[length:22px_22px]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] gap-6 px-4 py-4 lg:grid-cols-[305px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[34px] border border-border/80 bg-card/90 p-5 shadow-soft backdrop-blur">
          <div className="space-y-6">
            <Link
              className="block"
              href={getDefaultDashboardPath(profile.role)}
            >
              <div className="space-y-4 rounded-[30px] bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary))/0.88)] px-5 py-6 text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
                  RutaControl
                </p>
                <div>
                  <p className="text-2xl font-semibold">
                    {profile.role === "admin" ? "Centro operativo" : "Cierre diario"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/82">
                    {profile.role === "admin"
                      ? "Operacion, monitoreo, finanzas y analisis reunidos para una sola linea fija."
                      : "Una vista rapida, limpia y enfocada para registrar el cierre diario sin distracciones."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/88">
                  <span>Entrar al panel</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <div className="space-y-4 rounded-[28px] border border-border/80 bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Sesion
              </p>
              <div className="space-y-2">
                <p className="text-base font-semibold">{profile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{ROLE_LABELS[profile.role]}</Badge>
                <Badge variant="muted">Frontend polish</Badge>
              </div>
            </div>

            <SidebarNav sections={navSections} />
          </div>
        </aside>

        <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-[34px] border border-border/80 bg-card/90 p-5 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                RutaControl
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {profile.role === "admin"
                  ? "Panel administrativo"
                  : "Registro operativo protegido"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile.role === "admin"
                  ? "Revisa operacion, alertas, finanzas y analisis de la linea fija con una navegacion mas clara."
                  : "Carga el cierre diario y consulta tus registros sin entrar al panel administrativo."}
              </p>
            </div>

            <form action={signOutAction}>
              <Button type="submit" variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesion
              </Button>
            </form>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
