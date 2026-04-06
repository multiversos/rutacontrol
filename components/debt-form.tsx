"use client";

import { useActionState, useId, useState } from "react";

import { saveDebtAction } from "@/app/dashboard/debts/actions";
import { BusSelector } from "@/components/bus-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessTodayDate } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import type { DebtBusOption, DebtRecordOption } from "@/lib/debts";

type DebtFormProps = {
  busOptions: DebtBusOption[];
  recordOptions: DebtRecordOption[];
};

export function DebtForm({ busOptions, recordOptions }: DebtFormProps) {
  const [state, formAction] = useActionState(saveDebtAction, initialFormState);
  const [selectedBusId, setSelectedBusId] = useState("");
  const busLabelId = useId();
  const busErrorId = useId();

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="debt-creditor">Acreedor</Label>
        <Input id="debt-creditor" name="creditor" placeholder="Proveedor, taller o tercero" />
        {state.fieldErrors?.creditor?.[0] ? (
          <p className="text-sm text-destructive">{state.fieldErrors.creditor[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-description">Descripcion</Label>
        <Textarea
          id="debt-description"
          name="description"
          placeholder="Detalle operativo de la deuda o compromiso pendiente."
        />
        {state.fieldErrors?.description?.[0] ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="debt-amount">Monto original (USD)</Label>
          <Input
            id="debt-amount"
            min="0"
            name="amountUsd"
            placeholder="120.00"
            step="0.01"
            type="number"
          />
          {state.fieldErrors?.amountUsd?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.amountUsd[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="debt-due-date">Fecha limite</Label>
          <Input
            defaultValue={getBusinessTodayDate()}
            id="debt-due-date"
            name="dueDate"
            type="date"
          />
          {state.fieldErrors?.dueDate?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.dueDate[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-border/80 bg-white/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Label id={busLabelId}>Bus asociado</Label>
            <p className="text-sm text-muted-foreground">
              Relaciona la deuda con una unidad concreta o dejala como compromiso
              general.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold"
            onClick={() => setSelectedBusId("")}
            type="button"
          >
            Sin relacion directa
          </button>
        </div>

        <BusSelector
          ariaDescribedBy={state.fieldErrors?.busId?.[0] ? busErrorId : undefined}
          buses={busOptions}
          helperText="Usa foto, codigo y placa para ligar la deuda a la unidad correcta. Si tambien eliges un registro diario, ambos deben coincidir."
          id="debt-bus-selector"
          labelId={busLabelId}
          name="busId"
          onChange={setSelectedBusId}
          value={selectedBusId}
        />

        {state.fieldErrors?.busId?.[0] ? (
          <p className="text-sm text-destructive" id={busErrorId}>
            {state.fieldErrors.busId[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-daily-record">Relacionar con registro diario</Label>
        <select
          className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
          defaultValue=""
          id="debt-daily-record"
          name="dailyRecordId"
        >
          <option value="">Sin relacion directa</option>
          {recordOptions.map((record) => (
            <option key={record.id} value={record.id}>
              {record.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">
          Si eliges un registro diario, el sistema tomara automaticamente el bus de
          ese cierre o validara que coincida con el bus seleccionado arriba.
        </p>
        {state.fieldErrors?.dailyRecordId?.[0] ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.dailyRecordId[0]}
          </p>
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

      <SubmitButton className="w-full" pendingLabel="Registrando deuda...">
        Crear deuda
      </SubmitButton>
    </form>
  );
}
