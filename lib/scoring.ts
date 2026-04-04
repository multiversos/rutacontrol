const SCORE_MAX = 100;
const ATYPICAL_END_HOUR = 23;
const ATYPICAL_START_HOUR = 5;

export const CONFIDENCE_SCORE_FORMULA =
  "Score base 100 - penalizacion por correcciones - penalizacion por diferencias - penalizacion por horarios atipicos.";

export type ConfidenceRecordInput = {
  closedAt: string | null;
  createdAt: string;
  difference: number;
  userId: string;
};

export type ConfidenceAuditInput = {
  action: "close" | "create" | "delete" | "update";
  createdAt: string;
  userId: string | null;
};

export type ConfidenceProfileInput = {
  id: string;
  name: string;
  role: "admin" | "registrador";
};

export type RegistrarConfidenceScore = {
  atypicalTimingCount: number;
  band: "Alta" | "Baja" | "Media";
  correctionCount: number;
  correctionPenalty: number;
  correctionRate: number;
  differencePenalty: number;
  formula: string;
  helper: string;
  nonZeroDifferenceCount: number;
  score: number;
  timingPenalty: number;
  totalDifferenceUsd: number;
  totalRecords: number;
  userId: string;
  userName: string;
};

function round(value: number) {
  return Number.parseFloat(value.toFixed(2));
}

function getCaracasHour(value: string) {
  const hour = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Caracas",
  }).format(new Date(value));

  return Number.parseInt(hour, 10);
}

function getBand(score: number): RegistrarConfidenceScore["band"] {
  if (score >= 85) {
    return "Alta";
  }

  if (score >= 70) {
    return "Media";
  }

  return "Baja";
}

export function buildRegistrarConfidenceScores(options: {
  auditEntries: ConfidenceAuditInput[];
  profiles: ConfidenceProfileInput[];
  records: ConfidenceRecordInput[];
}) {
  const recordsByUser = new Map<string, ConfidenceRecordInput[]>();
  const correctionsByUser = new Map<string, number>();

  options.records.forEach((record) => {
    const current = recordsByUser.get(record.userId);

    if (current) {
      current.push(record);
      return;
    }

    recordsByUser.set(record.userId, [record]);
  });

  options.auditEntries
    .filter((entry) => entry.action === "update" && entry.userId)
    .forEach((entry) => {
      correctionsByUser.set(
        entry.userId!,
        (correctionsByUser.get(entry.userId!) ?? 0) + 1,
      );
    });

  return options.profiles
    .filter((profile) => profile.role === "registrador")
    .map((profile) => {
      const records = recordsByUser.get(profile.id) ?? [];
      const totalRecords = records.length;
      const correctionCount = correctionsByUser.get(profile.id) ?? 0;
      const correctionRate = totalRecords === 0 ? 0 : correctionCount / totalRecords;
      const totalDifferenceUsd = round(
        records.reduce((total, record) => total + Math.abs(record.difference), 0),
      );
      const nonZeroDifferenceCount = records.filter(
        (record) => Math.abs(record.difference) >= 0.01,
      ).length;
      const atypicalTimingCount = records.filter((record) => {
        const referenceDate = record.closedAt ?? record.createdAt;
        const hour = getCaracasHour(referenceDate);
        return hour < ATYPICAL_START_HOUR || hour > ATYPICAL_END_HOUR;
      }).length;
      const atypicalRate = totalRecords === 0 ? 0 : atypicalTimingCount / totalRecords;

      const correctionPenalty = round(Math.min(25, correctionRate * 25));
      const differencePenalty = round(
        Math.min(
          45,
          Math.min(20, nonZeroDifferenceCount * 3) +
            Math.min(25, totalDifferenceUsd * 1.2),
        ),
      );
      const timingPenalty = round(Math.min(20, atypicalRate * 20));
      const score = Math.max(
        0,
        Math.round(
          SCORE_MAX - correctionPenalty - differencePenalty - timingPenalty,
        ),
      );

      return {
        atypicalTimingCount,
        band: getBand(score),
        correctionCount,
        correctionPenalty,
        correctionRate: round(correctionRate),
        differencePenalty,
        formula: CONFIDENCE_SCORE_FORMULA,
        helper: `Correcciones ${correctionCount}, diferencias ${totalDifferenceUsd.toFixed(
          2,
        )} USD y ${atypicalTimingCount} horarios atipicos.`,
        nonZeroDifferenceCount,
        score,
        timingPenalty,
        totalDifferenceUsd,
        totalRecords,
        userId: profile.id,
        userName: profile.name,
      } satisfies RegistrarConfidenceScore;
    })
    .filter((entry) => entry.totalRecords > 0)
    .sort((left, right) => right.score - left.score);
}
