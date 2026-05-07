import { BusPhoto } from "@/components/buses/bus-photo";
import { cn } from "@/lib/utils";

type BusIdentityProps = {
  className?: string;
  code: string;
  photoUrl?: string | null;
  plate?: string | null;
  secondaryText?: string | null;
  size?: "md" | "sm";
  wrap?: boolean;
};

export function BusIdentity({
  className,
  code,
  photoUrl,
  plate,
  secondaryText,
  size = "sm",
  wrap = false,
}: BusIdentityProps) {
  const metaLine = [plate ? `Placa ${plate}` : null, secondaryText]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BusPhoto code={code} photoUrl={photoUrl ?? null} size={size} />
      <div className="min-w-0 space-y-1">
        <p
          className={cn(
            "font-semibold text-foreground",
            wrap ? "break-words leading-5" : "truncate",
          )}
        >
          {code}
        </p>
        {metaLine ? (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              wrap ? "break-words whitespace-normal leading-5" : "truncate",
            )}
          >
            {metaLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}
