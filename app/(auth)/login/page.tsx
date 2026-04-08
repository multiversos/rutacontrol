import { LoginForm } from "@/components/auth/login-form";
import { AppBrand } from "@/components/branding/app-brand";
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
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-[320px] items-center justify-center rounded-[32px] border border-border/80 bg-card/90 p-8 shadow-soft backdrop-blur lg:p-10">
          <div className="w-full max-w-[430px]">
            <AppBrand
              description="Control operativo, financiero y de mantenimiento para la linea fija El Mojan <-> Maracaibo."
              href="/"
              priority
              size="hero"
            />
          </div>
        </section>

        <section className="lg:self-center">
          <Card>
            <CardHeader className="space-y-4">
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
