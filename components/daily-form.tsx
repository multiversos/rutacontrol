"use client";

import { useActionState, useState } from "react";

import { saveDailyRecordAction } from "@/app/dashboard/daily/actions";
import { BusSelector } from "@/components/bus-selector";
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
  const [exchangeRate, setExchangeRate] = useState(
    initialRecord?.exchange_rate ?? "",
  );
  const [fuelCost, setFuelCost] = useState(initialRecord?.fuel_cost ?? "");
  const [workerPayment, setWorkerPayment] = useState(
    initialRecord?.worker_payment ?? "",
  );
  const [otherExpenses, setOtherExpenses] = useState(
    initialRecord?.other_expenses ?? "",
  );
  const [netProfitUsd, setNetProfitUsd] = useState(
    initialRecord?.net_profit_usd ?? "",
  );
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
    incomeUsd -
      toNumber(fuelCost) -
      toNumber(workerPayment) -
      toNumber(otherExpenses),
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
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <input name="recordId" type="hidden" value={initialRecord?.id ?? ""} />
      <input name="userId" type="hidden" value={currentUserId} />

      <div className="space-y-5 rounded-[28px] border border-border bg-white/70 p-5">
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
          {state.fieldErrors?.busId?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.busId[0]}</p>
          ) : null}
        </div>

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
            {state.fieldErrors?.incomeBs?.[0] ? (
              <p className="text-sm text-destructive">{state.fieldErrors.incomeBs[0]}</p>
            ) : null}
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
            {state.fieldErrors?.exchangeRate?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.exchangeRate[0]}
              </p>
            ) : null}
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
            {state.fieldErrors?.fuelCost?.[0] ? (
              <p className="text-sm text-destructive">{state.fieldErrors.fuelCost[0]}</p>
            ) : null}
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
          {state.fieldErrors?.netProfitUsd?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.netProfitUsd[0]}
            </p>
          ) : null}
        </div>

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
            Este registro ya esta cerrado. Puedes revisarlo, pero la app no permite
            editarlo nuevamente.
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
              <p className="mt-1 text-xs text-muted-foreground">
                {formatNumber(incomeBs)} Bs / {formatNumber(exchangeRate, 6)}
              </p>
            </div>

            <div className="rounded-3xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Neto calculado</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(calculatedNet)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ingreso USD menos gastos operativos del dia
              </p>
            </div>

            <div className="rounded-3xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Neto reportado</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(netProfitUsd)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Valor informado por la persona registradora
              </p>
            </div>

            <div
              className={
                Math.abs(difference) >= 0.01
                  ? "rounded-3xl border border-destructive/20 bg-destructive/10 p-4"
                  : "rounded-3xl border border-emerald-200 bg-emerald-50 p-4"
              }
            >
              <p className="text-sm text-muted-foreground">Diferencia</p>
              <p
                className={
                  Math.abs(difference) >= 0.01
                    ? "mt-2 text-2xl font-semibold text-destructive"
                    : "mt-2 text-2xl font-semibold text-emerald-700"
                }
              >
                {formatCurrency(difference)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Si no es 0, el sistema la guardara y la mostrara en rojo.
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
              datos.
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
