"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveExpenseAction } from "@/app/mobile/register/expenses/actions";
import { BusIdentity } from "@/components/buses/bus-identity";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { ExpenseDraftRecordOption } from "@/lib/expenses";
import { formatCurrency } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import { cn } from "@/lib/utils";

type ExpenseFormProps = {
  categoryOptions: Array<{
    description: string;
    label: string;
    value: "fuel" | "other" | "worker_payment";
  }>;
  createAnotherHref?: string;
  defaultRecordId?: string;
  draftRecordOptions: ExpenseDraftRecordOption[];
  successContinueHref?: string;
  successContinueLabel?: string;
};

function SectionBlock({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="space-y-4 rounded-[24px] border border-slate-200/80 bg-slate-50/75 p-4">
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

export function ExpenseForm({
  categoryOptions,
  createAnotherHref = "/mobile/register/expenses",
  defaultRecordId,
  draftRecordOptions,
  successContinueHref = "/mobile/register",
  successContinueLabel = "Volver a Registrar",
}: ExpenseFormProps) {
  const [state, formAction] = useActionState(saveExpenseAction, initialFormState);
  const [dailyRecordId, setDailyRecordId] = useState(
    defaultRecordId && draftRecordOptions.some((record) => record.id === defaultRecordId)
      ? defaultRecordId
      : draftRecordOptions[0]?.id ?? "",
  );
  const [category, setCategory] = useState<(typeof categoryOptions)[number]["value"]>(
    categoryOptions[0]?.value ?? "other",
  );
  const selectedRecord =
    draftRecordOptions.find((record) => record.id === dailyRecordId) ?? null;
  const isCreateSuccess = state.status === "success";

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-5 rounded-[28px] border border-border bg-white/88 p-5 shadow-soft">
        <SectionBlock
          description="Elige el borrador operativo al que quieres adjuntar el detalle del gasto."
          title="Registro diario"
        >
          <div className="space-y-2">
            <Label htmlFor="expense-daily-record">Registro en borrador</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
              id="expense-daily-record"
              name="dailyRecordId"
              onChange={(event) => setDailyRecordId(event.target.value)}
              value={dailyRecordId}
            >
              <option value="">Selecciona un registro diario</option>
              {draftRecordOptions.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.dailyRecordId?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.dailyRecordId[0]}
              </p>
            ) : null}
          </div>

          {selectedRecord ? (
            <div className="rounded-[20px] bg-white px-4 py-3">
              <BusIdentity
                code={selectedRecord.busCode}
                photoUrl={selectedRecord.busPhotoUrl}
                plate={selectedRecord.busPlate}
                secondaryText={`Fecha ${selectedRecord.recordDate}`}
                size="sm"
                wrap
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="muted">
                  Total actual other_expenses {formatCurrency(selectedRecord.currentOtherExpenses)}
                </Badge>
                <Badge variant="muted">Solo borradores</Badge>
              </div>
            </div>
          ) : null}
        </SectionBlock>

        <SectionBlock
          description="Este detalle es complementario al cierre operativo existente; no cambia permisos ni reglas del backend."
          title="Detalle del gasto"
        >
          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoria</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
              id="expense-category"
              name="category"
              onChange={(event) =>
                setCategory(event.target.value as (typeof categoryOptions)[number]["value"])
              }
              value={category}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {categoryOptions.find((option) => option.value === category)?.description}
            </p>
            {state.fieldErrors?.category?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.category[0]}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-amount-usd">Monto (USD)</Label>
              <Input
                id="expense-amount-usd"
                inputMode="decimal"
                min="0"
                name="amountUsd"
                placeholder="15.00"
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
              <Label htmlFor="expense-amount-bs">Monto de respaldo (Bs)</Label>
              <Input
                id="expense-amount-bs"
                inputMode="decimal"
                min="0"
                name="amountBs"
                placeholder="0.00"
                step="0.01"
                type="number"
              />
              {state.fieldErrors?.amountBs?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.amountBs[0]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description">Descripcion o soporte</Label>
            <Textarea
              className="min-h-28 resize-y"
              id="expense-description"
              name="description"
              placeholder="Referencia, observacion o detalle complementario del gasto."
            />
            {state.fieldErrors?.description?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            ) : null}
          </div>
        </SectionBlock>

        <div
          className={cn(
            "space-y-4 rounded-[24px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur",
            "sticky bottom-[calc(var(--mobile-tabbar-height)+var(--safe-bottom)+0.75rem)] z-10",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Guardar detalle complementario
              </p>
              <p className="text-xs text-muted-foreground">
                El gasto queda vinculado al borrador seleccionado y conserva las
                reglas de acceso actuales.
              </p>
            </div>
            <Badge variant="warning">Complementario</Badge>
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

          {isCreateSuccess ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                className={buttonVariants({
                  className: "w-full",
                  variant: "secondary",
                })}
                href={createAnotherHref}
              >
                Registrar otro gasto
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
          ) : (
            <SubmitButton
              className="w-full"
              disabled={!dailyRecordId}
              pendingLabel="Registrando gasto..."
            >
              Guardar gasto
            </SubmitButton>
          )}
        </div>
      </div>
    </form>
  );
}
