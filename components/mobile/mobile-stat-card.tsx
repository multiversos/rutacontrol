import { cn } from "@/lib/utils";

type MobileStatCardProps = {
  className?: string;
  helper?: string;
  label: string;
  tone?: "default" | "danger" | "success" | "warning";
  value: string;
};

const toneClassMap = {
  default: "border-slate-200/80 bg-slate-50/80",
  danger: "border-rose-200 bg-rose-50/80",
  success: "border-emerald-200 bg-emerald-50/80",
  warning: "border-amber-200 bg-amber-50/80",
} as const;

export function MobileStatCard({
  className,
  helper,
  label,
  tone = "default",
  value,
}: MobileStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border p-4",
        toneClassMap[tone],
        className,
      )}
    >
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {helper ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}
