import { Badge } from "@/components/ui/badge";

type AnomalyBadgeProps = {
  hasEnoughHistory: boolean;
  isAnomaly: boolean;
  zScore: number | null;
};

export function AnomalyBadge({
  hasEnoughHistory,
  isAnomaly,
  zScore,
}: AnomalyBadgeProps) {
  if (!hasEnoughHistory) {
    return <Badge variant="muted">Historico insuficiente</Badge>;
  }

  if (isAnomaly) {
    return (
      <Badge variant="danger">
        Anomalia {zScore !== null ? `(z=${zScore.toFixed(2)})` : ""}
      </Badge>
    );
  }

  return (
    <Badge variant="success">
      Normal {zScore !== null ? `(z=${zScore.toFixed(2)})` : ""}
    </Badge>
  );
}
