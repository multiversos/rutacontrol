"use client";

import { useActionState, useEffect, useRef } from "react";

import { registerDebtPaymentAction } from "@/app/dashboard/debts/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { getLocalDateInputValue } from "@/lib/dates";
import type { DebtListItem } from "@/lib/debts";
import { formatCurrency } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import { cn } from "@/lib/utils";

type DebtPaymentFormProps = {
  debt: DebtListItem;
  defaultAmountUsd?: string | undefined;
  defaultNotes?: string | undefined;
  defaultPaymentDate?: string | undefined;
  mode?: "desktop" | "mobile";
};

export function DebtPaymentForm({
  debt,
  defaultAmountUsd,
  defaultNotes,
  defaultPaymentDate,
  mode = "desktop",
}: DebtPaymentFormProps) {
  const [state, formAction] = useActionState(
    registerDebtPaymentAction,
    initialFormState,
  );
  const disabled = debt.status === "paid";
  const isMobile = mode === "mobile";
  const paymentDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultPaymentDate || !paymentDateRef.current) {
      return;
    }

    paymentDateRef.current.value = getLocalDateInputValue();
  }, [defaultPaymentDate]);

  return (
    <form action={formAction} className="space-y-5">
      <input name="debtId" type="hidden" value={debt.id} />

      <div
        className={cn(
          "rounded-2xl border border-border bg-muted/40 p-4 text-sm",
          isMobile && "rounded-[24px] border-slate-200/80 bg-slate-50/75",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{debt.creditor}</p>
            <p className="mt-1 text-muted-foreground">{debt.description}</p>
          </div>
          <Badge variant={debt.status === "paid" ? "success" : "warning"}>
            {debt.status === "paid"
              ? "Saldada"
              : debt.status === "partial"
                ? "Parcial"
                : "Pendiente"}
          </Badge>
        </div>
        <p className="mt-3 text-muted-foreground">
          Saldo pendiente:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(debt.balanceDueUsd)}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="debt-payment-amount">Abono (USD)</Label>
          <Input
            defaultValue={defaultAmountUsd ?? ""}
            disabled={disabled}
            id="debt-payment-amount"
            inputMode="decimal"
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
            disabled={disabled}
            id="debt-payment-date"
            name="paymentDate"
            ref={paymentDateRef}
            type="date"
            defaultValue={defaultPaymentDate ?? ""}
          />
          {state.fieldErrors?.paymentDate?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.paymentDate[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-payment-notes">Notas del abono, opcional</Label>
        <Textarea
          defaultValue={defaultNotes ?? ""}
          disabled={disabled}
          id="debt-payment-notes"
          name="notes"
          placeholder="Referencia o comentario opcional del pago."
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
