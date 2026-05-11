"use client";

import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type HistoryMode = "week" | "month";

type HistorySummaryRow = {
  busCount: number;
  closedRecords: number;
  draftRecords: number;
  label: string;
  openDifferences: number;
  periodKey: string;
  totalCalculatedNet: number;
  totalDifference: number;
  totalExpenses: number;
  totalIncomeUsd: number;
  totalRecords: number;
};

type FinancialHistoryPanelProps = {
  dailyHref: string;
  monthlyRows: HistorySummaryRow[];
  weeklyRows: HistorySummaryRow[];
};

type StatusTone = "danger" | "muted" | "success" | "warning";

type PeriodStatus = {
  helper: string;
  label: string;
  tone: StatusTone;
};

const statusToneClasses: Record<StatusTone, string> = {
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted/60 text-muted-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

function getPeriodStatus(row: HistorySummaryRow): PeriodStatus {
  if (row.totalRecords === 0) {
    return {
      helper: "Sin datos para este periodo",
      label: "Sin datos",
      tone: "muted",
    };
  }

  if (row.openDifferences > 0) {
    return {
      helper:
        row.openDifferences === 1 ? "Diferencia abierta" : "Diferencias abiertas",
      label: "Requiere revision",
      tone: "danger",
    };
  }

  if (row.draftRecords > 0) {
    return {
      helper: "Pendientes por cerrar",
      label: "Pendientes por cerrar",
      tone: "warning",
    };
  }

  return {
    helper: "Sin diferencias",
    label: "Todo al dia",
    tone: "success",
  };
}

function getAggregateStatus(rows: HistorySummaryRow[]): PeriodStatus & { value: string } {
  const totals = summarizeRows(rows);

  if (totals.totalRecords === 0) {
    return {
      helper: "Sin datos para este periodo",
      label: "Sin datos",
      tone: "muted",
      value: "Sin datos",
    };
  }

  if (totals.openDifferences > 0) {
    return {
      helper:
        totals.openDifferences === 1 ? "Diferencia abierta" : "Diferencias abiertas",
      label: "Requiere revision",
      tone: "danger",
      value: `Revisar ${totals.openDifferences}`,
    };
  }

  if (totals.draftRecords > 0) {
    return {
      helper: "Pendientes por cerrar",
      label: "Pendientes por cerrar",
      tone: "warning",
      value: `${totals.draftRecords} borradores`,
    };
  }

  return {
    helper: "Sin diferencias",
    label: "Todo al dia",
    tone: "success",
    value: "Todo al dia",
  };
}

function summarizeRows(rows: HistorySummaryRow[]) {
  return rows.reduce(
    (accumulator, row) => ({
      closedRecords: accumulator.closedRecords + row.closedRecords,
      draftRecords: accumulator.draftRecords + row.draftRecords,
      openDifferences: accumulator.openDifferences + row.openDifferences,
      totalCalculatedNet: accumulator.totalCalculatedNet + row.totalCalculatedNet,
      totalExpenses: accumulator.totalExpenses + row.totalExpenses,
      totalIncomeUsd: accumulator.totalIncomeUsd + row.totalIncomeUsd,
      totalRecords: accumulator.totalRecords + row.totalRecords,
    }),
    {
      closedRecords: 0,
      draftRecords: 0,
      openDifferences: 0,
      totalCalculatedNet: 0,
      totalExpenses: 0,
      totalIncomeUsd: 0,
      totalRecords: 0,
    },
  );
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function TrendChart({ rows }: { rows: HistorySummaryRow[] }) {
  const chartRows = rows.slice(0, 8).reverse();

  if (chartRows.length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-[24px] border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Todavia no hay suficientes registros para mostrar una tendencia.
      </div>
    );
  }

  const values = chartRows.flatMap((row) => [
    row.totalIncomeUsd,
    row.totalCalculatedNet,
    0,
  ]);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = Math.max(maxValue - minValue, 1);
  const chartWidth = 640;
  const chartHeight = 260;
  const paddingX = 42;
  const paddingTop = 28;
  const paddingBottom = 54;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const step =
    chartRows.length > 1
      ? (chartWidth - paddingX * 2) / (chartRows.length - 1)
      : chartWidth - paddingX * 2;
  const yForValue = (value: number) =>
    paddingTop + ((maxValue - value) / range) * plotHeight;
  const zeroY = yForValue(0);
  const barWidth = Math.min(44, Math.max(18, step * 0.42));
  const linePoints = chartRows.map((row, index) => ({
    periodKey: row.periodKey,
    x: paddingX + step * index,
    y: yForValue(row.totalCalculatedNet),
  }));

  return (
    <div className="min-h-72 rounded-[24px] border border-border bg-white/70 p-4">
      <svg
        aria-label="Tendencia de ingreso y neto calculado"
        className="h-72 w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <line
          className="stroke-border"
          strokeDasharray="4 6"
          strokeWidth="1"
          x1={paddingX - 18}
          x2={chartWidth - paddingX + 18}
          y1={zeroY}
          y2={zeroY}
        />
        {chartRows.map((row, index) => {
          const x = paddingX + step * index;
          const incomeY = yForValue(row.totalIncomeUsd);
          const barY = Math.min(incomeY, zeroY);
          const barHeight = Math.max(Math.abs(zeroY - incomeY), 4);
          const shortLabel = row.label.split(" - ")[0] ?? row.label;

          return (
            <g key={row.periodKey}>
              <rect
                className="fill-primary/70"
                height={barHeight}
                rx="8"
                width={barWidth}
                x={x - barWidth / 2}
                y={barY}
              />
              <text
                className="fill-muted-foreground text-[11px]"
                textAnchor="middle"
                x={x}
                y={chartHeight - 22}
              >
                {shortLabel.replace("Semana ", "")}
              </text>
            </g>
          );
        })}
        <path
          className="fill-none stroke-emerald-600"
          d={buildLinePath(linePoints)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {linePoints.map((point) => (
          <circle
            className="fill-emerald-600 stroke-card"
            cx={point.x}
            cy={point.y}
            key={point.periodKey}
            r="5"
            strokeWidth="3"
          />
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-primary/70" />
          Ingreso
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-emerald-600" />
          Neto
        </span>
      </div>
    </div>
  );
}

function DetailTable({ rows }: { rows: HistorySummaryRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        No hay movimientos suficientes para construir este historial con los filtros
        actuales.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/60 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Periodo</th>
            <th className="px-4 py-3">Registros</th>
            <th className="px-4 py-3">Buses</th>
            <th className="px-4 py-3">Cerrados</th>
            <th className="px-4 py-3">Borradores</th>
            <th className="px-4 py-3">Dif. abiertas</th>
            <th className="px-4 py-3">Ingreso USD</th>
            <th className="px-4 py-3">Gastos</th>
            <th className="px-4 py-3">Neto</th>
            <th className="px-4 py-3">Diferencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white/70">
          {rows.map((row) => (
            <tr key={row.periodKey}>
              <td className="px-4 py-3 font-medium">{row.label}</td>
              <td className="px-4 py-3">{row.totalRecords}</td>
              <td className="px-4 py-3">{row.busCount}</td>
              <td className="px-4 py-3">{row.closedRecords}</td>
              <td className="px-4 py-3">{row.draftRecords}</td>
              <td className="px-4 py-3">{row.openDifferences}</td>
              <td className="px-4 py-3">{formatCurrency(row.totalIncomeUsd)}</td>
              <td className="px-4 py-3">{formatCurrency(row.totalExpenses)}</td>
              <td className="px-4 py-3">{formatCurrency(row.totalCalculatedNet)}</td>
              <td
                className={cn(
                  "px-4 py-3 font-semibold",
                  Math.abs(row.totalDifference) >= 0.01
                    ? "text-destructive"
                    : "text-emerald-700",
                )}
              >
                {formatCurrency(row.totalDifference)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinancialHistoryPanel({
  dailyHref,
  monthlyRows,
  weeklyRows,
}: FinancialHistoryPanelProps) {
  const [mode, setMode] = useState<HistoryMode>("week");
  const rows = mode === "week" ? weeklyRows : monthlyRows;
  const totals = useMemo(() => summarizeRows(rows), [rows]);
  const aggregateStatus = getAggregateStatus(rows);
  const sectionTitle = mode === "week" ? "Semanas recientes" : "Meses recientes";
  const detailTitle = mode === "week" ? "Semanal" : "Mensual";
  const hasPending = totals.openDifferences > 0 || totals.draftRecords > 0;

  return (
    <Card>
      <CardHeader className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Historial financiero</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Revisa el rendimiento operativo por semana o por mes.
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-full border border-border bg-muted/60 p-1">
            {(["week", "month"] as const).map((option) => (
              <button
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                  mode === option
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
                key={option}
                onClick={() => setMode(option)}
                type="button"
              >
                {option === "week" ? "Semanal" : "Mensual"}
              </button>
            ))}
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              helper: "Total del periodo",
              label: "Ingreso",
              value: formatCurrency(totals.totalIncomeUsd),
            },
            {
              helper: "Gasoil, trabajadores y otros",
              label: "Gastos",
              value: formatCurrency(totals.totalExpenses),
            },
            {
              helper: "Ingreso menos gastos",
              label: "Neto",
              value: formatCurrency(totals.totalCalculatedNet),
            },
            {
              helper: aggregateStatus.helper,
              label: "Estado",
              tone: aggregateStatus.tone,
              value: aggregateStatus.value,
            },
          ].map((item) => (
            <div
              className="rounded-[24px] border border-border bg-white/70 p-4"
              key={item.label}
            >
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p
                className={cn(
                  "mt-2 text-2xl font-semibold text-foreground",
                  item.tone === "success" ? "text-emerald-700" : null,
                  item.tone === "warning" ? "text-amber-700" : null,
                  item.tone === "danger" ? "text-destructive" : null,
                )}
              >
                {item.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
            </div>
          ))}
        </section>
      </CardHeader>

      <CardContent className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Tendencia financiera</h3>
            </div>
            <TrendChart rows={rows} />
          </div>

          <div className="rounded-[24px] border border-border bg-white/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Salud operativa</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Estado general del rango visible.
                </p>
              </div>
              {aggregateStatus.tone === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              ) : aggregateStatus.tone === "danger" ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Activity className="h-5 w-5 text-amber-700" />
              )}
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Cerrados</span>
                <strong>{totals.closedRecords}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Borradores</span>
                <strong>{totals.draftRecords}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Diferencias abiertas</span>
                <strong>{totals.openDifferences}</strong>
              </div>
            </div>

            <div
              className={cn(
                "mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold",
                statusToneClasses[aggregateStatus.tone],
              )}
            >
              {aggregateStatus.label}
            </div>

            {hasPending ? (
              <Link
                className={buttonVariants({
                  className: "mt-4 w-full",
                  variant: "secondary",
                })}
                href={dailyHref}
              >
                Ver pendientes
              </Link>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{sectionTitle}</h3>
          {rows.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
              Sin registros cargados para este periodo.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {rows.slice(0, 6).map((row) => {
                const status = getPeriodStatus(row);

                return (
                  <article
                    className="rounded-[24px] border border-border bg-white/70 p-5"
                    key={row.periodKey}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {mode === "week" ? `Semana ${row.label}` : row.label}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {row.totalRecords === 0
                            ? "Sin registros cargados para este periodo."
                            : `${row.totalRecords} registros visibles`}
                        </p>
                      </div>
                      <Badge
                        className={cn("w-fit border", statusToneClasses[status.tone])}
                        variant="muted"
                      >
                        {status.label}
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Ingreso</p>
                        <p className="font-semibold">
                          {formatCurrency(row.totalIncomeUsd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gastos</p>
                        <p className="font-semibold">{formatCurrency(row.totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Neto</p>
                        <p className="font-semibold">
                          {formatCurrency(row.totalCalculatedNet)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                      Registros: {row.totalRecords} - Buses: {row.busCount} - Cerrados:{" "}
                      {row.closedRecords} - Borradores: {row.draftRecords}
                    </p>
                    <p className="hidden">
                      Registros: {row.totalRecords} · Buses: {row.busCount} · Cerrados:{" "}
                      {row.closedRecords} · Borradores: {row.draftRecords}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Diferencias abiertas: {row.openDifferences}
                    </p>

                    <details className="mt-4 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
                      <summary className="cursor-pointer font-semibold text-primary">
                        Detalle
                      </summary>
                      <div className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
                        <span>Diferencia: {formatCurrency(row.totalDifference)}</span>
                        <span>{status.helper}</span>
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <details className="rounded-[24px] border border-border bg-muted/30 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-primary">
            Ver tabla detallada ({detailTitle})
          </summary>
          <div className="mt-4">
            <DetailTable rows={rows} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
