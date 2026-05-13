import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, WalletCards } from "lucide-react";

import { OperationalCashAdjustmentForm } from "@/components/operational-cash-adjustment-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";
import type {
  OperationalCashMovementItem,
  OperationalCashSummary,
} from "@/lib/operational-cash";
import { cn } from "@/lib/utils";

type OperationalCashCardProps = {
  canAdjust?: boolean;
  selectedDate: string;
  summary: OperationalCashSummary;
};

const movementTypeLabels: Record<OperationalCashMovementItem["type"], string> = {
  daily_net: "Neto diario",
  debt_payment: "Pago de deuda",
  manual_adjustment: "Ajuste manual",
};

function formatSignedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";

  return `${prefix} ${formatCurrency(Math.abs(value))}`;
}

function MovementAmount({ movement }: { movement: OperationalCashMovementItem }) {
  const isNegative = movement.signedAmountUsd < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        isNegative ? "text-destructive" : "text-emerald-700",
      )}
    >
      {isNegative ? (
        <ArrowDownLeft className="h-4 w-4" />
      ) : (
        <ArrowUpRight className="h-4 w-4" />
      )}
      {formatSignedCurrency(movement.signedAmountUsd)}
    </span>
  );
}

export function OperationalCashCard({
  canAdjust = false,
  selectedDate,
  summary,
}: OperationalCashCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-primary" />
              <CardTitle>Caja operativa</CardTitle>
            </div>
            <CardDescription>
              Saldo acumulado desde los netos cerrados de los buses y pagos
              marcados como salidos de caja.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Badge variant="muted">{formatDateLabel(selectedDate)}</Badge>
            {summary.migrationReady ? (
              <Link
                className={buttonVariants({
                  size: "sm",
                  variant: "secondary",
                })}
                href="/dashboard/operational-cash"
              >
                Ver movimientos
              </Link>
            ) : null}
            {canAdjust && summary.migrationReady ? (
              <OperationalCashAdjustmentForm defaultDate={selectedDate} />
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">Saldo actual</p>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold",
                summary.balanceUsd < 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {formatCurrency(summary.balanceUsd)}
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">Entradas de hoy</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">
              {formatCurrency(summary.inTodayUsd)}
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">Salidas de hoy</p>
            <p className="mt-2 text-2xl font-semibold text-destructive">
              {formatCurrency(summary.outTodayUsd)}
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">Neto de caja hoy</p>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold",
                summary.netTodayUsd < 0 ? "text-destructive" : "text-emerald-700",
              )}
            >
              {formatSignedCurrency(summary.netTodayUsd)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Historial de movimientos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ultimos impactos registrados en la Caja operativa.
          </p>
        </div>

        {!summary.migrationReady ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-800">
            La Caja operativa ya esta integrada en la app, pero falta aplicar la
            migracion `20260513210858_operational_cash_box.sql` en esta base.
          </div>
        ) : summary.latestMovements.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            Todavia no hay movimientos de caja para mostrar.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[24px] border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descripcion</th>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/70">
                {summary.latestMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-4 py-3">
                      {formatDateLabel(movement.movementDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">
                        {movementTypeLabels[movement.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{movement.description}</td>
                    <td className="px-4 py-3">
                      {movement.busCode ? `Bus ${movement.busCode}` : "--"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MovementAmount movement={movement} />
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
