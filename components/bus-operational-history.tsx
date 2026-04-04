import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusProfileOperationalRecord } from "@/lib/bus-profile";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";

type BusOperationalHistoryProps = {
  filters: {
    dateFrom: string;
    dateTo: string;
    recordStatus: "all" | "closed" | "draft";
  };
  records: BusProfileOperationalRecord[];
};

function getStatusBadge(status: BusProfileOperationalRecord["status"]) {
  if (status === "closed") {
    return <Badge variant="success">Cerrado</Badge>;
  }

  return <Badge variant="warning">Borrador</Badge>;
}

export function BusOperationalHistory({
  filters,
  records,
}: BusOperationalHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operacion diaria del bus</CardTitle>
        <CardDescription>
          Historial operativo real de la unidad, con cierre, responsable,
          ingresos, gastos y diferencias por dia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="grid gap-4 rounded-3xl border border-border/80 bg-white/70 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-date-from">
              Desde
            </label>
            <input
              className="flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm"
              defaultValue={filters.dateFrom}
              id="profile-date-from"
              name="dateFrom"
              type="date"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-date-to">
              Hasta
            </label>
            <input
              className="flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm"
              defaultValue={filters.dateTo}
              id="profile-date-to"
              name="dateTo"
              type="date"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-record-status">
              Estado
            </label>
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm"
              defaultValue={filters.recordStatus}
              id="profile-record-status"
              name="recordStatus"
            >
              <option value="all">Todos</option>
              <option value="closed">Cerrados</option>
              <option value="draft">Borradores</option>
            </select>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
            type="submit"
          >
            Aplicar filtros
          </button>
        </form>

        {records.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            No hay registros diarios visibles para el rango actual.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card/80">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Ingreso</th>
                  <th className="px-4 py-3">Gastos</th>
                  <th className="px-4 py-3">Neto</th>
                  <th className="px-4 py-3">Diferencia</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Cierre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 font-medium">
                      {formatDateLabel(record.recordDate)}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(record.incomeUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(record.expenseUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(record.netUsd)}</td>
                    <td className="px-4 py-3">{formatCurrency(record.difference)}</td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3">
                      {record.userName ?? "Sin responsable"}
                    </td>
                    <td className="px-4 py-3">
                      {record.closedAt ? formatDateTime(record.closedAt) : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
