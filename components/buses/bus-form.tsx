"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveBusAction } from "@/app/dashboard/buses/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/forms/action-state";
import { OPERATIONAL_ROUTE_LABEL } from "@/lib/operational-route";
import type { Tables } from "@/lib/supabase/database.types";

type BusFormProps = {
  bus?: Tables<"buses"> | null;
};

export function BusForm({ bus }: BusFormProps) {
  const [state, formAction] = useActionState(saveBusAction, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="busId" type="hidden" value={bus?.id ?? ""} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/35 p-4">
          <Label htmlFor="bus-code">Codigo interno</Label>
          <Input
            className="uppercase"
            defaultValue={bus?.code ?? ""}
            id="bus-code"
            name="code"
            placeholder="B-01"
          />
          {state.fieldErrors?.code?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.code[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/35 p-4">
          <Label htmlFor="bus-plate">Placa</Label>
          <Input
            className="uppercase"
            defaultValue={bus?.plate ?? ""}
            id="bus-plate"
            name="plate"
            placeholder="AB123CD"
          />
          {state.fieldErrors?.plate?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.plate[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3 rounded-[24px] border border-border/70 bg-muted/35 p-4">
          <div className="space-y-2">
            <Label>Linea operativa asignada</Label>
            <div className="rounded-[20px] border border-border/80 bg-white/90 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{OPERATIONAL_ROUTE_LABEL}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Todos los buses nuevos y editados se vinculan automaticamente a la
                ruta fija del negocio.
              </p>
            </div>
          </div>
          <Badge variant="muted">Asignacion automatica</Badge>
        </div>

        <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/35 p-4">
          <Label htmlFor="bus-status">Estado</Label>
          <Select defaultValue={bus?.status ?? "active"} id="bus-status" name="status">
            <option value="active">Activo</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="inactive">Inactivo</option>
          </Select>
          {state.fieldErrors?.status?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.status[0]}</p>
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

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Guardando...">
          {bus ? "Guardar cambios" : "Crear bus"}
        </SubmitButton>
        {bus ? (
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            href="/dashboard/buses"
          >
            Cancelar edicion
          </Link>
        ) : null}
      </div>
    </form>
  );
}
