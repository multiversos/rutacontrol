"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Settings2, X } from "lucide-react";

import { createOperationalCashAdjustmentAction } from "@/app/dashboard/operational-cash/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/forms/action-state";

type OperationalCashAdjustmentFormProps = {
  defaultDate: string;
};

export function OperationalCashAdjustmentForm({
  defaultDate,
}: OperationalCashAdjustmentFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    createOperationalCashAdjustmentAction,
    initialFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <div className="space-y-3">
      <Button
        className="w-full sm:w-auto"
        onClick={() => setOpen((current) => !current)}
        size="sm"
        type="button"
        variant="outline"
      >
        {open ? <X className="mr-2 h-4 w-4" /> : <Settings2 className="mr-2 h-4 w-4" />}
        Ajustar caja
      </Button>

      {open ? (
        <form
          action={formAction}
          className="rounded-[24px] border border-border bg-muted/40 p-4"
          ref={formRef}
        >
          <div className="space-y-1">
            <h3 className="font-semibold">Ajustar Caja operativa</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Este ajuste quedara registrado en el historial de Caja operativa.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="operational-cash-direction">Tipo</Label>
              <Select
                defaultValue="in"
                id="operational-cash-direction"
                name="direction"
              >
                <option value="in">Entrada</option>
                <option value="out">Salida</option>
              </Select>
              {state.fieldErrors?.direction?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.direction[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="operational-cash-amount">Monto USD</Label>
              <Input
                id="operational-cash-amount"
                inputMode="decimal"
                min="0.01"
                name="amountUsd"
                placeholder="5.00"
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
              <Label htmlFor="operational-cash-date">Fecha</Label>
              <Input
                defaultValue={defaultDate}
                id="operational-cash-date"
                name="movementDate"
                type="date"
              />
              {state.fieldErrors?.movementDate?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.movementDate[0]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="operational-cash-description">Motivo</Label>
            <Textarea
              id="operational-cash-description"
              name="description"
              placeholder="Motivo obligatorio del ajuste."
            />
            {state.fieldErrors?.description?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            ) : null}
          </div>

          {state.message ? (
            <p
              className={
                state.status === "success"
                  ? "mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  : "mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
              }
            >
              {state.message}
            </p>
          ) : null}

          <SubmitButton className="mt-4 w-full" pendingLabel="Guardando ajuste...">
            Guardar ajuste
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
