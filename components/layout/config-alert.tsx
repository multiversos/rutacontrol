import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type ConfigAlertProps = {
  message: string;
  title?: string;
};

export function ConfigAlert({
  message,
  title = "Configuracion pendiente",
}: ConfigAlertProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/90">
      <CardContent className="flex gap-4 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-900">{title}</p>
          <p className="text-sm leading-6 text-amber-800">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
