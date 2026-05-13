"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OperationalCashMovementItem } from "@/lib/operational-cash";

type OperationalCashExportButtonProps = {
  movements: OperationalCashMovementItem[];
};

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function buildCsv(movements: OperationalCashMovementItem[]) {
  const headers = [
    "Fecha",
    "Tipo",
    "Direccion",
    "Descripcion",
    "Bus",
    "Monto USD",
    "Daily record ID",
    "Debt ID",
    "Debt payment ID",
    "Created at",
  ];
  const rows = movements.map((movement) => [
    movement.movementDate,
    movement.type,
    movement.direction,
    movement.description || "Sin descripcion",
    movement.busCode ?? "",
    movement.signedAmountUsd.toFixed(2),
    movement.dailyRecordId ?? "",
    movement.debtId ?? "",
    movement.debtPaymentId ?? "",
    movement.createdAt,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => csvEscape(value)).join(","))
    .join("\r\n");
}

export function OperationalCashExportButton({
  movements,
}: OperationalCashExportButtonProps) {
  function handleExport() {
    const csv = buildCsv(movements);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "caja-operativa.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      disabled={movements.length === 0}
      onClick={handleExport}
      type="button"
      variant="outline"
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
