import Link from "next/link";
import {
  LogOut,
} from "lucide-react";

import { signOutAction } from "@/app/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { getDefaultDashboardPath } from "@/lib/auth/routing";
import { ROLE_LABELS, type Profile } from "@/lib/auth/types";

type DashboardNavIcon =
  | "alerts"
  | "audit"
  | "bus"
  | "calendar"
  | "debt"
  | "dashboard"
  | "maintenance"
  | "repair"
  | "route";

type DashboardShellProps = {
  children: React.ReactNode;
  profile: Profile;
};

export function DashboardShell({
  children,
  profile,
}: DashboardShellProps) {
  const navItems =
    profile.role === "admin"
        ? [
          {
            href: "/dashboard",
            icon: "dashboard" as DashboardNavIcon,
            label: "Resumen",
          },
          {
            href: "/dashboard/routes",
            icon: "route" as DashboardNavIcon,
            label: "Rutas",
          },
          {
            href: "/dashboard/buses",
            icon: "bus" as DashboardNavIcon,
            label: "Buses",
          },
          {
            href: "/dashboard/daily",
            icon: "calendar" as DashboardNavIcon,
            label: "Registros diarios",
          },
          {
            href: "/dashboard/daily/new",
            icon: "calendar" as DashboardNavIcon,
            label: "Nuevo registro",
          },
          {
            href: "/dashboard/audit",
            icon: "audit" as DashboardNavIcon,
            label: "Auditoria",
          },
          {
            href: "/dashboard/debts",
            icon: "debt" as DashboardNavIcon,
            label: "Deudas",
          },
          {
            href: "/dashboard/maintenance",
            icon: "maintenance" as DashboardNavIcon,
            label: "Mantenimiento",
          },
          {
            href: "/dashboard/repairs",
            icon: "repair" as DashboardNavIcon,
            label: "Reparaciones",
          },
          {
            href: "/dashboard/alerts",
            icon: "alerts" as DashboardNavIcon,
            label: "Alertas",
          },
        ]
      : [
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
        ];

  return (
    <div className="surface-grid min-h-screen bg-[length:22px_22px]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[32px] border border-border/80 bg-card/90 p-5 shadow-soft backdrop-blur">
          <div className="space-y-6">
            <Link
              className="block"
              href={getDefaultDashboardPath(profile.role)}
            >
              <div className="space-y-2 rounded-[28px] bg-primary px-5 py-6 text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
                  RutaControl
                </p>
                <div>
                  <p className="text-2xl font-semibold">Operacion protegida</p>
                  <p className="mt-1 text-sm text-primary-foreground/80">
                    Operacion diaria, historial, auditoria, alertas internas, deudas, reparaciones y mantenimiento visibles para administracion.
                  </p>
                </div>
              </div>
            </Link>

            <div className="space-y-3 rounded-[28px] border border-border/80 bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Sesion
              </p>
              <div className="space-y-2">
                <p className="text-base font-semibold">
                  {profile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.email}
                </p>
              </div>
              <Badge variant="default">{ROLE_LABELS[profile.role]}</Badge>
            </div>

            <SidebarNav items={navItems} />
          </div>
        </aside>

        <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-[32px] border border-border/80 bg-card/90 p-5 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Operacion supervisada
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard protegido
              </h1>
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
