import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { ConfigAlert } from "@/components/layout/config-alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasRequiredPublicEnv } from "@/lib/env";
import {
  getLoginErrorMessage,
  sanitizeRedirectPath,
} from "@/lib/auth/routing";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const redirectTo = sanitizeRedirectPath(params?.redirectTo ?? "/dashboard", null);
  const authErrorMessage = getLoginErrorMessage(
    params?.error ? String(params.error) : null,
  );
  const isConfigured = hasRequiredPublicEnv();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[36px] border border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] p-8 shadow-soft backdrop-blur lg:p-10">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">RutaControl</Badge>
              <Badge variant="muted">Operacion interna</Badge>
              <Badge variant="muted">Frontend polish</Badge>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Control diario, financiero y operativo en una sola consola.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                RutaControl ya corre con autenticacion real, cierres protegidos,
                alertas internas, finanzas y reportes. Esta fase afina la experiencia
                para que el producto se sienta claro, confiable y listo para operar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-white/80">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Acceso
                  </p>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    Roles y modulos privados
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Admin y registrador ven solo lo que necesitan para trabajar.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/80">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Operacion
                  </p>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    Cierre diario protegido
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Borradores, cierre automatico, hash y bloqueo post-cierre ya activos.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/80">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Control
                  </p>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    Monitoreo y finanzas
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Alertas, deudas, reparaciones y reportes visibles desde el panel.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section>
          <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]">
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <CardTitle>Acceso interno</CardTitle>
                <CardDescription>
                  Usa una cuenta real creada en Supabase Auth. El perfil en
                  `public.profiles` define permisos y aterrizaje por rol.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {authErrorMessage ? (
                <ConfigAlert
                  message={authErrorMessage}
                  title="Acceso no disponible"
                />
              ) : null}

              {!isConfigured ? (
                <ConfigAlert message="Completa las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para habilitar el login real." />
              ) : null}

              <LoginForm disabled={!isConfigured} redirectTo={redirectTo} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
