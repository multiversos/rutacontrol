import { ArrowDownLeft, ArrowUpRight, History, WalletCards } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateLabel } from "@/lib/formatters";
import type { OperationalCashMovementItem } from "@/lib/operational-cash";
import { cn } from "@/lib/utils";

type OperationalCashSummaryProps = {
  balanceUsd: number;
  filteredInUsd: number;
  filteredNetUsd: number;
  filteredOutUsd: number;
  lastMovement: OperationalCashMovementItem | null;
  movementCount: number;
};

function signedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";

  return `${prefix} ${formatCurrency(Math.abs(value))}`;
}

export function OperationalCashSummary({
  balanceUsd,
  filteredInUsd,
  filteredNetUsd,
  filteredOutUsd,
  lastMovement,
  movementCount,
}: OperationalCashSummaryProps) {
  const items = [
    {
      icon: WalletCards,
      label: "Saldo actual",
      tone: balanceUsd < 0 ? "text-destructive" : "text-foreground",
      value: formatCurrency(balanceUsd),
    },
    {
      icon: ArrowUpRight,
      label: "Entradas filtradas",
      tone: "text-emerald-700",
      value: formatCurrency(filteredInUsd),
    },
    {
      icon: ArrowDownLeft,
      label: "Salidas filtradas",
      tone: "text-destructive",
      value: formatCurrency(filteredOutUsd),
    },
    {
      icon: History,
      label: "Neto del rango",
      tone: filteredNetUsd < 0 ? "text-destructive" : "text-emerald-700",
      value: signedCurrency(filteredNetUsd),
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_1.3fr]">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
              <p className={cn("mt-3 text-2xl font-semibold", item.tone)}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Movimientos visibles</p>
          <p className="mt-3 text-2xl font-semibold">{movementCount}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Último movimiento:{" "}
            {lastMovement
              ? formatDateLabel(lastMovement.movementDate)
              : "Sin movimientos"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
