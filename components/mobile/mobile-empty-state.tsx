import type { LucideIcon } from "lucide-react";

type MobileEmptyStateProps = {
  action?: React.ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function MobileEmptyState({
  action,
  description,
  icon: Icon,
  title,
}: MobileEmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
