import Link from "next/link";

import { DailyForm, type DailyFormInitialValues } from "@/components/daily-form";
import { ConfigAlert } from "@/components/layout/config-alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { getDailyFormContext } from "@/lib/daily-record-form";
import { OPERATIONAL_ROUTE } from "@/lib/operational-route";

type NewDailyRecordPageProps = {
  searchParams?: Promise<{
    bus?: string;
    busId?: string;
    fuelCost?: string;
    incomeUsd?: string;
    notes?: string;
    otherExpenses?: string;
    recordId?: string;
    recordDate?: string;
    samantha?: string;
    workerPayment?: string;
  }>;
};

function cleanText(value: string | undefined, maxLength = 1000) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function cleanDate(value: string | undefined) {
  const text = cleanText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

function cleanNumber(value: string | undefined) {
  const text = cleanText(value);
  return text && /^-?\d+(\.\d+)?$/.test(text) ? text : undefined;
}

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findBusId(
  buses: Array<{ code: string; id: string; plate: string }>,
  busLookup: string | undefined,
) {
  const lookup = cleanText(busLookup);
  if (!lookup) return undefined;

  const normalized = normalizeLookup(lookup);
  return buses.find((bus) => {
    return [bus.id, bus.code, bus.plate].some((candidate) => {
      return normalizeLookup(candidate) === normalized;
    });
  })?.id;
}

function buildSamanthaInitialValues(
  params: Awaited<NewDailyRecordPageProps["searchParams"]> | undefined,
  buses: Array<{ code: string; id: string; plate: string }>,
): DailyFormInitialValues | undefined {
  if (!params?.samantha) return undefined;

  const values: DailyFormInitialValues = {
    busId: findBusId(buses, params.busId ?? params.bus),
    fuelCost: cleanNumber(params.fuelCost),
    incomeUsd: cleanNumber(params.incomeUsd),
    notes: cleanText(params.notes),
    otherExpenses: cleanNumber(params.otherExpenses),
    recordDate: cleanDate(params.recordDate),
    workerPayment: cleanNumber(params.workerPayment),
  };

  return Object.values(values).some(Boolean) ? values : undefined;
}

export default async function NewDailyRecordPage({
  searchParams,
}: NewDailyRecordPageProps) {
  const context = await requireAuth();

  const params = searchParams ? await searchParams : undefined;
  const {
    buses,
    existingRecords,
    initialRecord,
    loadError,
    requestedRecordMissing,
  } =
    await getDailyFormContext(params?.recordId ? String(params.recordId) : undefined);
  const requestedRecordId = params?.recordId ? String(params.recordId) : undefined;
  const isClosedRecord = initialRecord?.status === "closed";
  const isEditingExistingRecord = Boolean(initialRecord);
  const samanthaInitialValues = initialRecord
    ? undefined
    : buildSamanthaInitialValues(params, buses);
  const adminCanEditExisting = context.profile.role === "admin";
  const editBlockedForRole = isEditingExistingRecord && !adminCanEditExisting;
  const formUnavailable = Boolean(loadError) || Boolean(requestedRecordId && !initialRecord);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {initialRecord
              ? adminCanEditExisting
                ? "Editar registro diario"
                : "Registro diario existente"
              : "Nuevo registro diario"}
          </CardTitle>
          <CardDescription>
            {adminCanEditExisting && initialRecord
              ? "Corrige el registro desde servidor y deja que la base recalcule montos, alertas y hash de cierre antes de persistir."
              : "Guarda la operacion del dia y deja que la base recalcule los montos derivados, el estado del cierre y el hash antes de persistir."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadError ? (
            <ConfigAlert
              message={loadError}
              title="No pudimos abrir esta edicion"
            />
          ) : null}
          {requestedRecordMissing ? (
            <ConfigAlert
              message="No pudimos cargar el registro solicitado. Puede que no exista o que no tengas permisos para editarlo."
              title="Registro no disponible"
            />
          ) : null}
          {editBlockedForRole ? (
            <ConfigAlert
              message="Solo el administrador puede corregir registros ya creados. El registrador puede crear nuevos cierres, pero no editar existentes."
              title="Edicion restringida"
            />
          ) : null}
          {formUnavailable ? null : (
            <DailyForm
              key={initialRecord?.id ?? "new-daily-record"}
              buses={buses}
              allowClosedEditing={adminCanEditExisting}
              currentUserId={context.profile.id}
              existingRecords={existingRecords}
              initialValues={samanthaInitialValues}
              initialRecord={initialRecord}
              readOnly={editBlockedForRole}
            />
          )}
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
            2. La linea fija {OPERATIONAL_ROUTE.label} ya se aplica automaticamente;
            aqui solo eliges la unidad y completas el cierre.
          </p>
          <p>3. El neto se deriva automaticamente desde ingreso y gastos.</p>
          <p>
            4. El bus debe estar activo; la base valida el conflicto final si
            otro registro no es visible por RLS.
          </p>
          <p>
            5. El cierre es automatico: si completas los campos obligatorios, el
            registro queda cerrado y bloqueado.
          </p>
          <div className="pt-2">
            {context.profile.role === "registrador" ? (
              <p className="pb-3 text-xs text-muted-foreground">
                Si otro usuario ya registro el mismo bus ese dia, el bloqueo final se
                valida al guardar para respetar seguridad y RLS.
              </p>
            ) : null}
            {isClosedRecord && adminCanEditExisting ? (
              <ConfigAlert
                message="Como admin puedes corregir este cierre. Al guardar, el sistema recalcula neto, alertas y hash sin perder la fecha original de cierre."
                title="Correccion administrativa habilitada"
              />
            ) : null}
            {isClosedRecord && !adminCanEditExisting ? (
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
  );
}
