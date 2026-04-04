"use client";

import type { ComponentType } from "react";
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

type NavSection = {
  items: NavItem[];
  label: string;
};

type SidebarNavProps = {
  sections: NavSection[];
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
} as const satisfies Record<SidebarIconKey, ComponentType<{ className?: string }>>;

export function SidebarNav({ sections }: SidebarNavProps) {
  const pathname = usePathname();
  const items = sections.flatMap((section) => section.items);
  const hasExactMatch = items.some((item) => item.href === pathname);

  return (
    <nav className="space-y-5">
      {sections.map((section) => (
        <div key={section.label} className="space-y-2">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
            {section.label}
          </p>

          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = iconMap[item.icon];
              const active = hasExactMatch
                ? pathname === item.href
                : pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm font-medium transition-all duration-200",
                    active
                      ? "border-primary/18 bg-primary text-primary-foreground shadow-soft"
                      : "border-transparent bg-white/35 text-muted-foreground hover:-translate-y-0.5 hover:border-border/80 hover:bg-white/75 hover:text-foreground",
                  )}
                  href={item.href}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
                      active
                        ? "bg-white/14 text-primary-foreground"
                        : "bg-muted/70 text-foreground group-hover:bg-secondary/70",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
