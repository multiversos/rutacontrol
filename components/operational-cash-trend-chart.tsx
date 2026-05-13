import { formatCurrency, formatDateLabel } from "@/lib/formatters";
import type { OperationalCashTrendPoint } from "@/lib/operational-cash";

type OperationalCashTrendChartProps = {
  points: OperationalCashTrendPoint[];
};

export function OperationalCashTrendChart({ points }: OperationalCashTrendChartProps) {
  if (points.length < 2) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        A medida que registres más movimientos, la evolución será más útil.
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const padding = 28;
  const balances = points.map((point) => point.balanceUsd);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const range = Math.max(1, maxBalance - minBalance);
  const linePoints = points
    .map((point, index) => {
      const x =
        padding +
        (index / Math.max(1, points.length - 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((point.balanceUsd - minBalance) / range) * (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");
  const firstPoint = points[0] as OperationalCashTrendPoint;
  const lastPoint = points[points.length - 1] as OperationalCashTrendPoint;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-border bg-white/70">
        <svg
          aria-label="Evolución del saldo de Caja operativa"
          className="h-auto w-full"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <line
            stroke="hsl(var(--border))"
            strokeDasharray="5 6"
            x1={padding}
            x2={width - padding}
            y1={height - padding}
            y2={height - padding}
          />
          <line
            stroke="hsl(var(--border))"
            strokeDasharray="5 6"
            x1={padding}
            x2={width - padding}
            y1={padding}
            y2={padding}
          />
          <polyline
            fill="none"
            points={linePoints}
            stroke="hsl(var(--primary))"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          {points.map((point, index) => {
            const x =
              padding +
              (index / Math.max(1, points.length - 1)) * (width - padding * 2);
            const y =
              height -
              padding -
              ((point.balanceUsd - minBalance) / range) * (height - padding * 2);

            return (
              <circle
                key={point.date}
                cx={x}
                cy={y}
                fill="hsl(var(--primary))"
                r={index === points.length - 1 ? 5 : 3}
              />
            );
          })}
        </svg>
      </div>

      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <p>Desde {formatDateLabel(firstPoint.date)}</p>
        <p>Hasta {formatDateLabel(lastPoint.date)}</p>
        <p>Saldo final {formatCurrency(lastPoint.balanceUsd)}</p>
      </div>
    </div>
  );
}
