"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BusFront,
  CalendarDays,
  LayoutDashboard,
  MapPinned,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarIconKey = "dashboard" | "route" | "bus" | "calendar";

type NavItem = {
  href: string;
  icon: SidebarIconKey;
  label: string;
};

type SidebarNavProps = {
  items: NavItem[];
};

const iconMap = {
  bus: BusFront,
  calendar: CalendarDays,
  dashboard: LayoutDashboard,
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
