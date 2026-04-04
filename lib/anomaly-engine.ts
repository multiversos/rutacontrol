export const ROUTE_ANOMALY_MIN_OBSERVATIONS = 5;
export const ROUTE_ANOMALY_STDDEV_THRESHOLD = 1.5;

export type RouteBaselineInput = {
  incomeUsd: number;
  routeId: string;
  routeLabel: string;
};

export type RouteHistoricalBaseline = {
  averageIncomeUsd: number;
  observationCount: number;
  routeId: string;
  routeLabel: string;
  standardDeviationUsd: number;
  thresholdUsd: number;
};

export type RouteAnomalyInput = RouteBaselineInput & {
  busCode: string;
  difference: number;
  id: string;
  recordDate: string;
  userName: string | undefined;
};

export type RouteAnomalyResult = {
  baseline: RouteHistoricalBaseline;
  busCode: string;
  difference: number;
  distanceFromAverageUsd: number;
  hasEnoughHistory: boolean;
  id: string;
  incomeUsd: number;
  isAnomaly: boolean;
  reason: string;
  recordDate: string;
  routeId: string;
  routeLabel: string;
  userName: string | undefined;
  zScore: number | null;
};

function round(value: number) {
  return Number.parseFloat(value.toFixed(2));
}

function buildBaseline(
  routeId: string,
  routeLabel: string,
  values: number[],
): RouteHistoricalBaseline {
  const observationCount = values.length;
  const averageIncomeUsd =
    observationCount === 0
      ? 0
      : values.reduce((total, value) => total + value, 0) / observationCount;
  const variance =
    observationCount === 0
      ? 0
      : values.reduce((total, value) => {
          const delta = value - averageIncomeUsd;
          return total + delta * delta;
        }, 0) / observationCount;
  const standardDeviationUsd = Math.sqrt(Math.max(variance, 0));

  return {
    averageIncomeUsd: round(averageIncomeUsd),
    observationCount,
    routeId,
    routeLabel,
    standardDeviationUsd: round(standardDeviationUsd),
    thresholdUsd: round(standardDeviationUsd * ROUTE_ANOMALY_STDDEV_THRESHOLD),
  };
}

export function buildRouteHistoricalBaselines(records: RouteBaselineInput[]) {
  const valuesByRoute = new Map<
    string,
    {
      routeLabel: string;
      values: number[];
    }
  >();

  records.forEach((record) => {
    const current = valuesByRoute.get(record.routeId);

    if (current) {
      current.values.push(record.incomeUsd);
      return;
    }

    valuesByRoute.set(record.routeId, {
      routeLabel: record.routeLabel,
      values: [record.incomeUsd],
    });
  });

  return Array.from(valuesByRoute.entries())
    .map(([routeId, entry]) => buildBaseline(routeId, entry.routeLabel, entry.values))
    .sort((left, right) => left.routeLabel.localeCompare(right.routeLabel));
}

export function detectRouteIncomeAnomalies(options: {
  historyRecords: RouteBaselineInput[];
  records: RouteAnomalyInput[];
}) {
  const baselines = buildRouteHistoricalBaselines(options.historyRecords);
  const baselineMap = new Map(baselines.map((baseline) => [baseline.routeId, baseline]));

  const results = options.records.map((record) => {
    const baseline =
      baselineMap.get(record.routeId) ??
      buildBaseline(record.routeId, record.routeLabel, [record.incomeUsd]);
    const hasEnoughHistory =
      baseline.observationCount >= ROUTE_ANOMALY_MIN_OBSERVATIONS &&
      baseline.standardDeviationUsd >= 0.01;
    const distanceFromAverageUsd = round(
      Math.abs(record.incomeUsd - baseline.averageIncomeUsd),
    );
    const zScore =
      baseline.standardDeviationUsd >= 0.01
        ? distanceFromAverageUsd / baseline.standardDeviationUsd
        : null;
    const isAnomaly =
      hasEnoughHistory &&
      zScore !== null &&
      zScore > ROUTE_ANOMALY_STDDEV_THRESHOLD;

    const reason = !hasEnoughHistory
      ? `Historico insuficiente: se requieren ${ROUTE_ANOMALY_MIN_OBSERVATIONS} cierres validos antes de evaluar anomalias.`
      : isAnomaly
        ? `Ingreso fuera del rango historico (${ROUTE_ANOMALY_STDDEV_THRESHOLD} desviaciones estandar).`
        : "Ingreso dentro del rango esperado para la linea fija.";

    return {
      baseline,
      busCode: record.busCode,
      difference: record.difference,
      distanceFromAverageUsd,
      hasEnoughHistory,
      id: record.id,
      incomeUsd: round(record.incomeUsd),
      isAnomaly,
      reason,
      recordDate: record.recordDate,
      routeId: record.routeId,
      routeLabel: record.routeLabel,
      userName: record.userName,
      zScore: zScore === null ? null : Number.parseFloat(zScore.toFixed(2)),
    } satisfies RouteAnomalyResult;
  });

  return {
    baselines,
    results,
  };
}
