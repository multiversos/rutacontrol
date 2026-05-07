"use client";

import { useState } from "react";

import { BusIdentity } from "@/components/buses/bus-identity";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type BusOption = Pick<Tables<"buses">, "code" | "id" | "plate"> & {
  photoUrl?: string | null;
  routeName?: string;
  status?: Tables<"buses">["status"] | string;
};

type ExistingRecordRef = Pick<Tables<"daily_records">, "bus_id" | "id" | "record_date">;

type BusSelectorProps = {
  ariaDescribedBy?: string | undefined;
  buses: BusOption[];
  currentRecordId?: string | null;
  disabled?: boolean;
  emptyLabel?: string;
  existingRecords?: ExistingRecordRef[];
  helperText?: string;
  id?: string;
  layout?: "grid" | "list";
  labelId?: string | undefined;
  name?: string;
  onChange: (value: string) => void;
  recordDate?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  value: string;
};

export function BusSelector({
  ariaDescribedBy,
  buses,
  currentRecordId,
  disabled = false,
  emptyLabel = "No hay buses disponibles para seleccionar.",
  existingRecords = [],
  helperText = "Selecciona la unidad correcta usando foto, codigo y placa. La base confirma el bloqueo final al guardar.",
  id = "bus-selector",
  layout = "grid",
  labelId = `${id}-label`,
  name = "busId",
  onChange,
  recordDate,
  searchable = false,
  searchPlaceholder = "Buscar por codigo o placa",
  value,
}: BusSelectorProps) {
  const [query, setQuery] = useState("");
  const isBlocked = (busId: string) =>
    existingRecords.some(
      (record) =>
        record.bus_id === busId &&
        record.record_date === recordDate &&
        record.id !== currentRecordId,
    );

  const selectedBusBlocked = value ? isBlocked(value) : false;
  const normalizedQuery = query.trim().toLowerCase();
  const selectedBus = buses.find((bus) => bus.id === value) ?? null;
  const filteredBuses = buses.filter((bus) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [bus.code, bus.plate, bus.routeName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
  const helperId = `${id}-helper`;
  const searchId = `${id}-search`;
  const statusId = `${id}-status`;
  const describedBy = [selectedBusBlocked ? statusId : helperId, ariaDescribedBy]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-3">
      <input id={`${id}-value`} name={name} type="hidden" value={value} />

      {searchable ? (
        <div className="space-y-2">
          <Input
            autoComplete="off"
            id={searchId}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
          {selectedBus ? (
            <div className="flex items-center justify-between gap-3 rounded-[22px] border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <BusIdentity
                className="min-w-0"
                code={selectedBus.code}
                photoUrl={selectedBus.photoUrl ?? null}
                plate={selectedBus.plate}
                secondaryText={selectedBus.routeName ?? null}
                size="sm"
                wrap
              />
              <Badge variant="success">Seleccionado</Badge>
            </div>
          ) : null}
        </div>
      ) : null}

      {buses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          No encontramos buses con ese criterio. Prueba con otro codigo o placa.
        </div>
      ) : (
        <div
          aria-disabled={disabled}
          aria-describedby={describedBy || undefined}
          aria-invalid={selectedBusBlocked}
          aria-labelledby={labelId}
          className={cn(
            "grid max-h-[360px] auto-rows-min gap-3 overflow-y-auto overscroll-contain pr-1",
            layout === "grid" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1",
          )}
          id={id}
          role="radiogroup"
        >
          {filteredBuses.map((bus) => {
            const blocked = recordDate ? isBlocked(bus.id) : false;
            const unavailable = (bus.status ?? "active") !== "active" && bus.id !== value;
            const isSelected = bus.id === value;
            const optionDisabled = disabled || blocked || unavailable;

            return (
              <button
                aria-checked={isSelected}
                className={cn(
                  "flex h-auto min-h-[72px] w-full min-w-0 items-center overflow-hidden rounded-[22px] border px-4 py-3 text-left transition-colors",
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
                <div className="grid w-full min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <BusIdentity
                    className="min-w-0"
                    code={bus.code}
                    photoUrl={bus.photoUrl ?? null}
                    plate={bus.plate}
                    secondaryText={bus.routeName ?? null}
                    size="sm"
                    wrap
                  />

                  <div className="flex flex-wrap gap-2 sm:justify-end">
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
        <p className="text-sm text-destructive" id={statusId}>
          El bus seleccionado ya tiene un registro para esta fecha.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground" id={helperId}>
          {searchable
            ? `${filteredBuses.length} bus${filteredBuses.length === 1 ? "" : "es"} visible${filteredBuses.length === 1 ? "" : "s"}. ${helperText}`
            : helperText}
        </p>
      )}
    </div>
  );
}
