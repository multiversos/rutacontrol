"use client";

import { useActionState, useState } from "react";

import { saveMaintenanceAction } from "@/app/dashboard/maintenance/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessTodayDate } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import { MAINTENANCE_POSITION_LABELS, MAINTENANCE_TYPE_LABELS } from "@/lib/maintenance-config";

type MaintenanceBusOption = {
  code: string;
  id: string;
  status: string;
};

type MaintenanceFormProps = {
  buses: MaintenanceBusOption[];
};

const wheelFields = [
  {
    costField: "frontLeftCostUsd",
    expectedField: "frontLeftExpectedWorkDays",
    notesField: "frontLeftNotes",
    position: "front_left",
  },
  {
    costField: "frontRightCostUsd",
    expectedField: "frontRightExpectedWorkDays",
    notesField: "frontRightNotes",
    position: "front_right",
  },
  {
    costField: "rearLeftCostUsd",
    expectedField: "rearLeftExpectedWorkDays",
    notesField: "rearLeftNotes",
    position: "rear_left",
  },
  {
    costField: "rearRightCostUsd",
    expectedField: "rearRightExpectedWorkDays",
    notesField: "rearRightNotes",
    position: "rear_right",
  },
] as const;

export function MaintenanceForm({ buses }: MaintenanceFormProps) {
  const [state, formAction] = useActionState(saveMaintenanceAction, initialFormState);
  const [maintenanceType, setMaintenanceType] =
    useState<keyof typeof MAINTENANCE_TYPE_LABELS>("oil_change");
  const isBrakePads = maintenanceType === "brake_pads";

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maintenance-bus">Bus</Label>
          <Select defaultValue="" id="maintenance-bus" name="busId">
            <option value="">Selecciona un bus</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.code}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.busId?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.busId[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-type">Tipo de mantenimiento</Label>
          <Select
            defaultValue="oil_change"
            id="maintenance-type"
            name="maintenanceType"
            onChange={(event) =>
              setMaintenanceType(
                event.target.value as keyof typeof MAINTENANCE_TYPE_LABELS,
              )
            }
          >
            {Object.entries(MAINTENANCE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.maintenanceType?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.maintenanceType[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(180px,0.55fr)_minmax(0,1.45fr)]">
        <div className="space-y-2">
          <Label htmlFor="maintenance-service-date">Fecha del mantenimiento</Label>
          <Input
            defaultValue={getBusinessTodayDate()}
            id="maintenance-service-date"
            name="serviceDate"
            type="date"
          />
          {state.fieldErrors?.serviceDate?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.serviceDate[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-provider">Proveedor o taller</Label>
          <Input
            className="w-full"
            id="maintenance-provider"
            name="provider"
            placeholder="Ej. Taller El Mojan"
          />
          {state.fieldErrors?.provider?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.provider[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maintenance-total-cost">Costo total (USD)</Label>
          <Input
            id="maintenance-total-cost"
            min="0"
            name="totalCostUsd"
            placeholder="300.00"
            step="0.01"
            type="number"
          />
          {state.fieldErrors?.totalCostUsd?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.totalCostUsd[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-expected-days">
            Proximo cambio esperado (dias trabajados)
          </Label>
          <Input
            defaultValue={maintenanceType === "oil_change" ? "30" : ""}
            id="maintenance-expected-days"
            key={maintenanceType}
            name="expectedWorkDays"
            placeholder={isBrakePads ? "Se controla por rueda" : "Ej. 30"}
            step="1"
            type="number"
          />
          <p className="text-xs text-muted-foreground">
            Para aceite o filtros puedes usar un umbral general. Para bandas de freno
            el detalle por rueda manda el estado operativo.
          </p>
          {state.fieldErrors?.expectedWorkDays?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.expectedWorkDays[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenance-description">Descripcion</Label>
        <Textarea
          className="min-h-[144px] resize-y"
          id="maintenance-description"
          name="description"
          placeholder="Ej. Cambio completo de aceite con filtro nuevo y revision basica."
        />
        {state.fieldErrors?.description?.[0] ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenance-notes">Observaciones</Label>
        <Textarea
          className="min-h-[132px] resize-y"
          id="maintenance-notes"
          name="notes"
          placeholder="Notas internas, comportamiento del bus o seguimiento pendiente."
        />
        {state.fieldErrors?.notes?.[0] ? (
          <p className="text-sm text-destructive">{state.fieldErrors.notes[0]}</p>
        ) : null}
      </div>

      {isBrakePads ? (
        <div className="space-y-4 rounded-3xl border border-border bg-muted/30 p-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Detalle obligatorio por rueda</p>
            <p className="text-sm text-muted-foreground">
              Registra costo y duracion esperada para cada rueda. El sistema
              calculara cuantos dias trabajados duro el cambio anterior.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {wheelFields.map((wheel) => (
              <div
                key={wheel.position}
                className="space-y-3 rounded-2xl border border-border/80 bg-white/80 p-4"
              >
                <p className="font-semibold">
                  {MAINTENANCE_POSITION_LABELS[wheel.position]}
                </p>

                <div className="space-y-2">
                  <Label htmlFor={`${wheel.position}-cost`}>Costo de la rueda (USD)</Label>
                  <Input
                    id={`${wheel.position}-cost`}
                    min="0"
                    name={wheel.costField}
                    placeholder="75.00"
                    step="0.01"
                    type="number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${wheel.position}-expected`}>
                    Duracion esperada (dias trabajados)
                  </Label>
                  <Input
                    id={`${wheel.position}-expected`}
                    name={wheel.expectedField}
                    placeholder="30"
                    step="1"
                    type="number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${wheel.position}-notes`}>Observaciones de la rueda</Label>
                  <Textarea
                    className="min-h-[110px] resize-y"
                    id={`${wheel.position}-notes`}
                    name={wheel.notesField}
                    placeholder="Ej. desgaste previo, proveedor o hallazgos."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4 rounded-3xl border border-border bg-card/90 p-5 shadow-soft">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Deuda asociada al mantenimiento</p>
          <p className="text-sm text-muted-foreground">
            Si el trabajo quedo pendiente por pagar, registra aqui el saldo. Si el
            mantenimiento ya quedo pagado, deja estos campos vacios.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(180px,0.55fr)_minmax(0,1.45fr)]">
          <div className="space-y-2">
            <Label htmlFor="maintenance-debt-amount">Saldo pendiente (USD)</Label>
            <Input
              id="maintenance-debt-amount"
              min="0"
              name="debtAmountUsd"
              placeholder="120.00"
              step="0.01"
              type="number"
            />
            {state.fieldErrors?.debtAmountUsd?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.debtAmountUsd[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-debt-creditor">Acreedor o taller</Label>
            <Input
              className="w-full"
              id="maintenance-debt-creditor"
              name="debtCreditor"
              placeholder="Ej. Repuestos El Terminal"
            />
            {state.fieldErrors?.debtCreditor?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.debtCreditor[0]}
              </p>
            ) : null}
          </div>
        </div>

        <div className="max-w-sm space-y-2">
          <Label htmlFor="maintenance-debt-due-date">Fecha comprometida de pago</Label>
          <Input
            defaultValue={getBusinessTodayDate()}
            id="maintenance-debt-due-date"
            name="debtDueDate"
            type="date"
          />
          {state.fieldErrors?.debtDueDate?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.debtDueDate[0]}
            </p>
          ) : null}
        </div>
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

      <SubmitButton className="w-full" pendingLabel="Registrando mantenimiento...">
        Registrar mantenimiento
      </SubmitButton>
    </form>
  );
}
