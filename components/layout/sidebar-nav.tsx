"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BellRing,
  BusFront,
  CalendarDays,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  WalletCards,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarIconKey =
  | "alerts"
  | "audit"
  | "dashboard"
  | "intelligence"
  | "route"
  | "bus"
  | "calendar"
  | "debt"
  | "repair"
  | "reports";

type NavItem = {
  href: string;
  icon: SidebarIconKey;
  label: string;
};

type SidebarNavProps = {
  items: NavItem[];
};

const iconMap = {
  alerts: BellRing,
  audit: ShieldCheck,
  bus: BusFront,
  calendar: CalendarDays,
  debt: WalletCards,
  dashboard: LayoutDashboard,
  intelligence: Activity,
  repair: Wrench,
  reports: BarChart3,
  route: MapPinned,
} as const satisfies Record<SidebarIconKey, React.ComponentType<{ className?: string }>>;

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const hasExactMatch = items.some((item) => item.href === pathname);

  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const active = hasExactMatch
          ? pathname === item.href
          : pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            href={item.href}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
