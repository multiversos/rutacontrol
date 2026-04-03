import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { ConfigAlert } from "@/components/layout/config-alert";
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
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-border/80 bg-card/90 p-8 shadow-soft backdrop-blur lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
              Sprint 1: MVP operable
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                RutaControl deja de depender de Excel y papel.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                La base tecnica ya esta preparada para auth, RLS, registros diarios,
                rutas fijas por bus y despliegue en Vercel. Este login usa el flujo
                real de Supabase por correo y contrasena.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-white/70">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-foreground">Roles</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Admin y registrador.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/70">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-foreground">Cierre base</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Campos preparados para Sprint 2 sin rehacer esquema.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/70">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-foreground">Seguridad</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    RLS, roles y proteccion de rutas privadas desde el arranque.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section>
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <CardTitle>Acceso interno</CardTitle>
                <CardDescription>
                  Usa una cuenta creada en Supabase Auth. El perfil se sincroniza en
                  `public.profiles` automaticamente.
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
