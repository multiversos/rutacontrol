"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bus,
  Ellipsis,
  Home,
  SquarePen,
  TriangleAlert,
} from "lucide-react";

import type {
  MobileSection,
  MobileSectionIconId,
} from "@/lib/mobile-navigation";
import { cn } from "@/lib/utils";

type MobileTabBarProps = {
  items: MobileSection[];
};

const iconMap = {
  alerts: TriangleAlert,
  buses: Bus,
  home: Home,
  more: Ellipsis,
  register: SquarePen,
} satisfies Record<MobileSectionIconId, typeof Home>;

export function MobileTabBar({ items }: MobileTabBarProps) {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-[calc(1rem+var(--safe-left))] pb-[calc(var(--safe-bottom)+0.85rem)] pr-[calc(1rem+var(--safe-right))] transition-all duration-200"
      data-mobile-tabbar="true"
    >
      <nav className="mx-auto grid max-w-[480px] grid-cols-5 gap-1 rounded-[28px] border border-slate-200/80 bg-white/92 p-2 shadow-[0_20px_48px_rgba(15,23,42,0.14)] backdrop-blur">
        {items.map((item) => {
          const Icon = iconMap[item.iconId];
          const isActive =
            pathname === item.href ||
            (item.href !== "/mobile" && pathname.startsWith(`${item.href}/`));

          if (item.disabled) {
            return (
              <div
                key={item.id}
                className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-2 py-3 text-[11px] font-medium text-slate-400"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-2 py-3 text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
              )}
              href={item.href}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
