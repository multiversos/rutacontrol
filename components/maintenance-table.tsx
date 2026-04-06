import Link from "next/link";

import { BusIdentity } from "@/components/buses/bus-identity";
import { MaintenanceStatusBadge } from "@/components/maintenance-status-badge";
import { Badge } from "@/components/ui/badge";
import type {
  MaintenanceCycleItem,
  MaintenanceFilters,
  MaintenanceRecordListItem,
} from "@/lib/maintenance";
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from "@/lib/maintenance-config";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";

type MaintenanceBusOption = {
  code: string;
  id: string;
  photoUrl?: string | null;
  plate: string;
  status: string;
};

type MaintenanceTableProps = {
  busOptions: MaintenanceBusOption[];
  currentCycles: MaintenanceCycleItem[];
  filters: Required<MaintenanceFilters>;
  historyByBus: Array<{
    busCode: string;
    busId: string;
    busPhotoUrl: string | null;
    busPlate: string | null;
    dueSoonCount: number;
    overdueCount: number;
    recordCount: number;
  }>;
  maintenanceRecords: MaintenanceRecordListItem[];
};

function renderDebtBadge(
  debt: MaintenanceCycleItem["debt"] | MaintenanceRecordListItem["debt"],
) {
  if (!debt) {
    return <span className="text-muted-foreground">Sin deuda</span>;
  }

  return (
    <div className="space-y-1">
      <Badge variant={debt.status === "paid" ? "success" : "warning"}>
        {debt.status === "paid"
          ? "Pagada"
          : debt.status === "partial"
            ? "Parcial"
            : "Pendiente"}
      </Badge>
      <p className="text-xs text-muted-foreground">
        {debt.creditor} · saldo {formatCurrency(debt.balanceDueUsd)}
      </p>
    </div>
  );
}

