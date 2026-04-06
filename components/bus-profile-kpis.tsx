import { KpiCards } from "@/components/kpi-cards";
import type { BusProfileKpi } from "@/lib/bus-profile";

type BusProfileKpisProps = {
  items: BusProfileKpi[];
};

export function BusProfileKpis({ items }: BusProfileKpisProps) {
  return (
    <KpiCards
      items={items.map((item) => ({
        ...item,
        helper: item.helper.replaceAll("Â·", "-").replaceAll("·", "-"),
      }))}
    />
  );
}
