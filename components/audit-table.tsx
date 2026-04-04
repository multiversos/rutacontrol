import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatDateLabel, formatDateTime } from "@/lib/formatters";

export type AuditFilters = {
  dateFrom: string | undefined;
  dateTo: string | undefined;
};

export type AuditEntry = {
  action: "close" | "create" | "delete" | "update";
  actorName: string;
  busCode: string | undefined;
  createdAt: string;
  id: string;
  note: string;
  recordDate: string | undefined;
  recordId: string;
  statusAfter: string | undefined;
};

type AuditTableProps = {
  entries: AuditEntry[];
  filters: AuditFilters;
};

const actionVariantMap = {
  close: "success",
  create: "default",
  delete: "warning",
  update: "warning",
} as const;

const actionLabelMap = {
  close: "Cierre",
  create: "Creacion",
  delete: "Eliminacion",
  update: "Actualizacion",
} as const;

export function AuditTable({ entries, filters }: AuditTableProps) {
  return (
    <div className="space-y-4">
      <form className="grid gap-4 rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.92))] p-5 shadow-soft md:grid-cols-[1fr_1fr_auto_auto]">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="audit-date-from">
            Desde
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateFrom ?? ""}
            id="audit-date-from"
            name="dateFrom"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="audit-date-to">
            Hasta
          </label>
          <input
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue={filters.dateTo ?? ""}
            id="audit-date-to"
            name="dateTo"
            type="date"
          />
        </div>

        <button
          className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          type="submit"
        >
          Aplicar filtros
        </button>

        <Link
          className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
          href="/dashboard/audit"
        >
          Limpiar
        </Link>
      </form>

      {entries.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          No hay movimientos de auditoria para el rango seleccionado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[30px] border border-border bg-card/95 shadow-soft">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/65 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Accion</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Bus</th>
                <th className="px-4 py-3">Fecha operativa</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Estado final</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white/70">
              {entries.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-secondary/35">
                  <td className="whitespace-nowrap px-4 py-4">{formatDateTime(entry.createdAt)}</td>
                  <td className="px-4 py-4">
                    <Badge variant={actionVariantMap[entry.action]}>
                      {actionLabelMap[entry.action]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">{entry.actorName}</td>
                  <td className="px-4 py-4">{entry.busCode ?? "--"}</td>
                  <td className="px-4 py-4">
                    {entry.recordDate ? formatDateLabel(entry.recordDate) : "--"}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">{entry.recordId}</td>
                  <td className="px-4 py-4">
                    {entry.statusAfter === "closed"
                      ? "Cerrado"
                      : entry.statusAfter === "draft"
                        ? "Borrador"
                        : "--"}
                  </td>
                  <td className="px-4 py-4">{entry.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
