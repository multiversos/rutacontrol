import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";

type MobileActionTileProps = {
  badge?: string;
  description: string;
  disabled?: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
};

export function MobileActionTile({
  badge,
  description,
  disabled = false,
  href,
  icon: Icon,
  label,
}: MobileActionTileProps) {
  const content = (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{label}</p>
            {badge ? (
              <p className="text-xs font-medium text-slate-500">{badge}</p>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>

      {disabled ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <LockKeyhole className="h-4 w-4" />
        </div>
      ) : (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Abrir
        </span>
      )}
    </>
  );

  const sharedClassName = cn(
    "flex items-start justify-between gap-4 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 transition-colors",
    disabled
      ? "cursor-not-allowed border-dashed text-slate-400"
      : "hover:border-slate-300 hover:bg-white",
  );

  if (disabled) {
    return (
      <div aria-disabled="true" className={sharedClassName}>
        {content}
      </div>
    );
  }

  return (
    <Link className={sharedClassName} href={href}>
      {content}
    </Link>
  );
}