export function MaintenanceTable({
  busOptions,
  currentCycles,
  filters,
  historyByBus,
  maintenanceRecords,
}: MaintenanceTableProps) {
  return (
    <div className="space-y-6">
      <form className="grid gap-4 rounded-[28px] border border-border bg-card/90 p-5 shadow-soft md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="maintenance-date-from">
            Desde
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateFrom}
            id="maintenance-date-from"
            name="dateFrom"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="maintenance-date-to">
            Hasta
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateTo}
            id="maintenance-date-to"
            name="dateTo"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="maintenance-bus-filter">
            Bus
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.busId}
            id="maintenance-bus-filter"
            name="busId"
          >
            <option value="">Todos los buses</option>
            {busOptions.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="maintenance-status-filter">
            Estado actual
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.status}
            id="maintenance-status-filter"
            name="status"
          >
            <option value="all">Todos</option>
            <option value="up_to_date">Al dia</option>
            <option value="due_soon">Proximo a vencer</option>
            <option value="overdue">Vencido</option>
          </select>
        </div>

        <button
          className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          type="submit"
        >
          Aplicar filtros
        </button>

        <Link
          className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
          href="/dashboard/maintenance"
        >
          Limpiar
        </Link>
      </form>

      <div className="space-y-4 rounded-[28px] border border-border bg-card/90 p-5 shadow-soft">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Proximos cambios por dias trabajados</p>
          <p className="text-sm text-muted-foreground">
            Se calculan con registros diarios cerrados del bus posteriores al ultimo
            mantenimiento.
          </p>
        </div>

        {currentCycles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No hay ciclos activos de mantenimiento para los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[28px] border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3">Control</th>
                  <th className="px-4 py-3">Ultimo cambio</th>
                  <th className="px-4 py-3">Dias trabajados</th>
                  <th className="px-4 py-3">Umbral</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Deuda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {currentCycles.map((cycle) => (
                  <tr key={`${cycle.maintenanceRecordId}-${cycle.componentLabel}`}>
                    <td className="px-4 py-3">
                      <BusIdentity
                        code={cycle.busCode}
                        photoUrl={cycle.busPhotoUrl}
                        plate={cycle.busPlate}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p>{cycle.componentLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {cycle.provider}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDateLabel(cycle.serviceDate)}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-semibold">{cycle.workedDays} dias</p>
                        {cycle.previousCycleWorkDays != null ? (
                          <p className="text-xs text-muted-foreground">
                            Ciclo anterior: {cycle.previousCycleWorkDays} dias
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p>{cycle.expectedWorkDays} dias</p>
                        <p className="text-xs text-muted-foreground">
                          Restan {cycle.remainingWorkDays} dias
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <MaintenanceStatusBadge status={cycle.status} />
                    </td>
                    <td className="px-4 py-3">{renderDebtBadge(cycle.debt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-[28px] border border-border bg-card/90 p-5 shadow-soft">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Historial por bus</p>
          <p className="text-sm text-muted-foreground">
            Revisa cuantos servicios visibles acumula cada unidad y donde ya hay
            proximos vencimientos.
          </p>
        </div>

        {historyByBus.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Todavia no hay historial visible para el filtro actual.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[28px] border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3">Servicios visibles</th>
                  <th className="px-4 py-3">Proximos a vencer</th>
                  <th className="px-4 py-3">Vencidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {historyByBus.map((entry) => (
                  <tr key={entry.busId}>
                    <td className="px-4 py-3">
                      <BusIdentity
                        code={entry.busCode}
                        photoUrl={entry.busPhotoUrl}
                        plate={entry.busPlate}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3">{entry.recordCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.dueSoonCount > 0 ? "warning" : "success"}>
                        {entry.dueSoonCount}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {entry.overdueCount > 0 ? (
                        <Badge className="bg-destructive/10 text-destructive" variant="warning">
                          {entry.overdueCount}
                        </Badge>
                      ) : (
                        <Badge variant="success">0</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-[28px] border border-border bg-card/90 p-5 shadow-soft">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Servicios registrados</p>
          <p className="text-sm text-muted-foreground">
            Cada registro conserva costo, deuda asociada y detalle por pieza cuando
            aplica.
          </p>
        </div>

        {maintenanceRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No hay mantenimientos visibles para el rango actual.
          </div>
        ) : (
          <div className="space-y-4">
            {maintenanceRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-3xl border border-border/80 bg-white/75 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <BusIdentity
                        code={record.busCode}
                        photoUrl={record.busPhotoUrl}
                        plate={record.busPlate}
                        size="sm"
                      />
                      <Badge variant="muted">
                        {MAINTENANCE_TYPE_LABELS[record.maintenanceType]}
                      </Badge>
                      {record.currentCycle ? (
                        <MaintenanceStatusBadge status={record.currentCycle.status} />
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold">{record.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateLabel(record.serviceDate)} · {record.provider}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm lg:text-right">
                    <p className="font-semibold">
                      {formatCurrency(record.totalCostUsd)}
                    </p>
                    {record.expectedWorkDays ? (
                      <p className="text-muted-foreground">
                        Umbral general: {record.expectedWorkDays} dias
                      </p>
                    ) : null}
                    {record.previousCycleWorkDays != null ? (
                      <p className="text-muted-foreground">
                        Duracion del ciclo anterior: {record.previousCycleWorkDays} dias
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-3">
                    {record.items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Este mantenimiento no requirio piezas por posicion. El
                        seguimiento queda a nivel general.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {record.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-border/80 bg-card/80 p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{item.componentLabel}</p>
                              {item.currentCycle ? (
                                <MaintenanceStatusBadge status={item.currentCycle.status} />
                              ) : null}
                            </div>
                            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                              <p>Costo: {formatCurrency(item.costUsd)}</p>
                              <p>
                                Duracion esperada:{" "}
                                {item.expectedWorkDays != null
                                  ? `${item.expectedWorkDays} dias`
                                  : "Sin umbral"}
                              </p>
                              <p>
                                Duracion anterior:{" "}
                                {item.previousCycleWorkDays != null
                                  ? `${item.previousCycleWorkDays} dias`
                                  : "Sin historial"}
                              </p>
                              {item.currentCycle ? (
                                <p>
                                  Dias trabajados actuales: {item.currentCycle.workedDays}
                                </p>
                              ) : null}
                              {item.notes?.trim() ? <p>{item.notes}</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/30 p-4 text-sm">
                    <div>
                      <p className="font-semibold">Deuda asociada</p>
                      <div className="mt-2">{renderDebtBadge(record.debt)}</div>
                    </div>

                    {record.currentCycle ? (
                      <div>
                        <p className="font-semibold">Proximo cambio esperado</p>
                        <p className="mt-2 text-muted-foreground">
                          {MAINTENANCE_STATUS_LABELS[record.currentCycle.status]} ·{" "}
                          {record.currentCycle.workedDays} de{" "}
                          {record.currentCycle.expectedWorkDays} dias trabajados.
                        </p>
                      </div>
                    ) : null}

                    {record.notes?.trim() ? (
                      <div>
                        <p className="font-semibold">Observaciones</p>
                        <p className="mt-2 text-muted-foreground">{record.notes}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
