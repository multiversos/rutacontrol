"use client";

import { Select } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/database.types";

type BusOption = Pick<Tables<"buses">, "code" | "id" | "plate" | "status"> & {
  routeName: string;
};

type ExistingRecordRef = Pick<Tables<"daily_records">, "bus_id" | "id" | "record_date">;

type BusSelectorProps = {
  buses: BusOption[];
  currentRecordId?: string | null;
  disabled?: boolean;
  existingRecords: ExistingRecordRef[];
  onChange: (value: string) => void;
  recordDate: string;
  value: string;
};

export function BusSelector({
  buses,
  currentRecordId,
  disabled = false,
  existingRecords,
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
      <Select
        disabled={disabled}
        id="bus-selector"
        name="busId"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Selecciona un bus</option>
        {buses.map((bus) => {
          const blocked = isBlocked(bus.id);
          const disabled =
            blocked || (bus.status !== "active" && bus.id !== value);

          return (
            <option disabled={disabled} key={bus.id} value={bus.id}>
              {bus.code} - {bus.routeName} - {bus.plate}
              {blocked ? " - Ya registrado" : ""}
              {bus.status !== "active" ? " - No disponible" : ""}
            </option>
          );
        })}
      </Select>

      {selectedBusBlocked ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          El bus seleccionado ya tiene un registro para esta fecha.
        </p>
      ) : (
        <p className="rounded-2xl bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
          Solo se habilitan unidades activas y sin choques visibles para tu alcance
          actual. La base confirma el bloqueo final al guardar.
        </p>
      )}
    </div>
  );
}
