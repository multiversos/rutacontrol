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
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]"
        >
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
              KPI
            </p>
            <CardTitle className="text-base">{item.label}</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">{item.helper}</p>
          </CardHeader>
          <CardContent
            className={cn(
              "pt-0 text-3xl font-semibold sm:text-[2rem]",
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
