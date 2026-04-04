"use client";

import { useActionState } from "react";

import { registerDebtPaymentAction } from "@/app/dashboard/debts/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { DebtListItem } from "@/lib/debts";
import { formatCurrency, getBusinessTodayDate } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";

type DebtPaymentFormProps = {
  debt: DebtListItem;
};

export function DebtPaymentForm({ debt }: DebtPaymentFormProps) {
  const [state, formAction] = useActionState(
    registerDebtPaymentAction,
    initialFormState,
  );
  const disabled = debt.status === "paid";

  return (
    <form action={formAction} className="space-y-5">
      <input name="debtId" type="hidden" value={debt.id} />

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
        <p className="font-semibold">{debt.creditor}</p>
        <p className="mt-1 text-muted-foreground">{debt.description}</p>
        <p className="mt-3 text-muted-foreground">
          Saldo pendiente:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(debt.balanceDueUsd)}
          </span>
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="debt-payment-amount">Abono (USD)</Label>
          <Input
            disabled={disabled}
            id="debt-payment-amount"
            min="0"
            name="amountUsd"
            placeholder="35.00"
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
          <Label htmlFor="debt-payment-date">Fecha del abono</Label>
          <Input
            defaultValue={getBusinessTodayDate()}
            disabled={disabled}
            id="debt-payment-date"
            name="paymentDate"
            type="date"
          />
          {state.fieldErrors?.paymentDate?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.paymentDate[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-payment-notes">Notas del abono</Label>
        <Textarea
          disabled={disabled}
          id="debt-payment-notes"
          name="notes"
          placeholder="Referencia, soporte o contexto del pago parcial."
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

      <SubmitButton
        className="w-full"
        disabled={disabled}
        pendingLabel="Registrando abono..."
      >
        {disabled ? "Deuda saldada" : "Registrar pago parcial"}
      </SubmitButton>
    </form>
  );
}
