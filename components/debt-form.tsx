"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { saveDebtAction } from "@/app/dashboard/debts/actions";
import { BusSelector } from "@/components/bus-selector";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { DebtBusOption, DebtRecordOption } from "@/lib/debts";
import { getBusinessTodayDate } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import { cn } from "@/lib/utils";

type DebtFormProps = {
  busOptions: DebtBusOption[];
  createAnotherHref?: string;
  defaultAmountUsd?: string | undefined;
  defaultBusId?: string | undefined;
  defaultCreditor?: string | undefined;
  defaultDescription?: string | undefined;
  defaultDueDate?: string | undefined;
  defaultRecordId?: string | undefined;
  mode?: "desktop" | "mobile";
  recordOptions: DebtRecordOption[];
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
  busOptions,
  createAnotherHref = "/dashboard/debts",
  defaultAmountUsd,
  defaultBusId,
  defaultCreditor,
  defaultDescription,
  defaultDueDate,
  defaultRecordId,
  mode = "desktop",
  recordOptions,
  successContinueHref = "/dashboard/debts",
  successContinueLabel = "Ver deudas",
}: DebtFormProps) {
  const [state, formAction] = useActionState(saveDebtAction, initialFormState);
  const [selectedBusId, setSelectedBusId] = useState(defaultBusId ?? "");
  const [selectedRecordId, setSelectedRecordId] = useState(defaultRecordId ?? "");
  const busLabelId = useId();
  const busErrorId = useId();
  const isMobile = mode === "mobile";
  const isCreateSuccess = state.status === "success";

  const handleRecordChange = (value: string) => {
    setSelectedRecordId(value);
    const selectedRecord = recordOptions.find((record) => record.id === value);

    if (selectedRecord && !selectedBusId) {
      setSelectedBusId(selectedRecord.busId);
    }
  };

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
          description="Acreedor, descripcion y monto principal del compromiso."
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
            <Label htmlFor="debt-description">Descripcion</Label>
            <Textarea
              className="min-h-28 resize-y"
              defaultValue={defaultDescription ?? ""}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="debt-amount">Monto original (USD)</Label>
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

            <div className="space-y-2">
              <Label htmlFor="debt-due-date">Fecha limite</Label>
              <Input
                defaultValue={defaultDueDate ?? getBusinessTodayDate()}
                id="debt-due-date"
                name="dueDate"
                type="date"
              />
              {state.fieldErrors?.dueDate?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.dueDate[0]}
                </p>
              ) : null}
            </div>
          </div>
        </SectionBlock>

        <SectionBlock
          description="Puedes vincular la deuda a un borrador o directamente a una unidad."
          mobile={isMobile}
          title="Relacion operativa"
        >
          <div className="space-y-2">
            <Label htmlFor="debt-daily-record">Relacionar con registro diario</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
              id="debt-daily-record"
              name="dailyRecordId"
              onChange={(event) => handleRecordChange(event.target.value)}
              value={selectedRecordId}
            >
              <option value="">Sin relacion directa</option>
              {recordOptions.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Si eliges un registro diario, el sistema tomara automaticamente el
              bus de ese cierre o validara que coincida con el bus seleccionado.
            </p>
            {state.fieldErrors?.dailyRecordId?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.dailyRecordId[0]}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "min-w-0 space-y-4 rounded-3xl border border-border/80 bg-white/80 p-5",
              !isMobile && "md:p-6",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <Label id={busLabelId}>Bus asociado</Label>
                <p className="text-sm text-muted-foreground">
                  Dejalo vacio si la deuda depende solo del registro diario o si
                  es un compromiso general.
                </p>
              </div>
              <button
                className="inline-flex h-10 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold sm:w-auto"
                onClick={() => setSelectedBusId("")}
                type="button"
              >
                Sin relacion directa
              </button>
            </div>

            <BusSelector
              ariaDescribedBy={state.fieldErrors?.busId?.[0] ? busErrorId : undefined}
              buses={busOptions}
              helperText="Si tambien eliges un registro diario, ambos deben apuntar a la misma unidad."
              labelId={busLabelId}
              layout={isMobile ? "list" : "grid"}
              name="busId"
              onChange={setSelectedBusId}
              searchable={isMobile}
              value={selectedBusId}
            />

            {state.fieldErrors?.busId?.[0] ? (
              <p className="text-sm text-destructive" id={busErrorId}>
                {state.fieldErrors.busId[0]}
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
                El backend mantiene las validaciones actuales entre bus, registro
                diario, saldo y permisos.
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
