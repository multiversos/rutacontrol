"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveRouteAction } from "@/app/dashboard/routes/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/forms/action-state";
import type { Tables } from "@/lib/supabase/database.types";

type RouteFormProps = {
  route?: Tables<"routes"> | null;
};

export function RouteForm({ route }: RouteFormProps) {
  const [state, formAction] = useActionState(saveRouteAction, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="routeId" type="hidden" value={route?.id ?? ""} />

      <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/35 p-4">
        <Label htmlFor="route-name">Nombre de la ruta</Label>
        <Input
          defaultValue={route?.name ?? ""}
          id="route-name"
          name="name"
          placeholder="Ej. Ruta Centro"
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/35 p-4">
          <Label htmlFor="route-origin">Origen</Label>
          <Input
            defaultValue={route?.origin ?? ""}
            id="route-origin"
            name="origin"
            placeholder="Ciudad de origen"
          />
          {state.fieldErrors?.origin?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.origin[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/35 p-4">
          <Label htmlFor="route-destination">Destino</Label>
          <Input
            defaultValue={route?.destination ?? ""}
            id="route-destination"
            name="destination"
            placeholder="Ciudad de destino"
          />
          {state.fieldErrors?.destination?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.destination[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/35 p-4">
          <Label htmlFor="route-expected-income">Ingreso esperado (USD)</Label>
          <Input
            defaultValue={route?.expected_income ?? ""}
            id="route-expected-income"
            min="0"
            name="expectedIncome"
            placeholder="140.00"
            step="0.01"
            type="number"
          />
          {state.fieldErrors?.expectedIncome?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.expectedIncome[0]}
            </p>
          ) : null}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-[24px] border border-input/90 bg-white/95 px-4 py-3 text-sm">
            <Checkbox defaultChecked={route?.active ?? true} name="active" />
            Activa
          </label>
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

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Guardando...">
          {route ? "Guardar cambios" : "Crear ruta"}
        </SubmitButton>
        {route ? (
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href="/dashboard/routes"
          >
            Cancelar edicion
          </Link>
        ) : null}
      </div>
    </form>
  );
}
