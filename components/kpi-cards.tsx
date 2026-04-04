import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiCardItem = {
  helper: string;
  label: string;
  tone?: "default" | "danger" | "success" | "warning";
  value: string;
};

type KpiCardsProps = {
  items: KpiCardItem[];
};

const toneClassMap = {
  danger: "text-destructive",
  default: "text-foreground",
  success: "text-emerald-700",
  warning: "text-amber-700",
} as const;

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle className="text-base">{item.label}</CardTitle>
            <p className="text-sm text-muted-foreground">{item.helper}</p>
          </CardHeader>
          <CardContent
            className={cn(
              "pt-0 text-3xl font-semibold",
              toneClassMap[item.tone ?? "default"],
            )}
          >
            {item.value}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
