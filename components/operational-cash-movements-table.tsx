import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CircleDot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";
import type {
  OperationalCashFilterState,
  OperationalCashMovementItem,
} from "@/lib/operational-cash";
import { cn } from "@/lib/utils";
import { buildOperationalCashHref } from "@/components/operational-cash-filters";

type OperationalCashMovementsTableProps = {
  filters: OperationalCashFilterState;
  movements: OperationalCashMovementItem[];
  pageInfo: {
    end: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
    pageSize: 25 | 50;
    start: number;
    totalItems: number;
    totalPages: number;
  };
};

const typeLabels: Record<OperationalCashMovementItem["type"], string> = {
  daily_net: "Neto diario",
  debt_payment: "Pago de deuda",
  manual_adjustment: "Ajuste manual",
};

const directionLabels: Record<OperationalCashMovementItem["direction"], string> = {
  adjustment: "Ajuste",
  in: "Entrada",
  out: "Salida",
};

function relationLabel(movement: OperationalCashMovementItem) {
  if (movement.dailyRecordId) return "Registro diario";
  if (movement.debtPaymentId) return "Pago de deuda";
  if (movement.debtId) return "Deuda";

  return "Movimiento manual";
}

function signedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";

  return `${prefix} ${formatCurrency(Math.abs(value))}`;
}

function MovementAmount({ movement }: { movement: OperationalCashMovementItem }) {
  const isNegative = movement.signedAmountUsd < 0;
  const Icon =
    movement.direction === "adjustment"
      ? CircleDot
      : isNegative
        ? ArrowDownLeft
        : ArrowUpRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        isNegative ? "text-destructive" : "text-emerald-700",
        movement.direction === "adjustment" && "text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {signedCurrency(movement.signedAmountUsd)}
    </span>
  );
}

export function OperationalCashMovementsTable({
  filters,
  movements,
  pageInfo,
}: OperationalCashMovementsTableProps) {
  if (movements.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        {pageInfo.totalItems === 0
          ? "No hay movimientos que coincidan con estos filtros."
          : "Todavía no hay movimientos en Caja operativa."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-[24px] border border-border md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Bus</th>
              <th className="px-4 py-3">Relación</th>
              <th className="px-4 py-3 text-right">Entrada</th>
              <th className="px-4 py-3 text-right">Salida</th>
              <th className="px-4 py-3 text-right">Monto firmado</th>
              <th className="px-4 py-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white/70">
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td className="px-4 py-3">{formatDateLabel(movement.movementDate)}</td>
                <td className="px-4 py-3">
                  <Badge variant="muted">{typeLabels[movement.type]}</Badge>
                </td>
                <td className="max-w-[360px] px-4 py-3">
                  <p>{movement.description || "Sin descripción"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Creado {formatDateTime(movement.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {movement.busCode ? `Bus ${movement.busCode}` : "--"}
                </td>
                <td className="px-4 py-3">{relationLabel(movement)}</td>
                <td className="px-4 py-3 text-right">
                  {movement.signedAmountUsd > 0
                    ? formatCurrency(movement.signedAmountUsd)
                    : "--"}
                </td>
                <td className="px-4 py-3 text-right">
                  {movement.signedAmountUsd < 0
                    ? formatCurrency(Math.abs(movement.signedAmountUsd))
                    : "--"}
                </td>
                <td className="px-4 py-3 text-right">
                  <MovementAmount movement={movement} />
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatCurrency(movement.runningBalanceUsd ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {movements.map((movement) => (
          <article
            className="rounded-[24px] border border-border bg-white/70 p-4"
            key={movement.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{typeLabels[movement.type]}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateLabel(movement.movementDate)} ·{" "}
                  {directionLabels[movement.direction]}
                </p>
              </div>
              <MovementAmount movement={movement} />
            </div>
            <p className="mt-3 text-sm">{movement.description || "Sin descripción"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="muted">
                {movement.busCode ? `Bus ${movement.busCode}` : "Sin bus"}
              </Badge>
              <Badge variant="muted">{relationLabel(movement)}</Badge>
              <Badge variant="muted">
                Saldo {formatCurrency(movement.runningBalanceUsd ?? 0)}
              </Badge>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[24px] border border-border bg-muted/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Mostrando {pageInfo.start}-{pageInfo.end} de {pageInfo.totalItems}{" "}
          movimientos.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            aria-disabled={!pageInfo.hasPreviousPage}
            className={buttonVariants({
              className: !pageInfo.hasPreviousPage
                ? "pointer-events-none opacity-50"
                : undefined,
              variant: "outline",
            })}
            href={buildOperationalCashHref(filters, { page: pageInfo.page - 1 })}
          >
            Anterior
          </Link>
          <Badge variant="muted">
            Página {pageInfo.page} de {pageInfo.totalPages}
          </Badge>
          <Link
            aria-disabled={!pageInfo.hasNextPage}
            className={buttonVariants({
              className: !pageInfo.hasNextPage
                ? "pointer-events-none opacity-50"
                : undefined,
              variant: "outline",
            })}
            href={buildOperationalCashHref(filters, { page: pageInfo.page + 1 })}
          >
            Siguiente
          </Link>
        </div>
      </div>
    </div>
  );
}
