import type { ReactNode } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PageHeaderBadge = {
  label: string;
  variant?: BadgeProps["variant"];
};

type PageHeaderProps = {
  actions?: ReactNode;
  badges?: PageHeaderBadge[];
  className?: string;
  description: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  badges,
  className,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))]",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              {eyebrow}
            </p>
          ) : null}

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          {badges?.length ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={`${badge.label}-${badge.variant ?? "default"}`} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
