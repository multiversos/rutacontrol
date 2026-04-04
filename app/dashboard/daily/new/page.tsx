import Link from "next/link";

import { DailyForm } from "@/components/daily-form";
import { ConfigAlert } from "@/components/layout/config-alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function getDailyFormContext(recordId?: string) {
  const supabase = await createClient();
  const [{ data: buses }, { data: routes }, { data: existingRecords }] =
    await Promise.all([
      supabase
        .from("buses")
        .select("id, code, plate, route_id, status")
        .order("code"),
      supabase.from("routes").select("id, name"),
      supabase.from("daily_records").select("id, bus_id, record_date"),
    ]);

  const routeMap = new Map((routes ?? []).map((route) => [route.id, route.name]));
  const initialRecord = recordId
    ? (
        await supabase
          .from("daily_records")
          .select("*")
          .eq("id", recordId)
          .maybeSingle()
      ).data
    : null;

  return {
    buses: (buses ?? []).map((bus) => ({
      ...bus,
      routeName: routeMap.get(bus.route_id) ?? "Ruta sin nombre",
    })),
    existingRecords: existingRecords ?? [],
    initialRecord,
    requestedRecordMissing: Boolean(recordId && !initialRecord),
  };
}

type NewDailyRecordPageProps = {
  searchParams?: Promise<{
    recordId?: string;
  }>;
};

export default async function NewDailyRecordPage({
  searchParams,
}: NewDailyRecordPageProps) {
  const context = await requireAuth();

  const params = searchParams ? await searchParams : undefined;
  const { buses, existingRecords, initialRecord, requestedRecordMissing } =
    await getDailyFormContext(params?.recordId ? String(params.recordId) : undefined);
  const isClosedRecord = initialRecord?.status === "closed";

  return (
    <div className="space-y-6">
      <PageHeader
        badges={[
          { label: context.profile.role === "admin" ? "Admin" : "Registrador", variant: "muted" },
          {
            label: initialRecord ? (isClosedRecord ? "Solo lectura" : "Edicion") : "Nuevo cierre",
            variant: initialRecord && isClosedRecord ? "success" : "default",
          },
        ]}
        description="Guarda la operacion del dia y deja que la base recalcule montos, estado del cierre y hash antes de persistir."
        eyebrow="Flujo diario"
        title={
          initialRecord
            ? isClosedRecord
              ? "Registro diario cerrado"
              : "Editar registro diario"
            : "Nuevo registro diario"
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]">
          <CardHeader>
            <CardTitle>Captura del cierre diario</CardTitle>
            <CardDescription>
              Esta vista esta optimizada para cargar rapido, revisar montos en vivo y cerrar el registro con contexto claro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {requestedRecordMissing ? (
              <ConfigAlert
                message="No pudimos cargar el registro solicitado. Puede que no exista o que no tengas permisos para editarlo."
                title="Registro no disponible"
              />
            ) : null}
            <DailyForm
              key={initialRecord?.id ?? "new-daily-record"}
              buses={buses}
              currentUserId={context.profile.id}
              existingRecords={existingRecords}
              initialRecord={initialRecord}
              readOnly={isClosedRecord}
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]">
          <CardHeader>
            <CardTitle>Ayuda de la vista</CardTitle>
            <CardDescription>
              Reglas clave del flujo diario para que el cierre sea rapido y predecible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Solo se permite un registro por bus y por fecha.</p>
            <p>2. El bus debe estar activo y la base valida el conflicto final para respetar seguridad y RLS.</p>
            <p>3. La diferencia se pinta en rojo si no coincide con el neto calculado.</p>
            <p>4. El cierre es automatico: si completas los campos obligatorios, el registro queda cerrado y bloqueado.</p>
            <div className="pt-2">
              {context.profile.role === "registrador" ? (
                <p className="pb-3 text-xs text-muted-foreground">
                  Si otro usuario ya registro el mismo bus ese dia, el bloqueo final se valida al guardar para respetar seguridad y RLS.
                </p>
              ) : null}
              {isClosedRecord ? (
                <ConfigAlert
                  message="El registro ya quedo cerrado. Puedes revisarlo, pero cualquier intento de edicion operativa sera rechazado."
                  title="Cierre aplicado"
                />
              ) : null}
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
                href="/dashboard/daily"
              >
                Volver al historial
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
