import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  OperationalCashBusOption,
  OperationalCashFilterState,
} from "@/lib/operational-cash";

type OperationalCashFiltersProps = {
  busOptions: OperationalCashBusOption[];
  filters: OperationalCashFilterState;
};

export function buildOperationalCashHref(
  filters: OperationalCashFilterState,
  overrides?: Partial<OperationalCashFilterState>,
) {
  const next = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.type) params.set("type", next.type);
  if (next.direction) params.set("direction", next.direction);
  if (next.busId) params.set("busId", next.busId);
  if (next.q) params.set("q", next.q);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 25) params.set("pageSize", String(next.pageSize));

  const query = params.toString();
  return query ? `/dashboard/operational-cash?${query}` : "/dashboard/operational-cash";
}

export function OperationalCashFilters({
  busOptions,
  filters,
}: OperationalCashFiltersProps) {
  return (
    <form className="grid gap-4 lg:grid-cols-[repeat(7,minmax(0,1fr))_auto_auto]">
      <div className="space-y-2">
        <Label htmlFor="cash-from">Fecha desde</Label>
        <Input defaultValue={filters.from ?? ""} id="cash-from" name="from" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cash-to">Fecha hasta</Label>
        <Input defaultValue={filters.to ?? ""} id="cash-to" name="to" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cash-type">Tipo</Label>
        <Select defaultValue={filters.type ?? ""} id="cash-type" name="type">
          <option value="">Todos</option>
          <option value="daily_net">Neto diario</option>
          <option value="debt_payment">Pago de deuda</option>
          <option value="manual_adjustment">Ajuste manual</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cash-direction">Dirección</Label>
        <Select
          defaultValue={filters.direction ?? ""}
          id="cash-direction"
          name="direction"
        >
          <option value="">Todas</option>
          <option value="in">Entradas</option>
          <option value="out">Salidas</option>
          <option value="adjustment">Ajustes</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cash-bus">Bus</Label>
        <Select defaultValue={filters.busId ?? ""} id="cash-bus" name="busId">
          <option value="">Todos</option>
          {busOptions.map((bus) => (
            <option key={bus.id} value={bus.id}>
              Bus {bus.code}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cash-q">Buscar</Label>
        <Input
          defaultValue={filters.q ?? ""}
          id="cash-q"
          name="q"
          placeholder="Descripcion o motivo"
          type="search"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cash-page-size">Por página</Label>
        <Select
          defaultValue={String(filters.pageSize)}
          id="cash-page-size"
          name="pageSize"
        >
          <option value="25">25</option>
          <option value="50">50</option>
        </Select>
      </div>

      <Button className="self-end" type="submit">
        Aplicar
      </Button>

      <Link
        className={buttonVariants({
          className: "self-end",
          variant: "outline",
        })}
        href="/dashboard/operational-cash"
      >
        Limpiar
      </Link>
    </form>
  );
}
