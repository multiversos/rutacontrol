"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveDailyRecordAction } from "@/app/dashboard/daily/actions";
import { BusSelector } from "@/components/bus-selector";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrency,
  getBusinessTodayDate,
} from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export type DailyFormBusOption = Pick<
  Tables<"buses">,
  "code" | "id" | "plate" | "status"
> & {
  photoUrl?: string | null;
  routeName: string;
};

export type DailyFormExistingRecordRef = Pick<
  Tables<"daily_records">,
  "bus_id" | "id" | "record_date"
>;

export type DailyFormInitialValues = {
  busId?: string | undefined;
  departureTime?: string | undefined;
  fuelCost?: string | undefined;
  incomeUsd?: string | undefined;
  notes?: string | undefined;
  otherExpenses?: string | undefined;
  recordDate?: string | undefined;
  workerPayment?: string | undefined;
};

type DailyFormProps = {
  allowClosedEditing?: boolean;
  buses: DailyFormBusOption[];
  createAnotherHref?: string;
  currentUserId: string;
  existingRecords: DailyFormExistingRecordRef[];
  initialValues?: DailyFormInitialValues | undefined;
  initialRecord?: Tables<"daily_records"> | null;
  mode?: "desktop" | "mobile";
  readOnly?: boolean;
  successContinueHref?: string;
  successContinueLabel?: string;
};

type SectionBlockProps = {
  children: React.ReactNode;
  description?: string;
  mobile?: boolean;
  title: string;
};

