import { Badge } from "@/components/ui/badge";
import type { MaintenanceCycleItem } from "@/lib/maintenance";
import { MAINTENANCE_STATUS_LABELS } from "@/lib/maintenance-config";

type MaintenanceStatusBadgeProps = {
  status: MaintenanceCycleItem["status"];
};

export function MaintenanceStatusBadge({
  status,
}: MaintenanceStatusBadgeProps) {
  if (status === "overdue") {
    return (
      <Badge className="bg-destructive/10 text-destructive" variant="warning">
        {MAINTENANCE_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge variant={status === "due_soon" ? "warning" : "success"}>
      {MAINTENANCE_STATUS_LABELS[status]}
    </Badge>
  );
}
