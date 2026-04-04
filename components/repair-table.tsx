import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { RepairFilterState, RepairListItem } from "@/lib/repairs";
import {
  formatCurrency,
  formatDateLabel,
  formatDateTime,
  formatFileSize,
} from "@/lib/formatters";

type RepairBusOption = {
  code: string;
  id: string;
};

type RepairTableProps = {
  busOptions: RepairBusOption[];
  filters: Required<RepairFilterState>;
  repairs: RepairListItem[];
};

const categoryLabels: Record<RepairListItem["category"], string> = {
  bodywork: "Carroceria",
  electrical: "Electrica",
  inspection: "Inspeccion",
  mechanical: "Mecanica",
  oil_change: "Cambio de aceite",
  other: "Otra",
  tires: "Cauchos",
};

export function RepairTable({ busOptions, filters, repairs }: RepairTableProps) {
  return (
    <div className="space-y-4">
      <form className="grid gap-4 rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.92))] p-5 shadow-soft md:grid-cols-[1fr_1fr_1fr_auto_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="repairs-date-from">
            Desde
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateFrom}
            id="repairs-date-from"
            name="dateFrom"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="repairs-date-to">
            Hasta
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateTo}
            id="repairs-date-to"
            name="dateTo"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="repairs-bus">
            Bus
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.busId}
            id="repairs-bus"
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

        <button
          className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          type="submit"
        >
          Aplicar filtros
        </button>

        <Link
          className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
          href="/dashboard/repairs"
        >
          Limpiar
        </Link>
      </form>

      {repairs.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          No hay reparaciones visibles para el filtro actual. Prueba otro rango o cambia el bus para revisar historial por unidad.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[30px] border border-border bg-card/95 shadow-soft">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Bus</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3">Proximo servicio</th>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Descripcion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white/70">
              {repairs.map((repair) => (
                <tr key={repair.id} className="transition-colors hover:bg-secondary/35">
                  <td className="px-4 py-4">
                    <div>
                      <p>{formatDateLabel(repair.repairDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        Cargada {formatDateTime(repair.createdAt)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{repair.busCode}</td>
                  <td className="px-4 py-4">
                    <Badge variant="muted">{categoryLabels[repair.category]}</Badge>
                  </td>
                  <td className="px-4 py-4">{repair.provider}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(repair.costUsd)}</td>
                  <td className="px-4 py-4">
                    {repair.nextServiceDueDate ? (
                      <div className="space-y-1">
                        <p>{formatDateLabel(repair.nextServiceDueDate)}</p>
                        {repair.nextServiceNotes ? (
                          <p className="text-xs text-muted-foreground">
                            {repair.nextServiceNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      "--"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {repair.attachment?.signedUrl ? (
                      <a
                        className="font-semibold text-primary"
                        href={repair.attachment.signedUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {repair.attachment.originalName}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Sin enlace</span>
                    )}
                    {repair.attachment ? (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(repair.attachment.fileSizeBytes)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">{repair.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
