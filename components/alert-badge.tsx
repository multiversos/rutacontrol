import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/lib/supabase/database.types";

type AlertSeverity = Tables<"alerts">["severity"];
type AlertType = Tables<"alerts">["alert_type"];

const severityVariantMap: Record<AlertSeverity, "default" | "success" | "warning"> = {
  critical: "warning",
  info: "default",
  warning: "warning",
};

const severityLabelMap: Record<AlertSeverity, string> = {
  critical: "Critica",
  info: "Info",
  warning: "Advertencia",
};

const typeLabelMap: Record<AlertType, string> = {
  closure: "Cierre",
  difference: "Diferencia",
  login: "Login",
  missing: "Pendiente",
};

export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <Badge
      className={severity === "critical" ? "bg-destructive/10 text-destructive" : undefined}
      variant={severityVariantMap[severity]}
    >
      {severityLabelMap[severity]}
    </Badge>
  );
}

export function AlertTypeBadge({ type }: { type: AlertType }) {
  return <Badge variant="muted">{typeLabelMap[type]}</Badge>;
}

export function AlertReadBadge({ read }: { read: boolean }) {
  return <Badge variant={read ? "success" : "warning"}>{read ? "Leida" : "No leida"}</Badge>;
}
