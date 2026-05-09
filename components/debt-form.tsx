"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveDebtAction } from "@/app/dashboard/debts/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/forms/action-state";
import { cn } from "@/lib/utils";

type DebtFormProps = {
  createAnotherHref?: string;
  defaultAmountUsd?: string | undefined;
  defaultCreditor?: string | undefined;
  mode?: "desktop" | "mobile";
  successContinueHref?: string;
  successContinueLabel?: string;
};

function SectionBlock({
  children,
  description,
  mobile,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  mobile?: boolean;
  title: string;
}) {
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

export function DebtForm({
  createAnotherHref = "/dashboard/debts",
  defaultAmountUsd,
  defaultCreditor,
  mode = "desktop",
  successContinueHref = "/dashboard/debts",
  successContinueLabel = "Ver deudas",
}: DebtFormProps) {
  const [state, formAction] = useActionState(saveDebtAction, initialFormState);
  const isMobile = mode === "mobile";
  const isCreateSuccess = state.status === "success";

  return (
    <form
      action={formAction}
      className={cn(isMobile ? "space-y-4" : "min-w-0 space-y-6")}
    >
      <div
        className={cn(
          isMobile
            ? "space-y-5 rounded-[28px] border border-border bg-white/88 p-5 shadow-soft"
            : "min-w-0 space-y-6",
        )}
      >
        <SectionBlock
          description="Acreedor y monto principal del compromiso."
          mobile={isMobile}
          title="Datos de la deuda"
        >
          <div className="space-y-2">
            <Label htmlFor="debt-creditor">Acreedor</Label>
            <Input
              defaultValue={defaultCreditor ?? ""}
              id="debt-creditor"
              name="creditor"
              placeholder="Proveedor, taller o tercero"
            />
            {state.fieldErrors?.creditor?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.creditor[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-amount">Monto original USD</Label>
            <Input
              defaultValue={defaultAmountUsd ?? ""}
              id="debt-amount"
              inputMode="decimal"
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
        </SectionBlock>

        <div
          className={cn(
            isMobile
              ? "sticky bottom-[calc(var(--mobile-tabbar-height)+var(--safe-bottom)+0.75rem)] z-10 space-y-4 rounded-[24px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur"
              : "space-y-4",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Guardar deuda</p>
              <p className="text-xs text-muted-foreground">
                Se registrara como compromiso financiero general de la operacion.
              </p>
            </div>
            <Badge variant="warning">Solo admin</Badge>
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
                Crear otra deuda
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
            <SubmitButton className="w-full" pendingLabel="Registrando deuda...">
              Crear deuda
            </SubmitButton>
          )}
        </div>
      </div>
    </form>
  );
}
