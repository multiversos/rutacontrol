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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {initialRecord ? "Editar registro diario" : "Nuevo registro diario"}
          </CardTitle>
          <CardDescription>
            Guarda la operacion del dia y deja que la base recalcule los montos
            derivados antes de persistir.
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
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas del formulario</CardTitle>
          <CardDescription>
            Esta vista ya aplica las reglas principales del MVP operable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Solo se permite un registro por bus y por fecha.</p>
          <p>
            2. El bus debe estar activo; la base valida el conflicto final si
            otro registro no es visible por RLS.
          </p>
          <p>3. La diferencia se pinta en rojo si no coincide con el neto calculado.</p>
          <p>4. El guardado ocurre como borrador; el cierre real se deja para Sprint 2.</p>
          <div className="pt-2">
            {context.profile.role === "registrador" ? (
              <p className="pb-3 text-xs text-muted-foreground">
                Si otro usuario ya registro el mismo bus ese dia, el bloqueo final se
                valida al guardar para respetar seguridad y RLS.
              </p>
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
  );
}
