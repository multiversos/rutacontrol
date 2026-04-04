import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RepairListItem } from "@/lib/repairs";
import { formatCurrency, formatDateLabel, formatFileSize } from "@/lib/formatters";

const categoryLabels: Record<RepairListItem["category"], string> = {
  bodywork: "Carroceria",
  electrical: "Electrica",
  inspection: "Inspeccion",
  mechanical: "Mecanica",
  oil_change: "Cambio de aceite",
  other: "Otra",
  tires: "Cauchos",
};

type BusRepairHistoryProps = {
  busId: string;
  nextServiceSuggestion: {
    dueDate: string | null;
    notes: string | null;
    repairDate: string | null;
  } | null;
  repairs: RepairListItem[];
};

export function BusRepairHistory({
  busId,
  nextServiceSuggestion,
  repairs,
}: BusRepairHistoryProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reparaciones del bus</CardTitle>
            <CardDescription>
              Historial de reparaciones, comprobantes, costos y proximas revisiones
              sugeridas de esta unidad.
            </CardDescription>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href={`/dashboard/repairs?busId=${busId}`}
          >
            Abrir modulo de reparaciones
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Proxima revision o servicio sugerido
          </p>
          {nextServiceSuggestion ? (
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold">
                {nextServiceSuggestion.dueDate
                  ? formatDateLabel(nextServiceSuggestion.dueDate)
                  : "Sin fecha sugerida"}
              </p>
              <p className="text-sm text-muted-foreground">
                Base de referencia:{" "}
                {nextServiceSuggestion.repairDate
                  ? formatDateLabel(nextServiceSuggestion.repairDate)
                  : "Sin reparacion previa"}
              </p>
              {nextServiceSuggestion.notes ? (
                <p className="text-sm text-muted-foreground">
                  {nextServiceSuggestion.notes}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No hay una proxima revision sugerida registrada para este bus.
            </p>
          )}
        </div>

        {repairs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Esta unidad no tiene reparaciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card/80">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3">Proxima revision</th>
                  <th className="px-4 py-3">Comprobante</th>
                  <th className="px-4 py-3">Descripcion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {repairs.map((repair) => (
                  <tr key={repair.id}>
                    <td className="px-4 py-3 font-medium">
                      {formatDateLabel(repair.repairDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{categoryLabels[repair.category]}</Badge>
                    </td>
                    <td className="px-4 py-3">{repair.provider}</td>
                    <td className="px-4 py-3">{formatCurrency(repair.costUsd)}</td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
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
                        <span className="text-muted-foreground">Sin adjunto</span>
                      )}
                      {repair.attachment ? (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(repair.attachment.fileSizeBytes)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{repair.description}</td>
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
