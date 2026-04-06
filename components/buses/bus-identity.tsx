import { BusPhoto } from "@/components/buses/bus-photo";
import { cn } from "@/lib/utils";

type BusIdentityProps = {
  className?: string;
  code: string;
  photoUrl?: string | null;
  plate?: string | null;
  secondaryText?: string | null;
  size?: "md" | "sm";
};

export function BusIdentity({
  className,
  code,
  photoUrl,
  plate,
  secondaryText,
  size = "sm",
}: BusIdentityProps) {
  const metaLine = [plate ? `Placa ${plate}` : null, secondaryText]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BusPhoto code={code} photoUrl={photoUrl ?? null} size={size} />
      <div className="min-w-0 space-y-1">
        <p className="truncate font-semibold text-foreground">{code}</p>
        {metaLine ? (
          <p className="truncate text-xs text-muted-foreground">{metaLine}</p>
        ) : null}
      </div>
    </div>
  );
}
