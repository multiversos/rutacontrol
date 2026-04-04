"use client";

import { useActionState, useState } from "react";

import { saveDailyRecordAction } from "@/app/dashboard/daily/actions";
import { BusSelector } from "@/components/bus-selector";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatNumber, getBusinessTodayDate } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import type { Tables } from "@/lib/supabase/database.types";

type BusOption = Pick<Tables<"buses">, "code" | "id" | "plate" | "status"> & {
  routeName: string;
};

type ExistingRecordRef = Pick<Tables<"daily_records">, "bus_id" | "id" | "record_date">;

type DailyFormProps = {
  buses: BusOption[];
  currentUserId: string;
  existingRecords: ExistingRecordRef[];
  initialRecord?: Tables<"daily_records"> | null;
  readOnly?: boolean;
};

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

function SectionTitle({
  helper,
  title,
}: {
  helper: string;
  title: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
        {title}
      </p>
      <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}

export function DailyForm({
  buses,
  currentUserId,
  existingRecords,
  initialRecord,
  readOnly = false,
}: DailyFormProps) {
  const [state, formAction] = useActionState(saveDailyRecordAction, initialFormState);
  const isClosedRecord = initialRecord?.status === "closed";
  const isReadOnly = readOnly || isClosedRecord;
  const [busId, setBusId] = useState(initialRecord?.bus_id ?? "");
  const [recordDate, setRecordDate] = useState(
    initialRecord?.record_date ?? getBusinessTodayDate(),
  );
  const [departureTime, setDepartureTime] = useState(
    initialRecord?.departure_time?.slice(0, 5) ?? "",
  );
  const [incomeBs, setIncomeBs] = useState(initialRecord?.income_bs ?? "");
  const [exchangeRate, setExchangeRate] = useState(initialRecord?.exchange_rate ?? "");
  const [fuelCost, setFuelCost] = useState(initialRecord?.fuel_cost ?? "");
  const [workerPayment, setWorkerPayment] = useState(initialRecord?.worker_payment ?? "");
  const [otherExpenses, setOtherExpenses] = useState(initialRecord?.other_expenses ?? "");
  const [netProfitUsd, setNetProfitUsd] = useState(initialRecord?.net_profit_usd ?? "");
  const [notes, setNotes] = useState(initialRecord?.notes ?? "");

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

  const incomeUsd =
    toNumber(exchangeRate) > 0
      ? roundNumeric(toNumber(incomeBs) / toNumber(exchangeRate), 2)
      : 0;
  const calculatedNet = roundNumeric(
    incomeUsd - toNumber(fuelCost) - toNumber(workerPayment) - toNumber(otherExpenses),
    2,
  );
  const difference = roundNumeric(toNumber(netProfitUsd) - calculatedNet, 2);
  const closureReady = [
    busId,
    currentUserId,
    recordDate,
    departureTime,
    incomeBs,
    exchangeRate,
    fuelCost,
    workerPayment,
    otherExpenses,
    netProfitUsd,
  ].every((value) => value.trim().length > 0);

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

  return (
    <form action={formAction} className="grid gap-6 2xl:grid-cols-[minmax(0,1.12fr)_360px]">
      <input name="recordId" type="hidden" value={initialRecord?.id ?? ""} />
      <input name="userId" type="hidden" value={currentUserId} />

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant={closureReady ? "success" : "warning"}>
            {closureReady ? "Listo para cerrar" : "Guardado como borrador"}
          </Badge>
          {selectedBusBlocked ? (
            <Badge variant="danger">Conflicto visible en la fecha</Badge>
          ) : null}
          {isReadOnly ? <Badge variant="muted">Solo lectura</Badge> : null}
        </div>

        <div className="space-y-5 rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-soft">
          <SectionTitle
            helper="Fecha, hora y unidad. Este bloque define el contexto operativo del cierre."
            title="Contexto"
          />

          <div className="grid gap-5 md:grid-cols-2">
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
              <FieldError message={state.fieldErrors?.recordDate?.[0]} />
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
              <FieldError message={state.fieldErrors?.departureTime?.[0]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bus-selector">Bus</Label>
            <BusSelector
              buses={buses}
              currentRecordId={initialRecord?.id ?? null}
              disabled={isReadOnly}
              existingRecords={existingRecords}
              onChange={setBusId}
              recordDate={recordDate}
              value={busId}
            />
            <FieldError message={state.fieldErrors?.busId?.[0]} />
          </div>
        </div>

        <div className="space-y-5 rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-soft">
          <SectionTitle
            helper="Carga ingresos, tasa y gastos del dia. La base recalcula todo al guardar."
            title="Montos operativos"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="income-bs">Ingreso en bolivares</Label>
              <Input
                disabled={isReadOnly}
                id="income-bs"
                min="0"
                name="incomeBs"
                onChange={(event) => setIncomeBs(event.target.value)}
                step="0.01"
                type="number"
                value={incomeBs}
              />
              <FieldError message={state.fieldErrors?.incomeBs?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange-rate">Tasa Bs/USD</Label>
              <Input
                disabled={isReadOnly}
                id="exchange-rate"
                min="0"
                name="exchangeRate"
                onChange={(event) => setExchangeRate(event.target.value)}
                step="0.000001"
                type="number"
                value={exchangeRate}
              />
              <FieldError message={state.fieldErrors?.exchangeRate?.[0]} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fuel-cost">Gasoil (USD)</Label>
              <Input
                disabled={isReadOnly}
                id="fuel-cost"
                min="0"
                name="fuelCost"
                onChange={(event) => setFuelCost(event.target.value)}
                step="0.01"
                type="number"
                value={fuelCost}
              />
              <FieldError message={state.fieldErrors?.fuelCost?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-payment">Pago a trabajadores (USD)</Label>
              <Input
                disabled={isReadOnly}
                id="worker-payment"
                min="0"
                name="workerPayment"
                onChange={(event) => setWorkerPayment(event.target.value)}
                step="0.01"
                type="number"
                value={workerPayment}
              />
              <FieldError message={state.fieldErrors?.workerPayment?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-expenses">Otros gastos (USD)</Label>
              <Input
                disabled={isReadOnly}
                id="other-expenses"
                min="0"
                name="otherExpenses"
                onChange={(event) => setOtherExpenses(event.target.value)}
                step="0.01"
                type="number"
                value={otherExpenses}
              />
              <FieldError message={state.fieldErrors?.otherExpenses?.[0]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="net-profit-usd">Neto reportado (USD)</Label>
            <Input
              disabled={isReadOnly}
              id="net-profit-usd"
              name="netProfitUsd"
              onChange={(event) => setNetProfitUsd(event.target.value)}
              step="0.01"
              type="number"
              value={netProfitUsd}
            />
            <FieldError message={state.fieldErrors?.netProfitUsd?.[0]} />
          </div>
        </div>

        <div className="space-y-5 rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-soft">
          <SectionTitle
            helper="Contexto corto y util. Solo lo necesario para entender ese cierre despues."
            title="Observaciones"
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notas operativas</Label>
            <Textarea
              disabled={isReadOnly}
              id="notes"
              name="notes"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Incidencias del dia, contexto de la caja o aclaraciones para revision posterior."
              value={notes}
            />
            <FieldError message={state.fieldErrors?.notes?.[0]} />
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

          {isReadOnly ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Este registro ya esta cerrado. Puedes revisarlo, pero la app no permite editarlo nuevamente.
            </div>
          ) : (
            <SubmitButton
              className="w-full md:w-auto"
              disabled={selectedBusBlocked || !busId}
              pendingLabel="Guardando registro..."
            >
              {closureReady
                ? initialRecord
                  ? "Guardar y cerrar"
                  : "Crear y cerrar"
                : initialRecord
                  ? "Guardar borrador"
                  : "Crear borrador"}
            </SubmitButton>
          )}
        </div>
      </div>

      <div className="space-y-5 2xl:sticky 2xl:top-4 2xl:self-start">
        <div className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] p-5 text-white shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
              Calculo en vivo
            </p>
            <h3 className="text-xl font-semibold">Resumen financiero</h3>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="rounded-[24px] bg-white/8 p-4">
              <p className="text-sm text-white/65">Ingreso USD</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(incomeUsd)}</p>
              <p className="mt-1 text-xs text-white/55">
                {formatNumber(incomeBs)} Bs / {formatNumber(exchangeRate, 6)}
              </p>
            </div>

            <div className="rounded-[24px] bg-white/8 p-4">
              <p className="text-sm text-white/65">Neto calculado</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(calculatedNet)}</p>
              <p className="mt-1 text-xs text-white/55">
                Ingreso USD menos gastos operativos del dia
              </p>
            </div>

            <div className="rounded-[24px] bg-white/8 p-4">
              <p className="text-sm text-white/65">Neto reportado</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(netProfitUsd)}</p>
              <p className="mt-1 text-xs text-white/55">
                Valor informado por la persona registradora
              </p>
            </div>

            <div
              className={
                Math.abs(difference) >= 0.01
                  ? "rounded-[24px] border border-destructive/30 bg-destructive/15 p-4"
                  : "rounded-[24px] border border-emerald-200/40 bg-emerald-500/12 p-4"
              }
            >
              <p className="text-sm text-white/65">Diferencia</p>
              <p
                className={
                  Math.abs(difference) >= 0.01
                    ? "mt-2 text-2xl font-semibold text-red-200"
                    : "mt-2 text-2xl font-semibold text-emerald-200"
                }
              >
                {formatCurrency(difference)}
              </p>
              <p className="mt-1 text-xs text-white/55">
                Si no es 0, el sistema la guarda y la mostrara en rojo.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Estado del cierre
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>1. El frontend calcula en vivo, pero la base vuelve a recalcular antes de guardar.</p>
            <p>2. Si completas todos los campos del cierre, el registro se guarda automaticamente como cerrado.</p>
            <p>3. Si falta algun dato, el registro se conserva como borrador para terminarlo despues.</p>
            <p>4. Los registros cerrados quedan bloqueados tanto en la app como en la base de datos.</p>
            {isClosedRecord ? (
              <>
                <p>
                  5. Cerrado el{" "}
                  <span className="font-medium text-foreground">
                    {initialRecord?.closed_at ?? "--"}
                  </span>
                  .
                </p>
                <p className="break-all rounded-2xl bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
                  Hash SHA-256: {initialRecord?.closure_hash ?? "--"}
                </p>
              </>
            ) : closureReady ? (
              <p className="font-medium text-emerald-700">
                5. El registro se cerrara automaticamente al guardar.
              </p>
            ) : (
              <p className="font-medium text-amber-700">
                5. Completa todos los campos del cierre para pasar de borrador a cerrado.
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