function SectionBlock({
  children,
  description,
  mobile = false,
  title,
}: SectionBlockProps) {
  return (
    <section
      className={cn(
        "space-y-4",
        mobile && "rounded-[24px] border border-slate-200/80 bg-slate-50/75 p-4",
      )}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function toInputValue(value: string | number | null | undefined) {
  if (value == null) {
    return "";
  }

  return typeof value === "string" ? value : String(value);
}

function hasFilledInput(value: string | number | null | undefined) {
  return toInputValue(value).trim().length > 0;
}

export function DailyForm({
  allowClosedEditing = false,
  buses,
  createAnotherHref = "/dashboard/daily/new",
  currentUserId,
  existingRecords,
  initialValues,
  initialRecord,
  mode = "desktop",
  readOnly = false,
  successContinueHref = "/dashboard/daily",
  successContinueLabel = "Ver historial",
}: DailyFormProps) {
  const [state, formAction] = useActionState(saveDailyRecordAction, initialFormState);
  const isMobile = mode === "mobile";
  const isClosedRecord = initialRecord?.status === "closed";
  const isReadOnly = readOnly || (isClosedRecord && !allowClosedEditing);
  const [busId, setBusId] = useState(initialRecord?.bus_id ?? initialValues?.busId ?? "");
  const [recordDate, setRecordDate] = useState(
    initialRecord?.record_date ?? initialValues?.recordDate ?? getBusinessTodayDate(),
  );
  const [departureTime, setDepartureTime] = useState(
    (toInputValue(initialRecord?.departure_time) || initialValues?.departureTime || "").slice(0, 5),
  );
  const [incomeUsd, setIncomeUsd] = useState(
    toInputValue(initialRecord?.income_usd) || initialValues?.incomeUsd || "",
  );
  const [fuelCost, setFuelCost] = useState(
    toInputValue(initialRecord?.fuel_cost) || initialValues?.fuelCost || "",
  );
  const [workerPayment, setWorkerPayment] = useState(
    toInputValue(initialRecord?.worker_payment) || initialValues?.workerPayment || "",
  );
  const [otherExpenses, setOtherExpenses] = useState(
    toInputValue(initialRecord?.other_expenses) || initialValues?.otherExpenses || "",
  );
  const [notes, setNotes] = useState(
    toInputValue(initialRecord?.notes) || initialValues?.notes || "",
  );

  const toNumber = (value: string) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const roundNumeric = (value: number, digits = 2) => {
    const factor = 10 ** digits;
    const normalized = Math.abs(value) * factor;
    const rounded = Math.round(normalized + Number.EPSILON);

    return (value < 0 ? -rounded : rounded) / factor;
  };

  const calculatedNet = roundNumeric(
    toNumber(incomeUsd) -
      toNumber(fuelCost) -
      toNumber(workerPayment) -
      toNumber(otherExpenses),
    2,
  );
  const closureReady = [
    busId,
    currentUserId,
    recordDate,
    departureTime,
    incomeUsd,
    fuelCost,
    workerPayment,
    otherExpenses,
  ].every((value) => hasFilledInput(value));

  const selectedBusBlocked = Boolean(
    !isReadOnly &&
      busId &&
      existingRecords.some(
        (record) =>
          record.bus_id === busId &&
          record.record_date === recordDate &&
          record.id !== initialRecord?.id,
      ),
  );
  const isCreateSuccess = state.status === "success" && !initialRecord;

  return (
    <form
      action={formAction}
      className={cn(
        isMobile
          ? "space-y-4"
          : "grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]",
      )}
    >
      <input name="recordId" type="hidden" value={initialRecord?.id ?? ""} />
      <input name="userId" type="hidden" value={currentUserId} />

      <div
        className={cn(
          "space-y-5 rounded-[28px] border border-border p-5",
          isMobile ? "bg-white/88 shadow-soft" : "bg-white/70",
        )}
      >
        <SectionBlock
          description="Fecha operativa y hora de salida del cierre diario."
          mobile={isMobile}
          title="Operacion del dia"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="record-date">Fecha operativa</Label>
              <Input
                disabled={isReadOnly}
                id="record-date"
                name="recordDate"
                onChange={(event) => setRecordDate(event.target.value)}
                type="date"
                value={recordDate}
              />
              {state.fieldErrors?.recordDate?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.recordDate[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="departure-time">Hora de salida</Label>
              <Input
                disabled={isReadOnly}
                id="departure-time"
                name="departureTime"
                onChange={(event) => setDepartureTime(event.target.value)}
                type="time"
                value={departureTime}
              />
              {state.fieldErrors?.departureTime?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.departureTime[0]}
                </p>
              ) : null}
            </div>
          </div>
        </SectionBlock>

        <SectionBlock
          description={
            isMobile
              ? "Busca por codigo o placa y toca la unidad correcta para seleccionarla."
              : "Selecciona la unidad correcta usando foto, codigo y placa."
          }
          mobile={isMobile}
          title="Selecciona el bus"
        >
          <div className="space-y-2">
            <Label id="bus-selector-label">Bus</Label>
            <BusSelector
              ariaDescribedBy={
                state.fieldErrors?.busId?.[0] ? "bus-selector-error" : undefined
              }
              buses={buses}
              currentRecordId={initialRecord?.id ?? null}
              disabled={isReadOnly}
              existingRecords={existingRecords}
              helperText="La base confirma el bloqueo final al guardar y mantiene las reglas actuales del sistema."
              labelId="bus-selector-label"
              layout={isMobile ? "list" : "grid"}
              onChange={setBusId}
              recordDate={recordDate}
              searchable={isMobile}
              searchPlaceholder="Buscar bus por codigo o placa"
              value={busId}
            />
            {state.fieldErrors?.busId?.[0] ? (
              <p className="text-sm text-destructive" id="bus-selector-error">
                {state.fieldErrors.busId[0]}
              </p>
            ) : null}
          </div>
        </SectionBlock>

        <SectionBlock
          description="Carga el ingreso operativo directamente en dolares."
          mobile={isMobile}
          title="Ingreso"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="income-usd">Ingreso en d&oacute;lares</Label>
              <Input
                disabled={isReadOnly}
                id="income-usd"
                inputMode="decimal"
                min="0"
                name="incomeUsd"
                onChange={(event) => setIncomeUsd(event.target.value)}
                step="0.01"
                type="number"
                value={incomeUsd}
              />
              {state.fieldErrors?.incomeUsd?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.incomeUsd[0]}
                </p>
              ) : null}
            </div>
          </div>
        </SectionBlock>

        <SectionBlock
          description="Completa los gastos del dia; el neto se calcula automaticamente."
          mobile={isMobile}
          title="Gastos"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fuel-cost">Gasoil (USD)</Label>
              <Input
                disabled={isReadOnly}
                id="fuel-cost"
                inputMode="decimal"
                min="0"
                name="fuelCost"
                onChange={(event) => setFuelCost(event.target.value)}
                step="0.01"
                type="number"
                value={fuelCost}
              />
              {state.fieldErrors?.fuelCost?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.fuelCost[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-payment">Pago a trabajadores (USD)</Label>
              <Input
                disabled={isReadOnly}
                id="worker-payment"
                inputMode="decimal"
                min="0"
                name="workerPayment"
                onChange={(event) => setWorkerPayment(event.target.value)}
                step="0.01"
                type="number"
                value={workerPayment}
              />
              {state.fieldErrors?.workerPayment?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.workerPayment[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-expenses">Otros gastos (USD)</Label>
              <Input
                disabled={isReadOnly}
                id="other-expenses"
                inputMode="decimal"
                min="0"
                name="otherExpenses"
                onChange={(event) => setOtherExpenses(event.target.value)}
                step="0.01"
                type="number"
                value={otherExpenses}
              />
              {state.fieldErrors?.otherExpenses?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.otherExpenses[0]}
                </p>
              ) : null}
            </div>
          </div>
        </SectionBlock>

        <SectionBlock
          description="Anota incidencias o contexto adicional del dia si hace falta."
          mobile={isMobile}
          title="Observaciones"
        >
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              disabled={isReadOnly}
              id="notes"
              name="notes"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones del dia, incidencias o contexto adicional."
              value={notes}
            />
            {state.fieldErrors?.notes?.[0] ? (
              <p className="text-sm text-destructive">{state.fieldErrors.notes[0]}</p>
            ) : null}
          </div>
        </SectionBlock>

        <div
          className={cn(
            "space-y-4 rounded-[24px] border border-border bg-card/95 p-4",
            isMobile &&
              "sticky bottom-[calc(var(--mobile-tabbar-height)+var(--safe-bottom)+0.75rem)] z-10 border-slate-200/90 bg-white/95 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {initialRecord ? "Actualizar registro diario" : "Guardar registro diario"}
              </p>
              <p className="text-xs text-muted-foreground">
                {closureReady
                  ? "Con todos los datos completos, el cierre sera automatico."
                  : "Si falta algun dato, el sistema lo dejara como borrador."}
              </p>
            </div>
            <Badge variant={closureReady ? "success" : "warning"}>
              {closureReady ? "Cierre listo" : "Borrador"}
            </Badge>
          </div>

          {state.message ? (
            <p
              className={
                state.status === "success"
                  ? "rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  : "rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
              }
            >
              {state.message}
            </p>
          ) : null}

          {isMobile && isCreateSuccess ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                className={buttonVariants({
                  className: "w-full",
                  variant: "secondary",
                })}
                href={createAnotherHref}
              >
                Registrar otro
              </Link>
              <Link
                className={buttonVariants({
                  className: "w-full",
                  variant: "outline",
                })}
                href={successContinueHref}
              >
                {successContinueLabel}
              </Link>
            </div>
          ) : null}

          {isReadOnly ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {isClosedRecord
                ? "Este registro ya esta cerrado. Solo el administrador puede corregirlo."
                : "Este registro no esta disponible para editarse desde esta sesion."}
            </div>
          ) : (
            <SubmitButton
              className="w-full"
              disabled={selectedBusBlocked || !busId}
              pendingLabel="Guardando registro..."
            >
              {initialRecord
                ? isClosedRecord
                  ? "Guardar correccion"
                  : closureReady
                    ? "Guardar y cerrar"
                    : "Guardar borrador"
                : closureReady
                  ? "Crear y cerrar"
                  : "Crear borrador"}
            </SubmitButton>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-[28px] border border-border bg-card/90 p-5 shadow-soft">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Calculo en vivo
            </p>
            <h3 className="text-xl font-semibold">Resumen financiero</h3>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Ingreso USD</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(incomeUsd)}
              </p>
            </div>

            <div className="rounded-3xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Gastos operativos</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(
                  roundNumeric(
                    toNumber(fuelCost) +
                      toNumber(workerPayment) +
                      toNumber(otherExpenses),
                    2,
                  ),
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Gasoil, trabajadores y otros gastos
              </p>
            </div>

            <div className="rounded-3xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Neto automatico</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(calculatedNet)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ingreso USD menos gastos operativos del dia
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card/90 p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Estado del cierre
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              1. El frontend calcula en vivo, pero la base vuelve a recalcular antes
              de guardar.
            </p>
            <p>
              2. Si completas todos los campos operativos del cierre, el registro se
              guarda directamente como cerrado.
            </p>
            <p>
              3. Si falta algun dato del cierre, el registro se conserva como borrador
              para completarlo despues.
            </p>
            <p>
              4. Los registros cerrados quedan bloqueados en la app y en la base de
              datos para el registrador; el admin puede corregirlos.
            </p>
            {isClosedRecord ? (
              <>
                <p>
                  5. Cerrado el{" "}
                  <span className="font-medium text-foreground">
                    {initialRecord?.closed_at ?? "--"}
                  </span>
                  .
                </p>
                <p className="break-all font-mono text-xs text-foreground">
                  Hash SHA-256: {initialRecord?.closure_hash ?? "--"}
                </p>
              </>
            ) : closureReady ? (
              <p className="font-medium text-emerald-700">
                5. El registro se cerrara automaticamente al guardar.
              </p>
            ) : (
              <p className="font-medium text-amber-700">
                5. Completa todos los campos del cierre para pasar de borrador a
                cerrado.
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
