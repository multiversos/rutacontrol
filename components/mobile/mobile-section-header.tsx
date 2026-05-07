import { cn } from "@/lib/utils";

type MobileSectionHeaderProps = {
  action?: React.ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  tone?: "default" | "inverse";
  title: string;
};

export function MobileSectionHeader({
  action,
  className,
  description,
  eyebrow,
  tone = "default",
  title,
}: MobileSectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1.5">
        {eyebrow ? (
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.22em]",
              tone === "inverse" ? "text-slate-200" : "text-slate-500",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h2
            className={cn(
              "text-lg font-semibold tracking-tight",
              tone === "inverse" ? "text-white" : "text-slate-950",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cn(
                "text-sm leading-6",
                tone === "inverse" ? "text-slate-200" : "text-slate-500",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
