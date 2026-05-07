import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MobileListItemProps = {
  badge?: React.ReactNode;
  className?: string;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  meta?: string;
  title: string;
};

export function MobileListItem({
  badge,
  className,
  description,
  href,
  icon: Icon,
  meta,
  title,
}: MobileListItemProps) {
  const content = (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4",
        href && "transition-colors hover:border-slate-300 hover:bg-white",
        className,
      )}
    >
      <div className="flex min-w-0 gap-3">
        {Icon ? (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <p className="truncate font-semibold text-slate-900">{title}</p>
          {description ? (
            <p className="text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
          {meta ? (
            <p className="text-xs font-medium text-slate-500">{meta}</p>
          ) : null}
        </div>
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
