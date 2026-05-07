import Link from "next/link";
import {
  ExternalLink,
  LogOut,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";

import { signOutAction } from "@/app/dashboard/actions";
import { MobileActionTile } from "@/components/mobile/mobile-action-tile";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { getDefaultDashboardPath } from "@/lib/auth/routing";
import { ROLE_LABELS } from "@/lib/auth/types";

export default async function MobileMorePage() {
  const context = await requireAuth({ redirectTo: "/mobile/more" });
  const dashboardHref = getDefaultDashboardPath(context.profile.role);
  const extraLinks =
    context.profile.role === "admin"
      ? [
          {
            description: "Detalle complementario de gastos ligado a borradores.",
            href: "/mobile/register/expenses",
            label: "Gastos moviles",
          },
          {
            description: "Crear deudas y registrar abonos parciales desde telefono.",
            href: "/mobile/register/debts",
            label: "Deudas moviles",
          },
          {
            description: "Resumen completo de escritorio.",
            href: dashboardHref,
            label: "Dashboard web",
          },
          {
            description: "Modulo administrativo actual.",
            href: "/dashboard/debts",
            label: "Deudas",
          },
          {
            description: "Seguimiento tecnico actual.",
            href: "/dashboard/maintenance",
            label: "Mantenimiento",
          },
          {
            description: "Comprobantes e historial por unidad.",
            href: "/dashboard/repairs",
            label: "Reparaciones",
          },
        ]
      : [
          {
            description: "Detalle complementario de gastos ligado a tus borradores.",
            href: "/mobile/register/expenses",
            label: "Gastos moviles",
          },
          {
            description: "Formulario web actual dentro de la misma sesion.",
            href: "/dashboard/daily/new",
            label: "Nuevo registro",
          },
          {
            description: "Consulta de historial permitido para tu rol.",
            href: "/dashboard/daily",
            label: "Mis registros",
          },
        ];

  return (
    <div className="space-y-4">
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Datos de sesion, rol actual y accesos secundarios utiles."
            title="Cuenta y accesos"
          />

          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {context.profile.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {context.profile.email}
                  </p>
                </div>
              </div>
              <Badge variant="default">{ROLE_LABELS[context.profile.role]}</Badge>
            </div>

            <div className="mt-4 flex gap-3 rounded-[22px] bg-white px-4 py-3 text-sm text-slate-600">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                La shell movil conserva la sesion actual y sigue conectada al
                mismo backend, auth y reglas servidoras de la web.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {extraLinks.map((item) => (
              <MobileActionTile
                key={item.href}
                description={item.description}
                href={item.href}
                icon={ExternalLink}
                label={item.label}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="La salida reutiliza el flujo protegido actual y devuelve al login movil."
            title="Sesion y seguridad"
          />

          <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Si cierras sesion desde Android, el siguiente acceso vuelve a
              entrar por `/login?redirectTo=/mobile`.
            </p>
          </div>

          <form action={signOutAction}>
            <input name="redirectTo" type="hidden" value="/mobile" />
            <button
              className={buttonVariants({
                className: "w-full",
                variant: "outline",
              })}
              type="submit"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </button>
          </form>

          <Link
            className={buttonVariants({
              className: "w-full",
            })}
            href="/mobile"
          >
            Volver a Inicio
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
