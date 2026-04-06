"use client";

import { BusIdentity } from "@/components/buses/bus-identity";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type BusOption = Pick<Tables<"buses">, "code" | "id" | "plate"> & {
  photoUrl?: string | null;
  routeName?: string;
  status?: Tables<"buses">["status"] | string;
};

type ExistingRecordRef = Pick<Tables<"daily_records">, "bus_id" | "id" | "record_date">;

type BusSelectorProps = {
  buses: BusOption[];
  currentRecordId?: string | null;
  disabled?: boolean;
  emptyLabel?: string;
  existingRecords?: ExistingRecordRef[];
  helperText?: string;
  id?: string;
  name?: string;
  onChange: (value: string) => void;
  recordDate?: string;
  value: string;
};

export function BusSelector({
  buses,
  currentRecordId,
  disabled = false,
  emptyLabel = "No hay buses disponibles para seleccionar.",
  existingRecords = [],
  helperText = "Selecciona la unidad correcta usando foto, codigo y placa. La base confirma el bloqueo final al guardar.",
  id = "bus-selector",
  name = "busId",
  onChange,
  recordDate,
  value,
}: BusSelectorProps) {
  const isBlocked = (busId: string) =>
    existingRecords.some(
      (record) =>
        record.bus_id === busId &&
        record.record_date === recordDate &&
        record.id !== currentRecordId,
    );

  const selectedBusBlocked = value ? isBlocked(value) : false;

  return (
    <div className="space-y-3">
      <input id={id} name={name} type="hidden" value={value} />

      {buses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div
          aria-disabled={disabled}
          className="grid gap-3 sm:grid-cols-2"
          role="radiogroup"
        >
          {buses.map((bus) => {
            const blocked = recordDate ? isBlocked(bus.id) : false;
            const unavailable = (bus.status ?? "active") !== "active" && bus.id !== value;
            const isSelected = bus.id === value;
            const optionDisabled = disabled || blocked || unavailable;

            return (
              <button
                aria-checked={isSelected}
                className={cn(
                  "rounded-3xl border px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-white/85 hover:border-primary/40 hover:bg-primary/5",
                  optionDisabled && "cursor-not-allowed opacity-60",
                )}
                disabled={optionDisabled}
                key={bus.id}
                onClick={() => onChange(bus.id)}
                role="radio"
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <BusIdentity
                    code={bus.code}
                    photoUrl={bus.photoUrl ?? null}
                    plate={bus.plate}
                    secondaryText={bus.routeName ?? null}
                    size="sm"
                  />

                  <div className="flex flex-wrap justify-end gap-2">
                    {isSelected ? <Badge variant="success">Seleccionado</Badge> : null}
                    {blocked ? (
                      <Badge className="bg-destructive/10 text-destructive" variant="muted">
                        Ya registrado
                      </Badge>
                    ) : null}
                    {unavailable ? <Badge variant="warning">No disponible</Badge> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedBusBlocked ? (
        <p className="text-sm text-destructive">
          El bus seleccionado ya tiene un registro para esta fecha.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}
