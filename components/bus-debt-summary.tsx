import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusProfileDebtItem } from "@/lib/bus-profile";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";

type BusDebtSummaryProps = {
  associatedDebts: BusProfileDebtItem[];
  openBalanceUsd: number;
};

function getStatusBadge(status: BusProfileDebtItem["status"]) {
  if (status === "paid") {
    return <Badge variant="success">Pagada</Badge>;
  }

  if (status === "partial") {
    return <Badge variant="default">Parcial</Badge>;
  }

  return <Badge variant="warning">Pendiente</Badge>;
}

export function BusDebtSummary({
  associatedDebts,
  openBalanceUsd,
}: BusDebtSummaryProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Deudas asociadas a la unidad</CardTitle>
            <CardDescription>
              Saldo pendiente del bus ligado a operacion diaria, mantenimiento o
              compromisos financieros relacionados.
            </CardDescription>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href="/dashboard/debts"
          >
            Abrir modulo de deudas
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Saldo pendiente acumulado
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {formatCurrency(openBalanceUsd)}
          </p>
        </div>

        {associatedDebts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Esta unidad no tiene deudas relacionadas en el periodo visible.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {associatedDebts.map((debt) => (
              <div
                key={debt.id}
                className="rounded-3xl border border-border/80 bg-white/80 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{debt.creditor}</p>
                    <p className="text-sm text-muted-foreground">{debt.sourceLabel}</p>
                  </div>
                  {getStatusBadge(debt.status)}
                </div>

                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p>Concepto: {debt.description}</p>
                  <p>Monto original: {formatCurrency(debt.amountUsd)}</p>
                  <p>Abonado: {formatCurrency(debt.amountPaidUsd)}</p>
                  <p>Saldo pendiente: {formatCurrency(debt.balanceDueUsd)}</p>
                  <p>Creada: {formatDateLabel(debt.createdAt.slice(0, 10))}</p>
                  <p>Vence: {debt.dueDate ? formatDateLabel(debt.dueDate) : "Sin fecha"}</p>
                </div>

                {debt.payments.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">Pagos parciales</p>
                      <Badge variant="muted">{debt.paymentCount} pagos</Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {debt.payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex justify-between gap-3">
                          <span>{formatDateLabel(payment.paymentDate)}</span>
                          <span>{formatCurrency(payment.amountUsd)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4">
                  <Link
                    className="text-sm font-semibold text-primary"
                    href={`/dashboard/debts?pay=${debt.id}`}
                  >
                    Ver deuda detallada
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
