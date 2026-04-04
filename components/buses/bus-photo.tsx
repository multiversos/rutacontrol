import Image from "next/image";

import { cn } from "@/lib/utils";

type BusPhotoProps = {
  className?: string;
  code: string;
  photoUrl?: string | null;
  size?: "lg" | "md" | "sm";
};

const sizeClassMap = {
  lg: "h-28 w-28 rounded-[28px]",
  md: "h-20 w-20 rounded-[24px]",
  sm: "h-12 w-12 rounded-[18px]",
} as const;

const textSizeMap = {
  lg: "text-xl",
  md: "text-base",
  sm: "text-xs",
} as const;

function getBusInitials(code: string) {
  return code
    .split(/[^A-Z0-9]+/i)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function BusPhoto({
  className,
  code,
  photoUrl,
  size = "md",
}: BusPhotoProps) {
  const sizeClasses = sizeClassMap[size];

  if (photoUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden border border-border/70 bg-muted/40 shadow-soft",
          sizeClasses,
          className,
        )}
      >
        <Image
          alt={`Foto del bus ${code}`}
          className="object-cover"
          fill
          sizes={size === "sm" ? "48px" : size === "md" ? "80px" : "112px"}
          src={photoUrl}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center border border-border/70 bg-gradient-to-br from-primary/12 via-white to-muted text-primary shadow-soft",
        sizeClasses,
        className,
      )}
    >
      <span className={cn("font-semibold tracking-[0.16em]", textSizeMap[size])}>
        {getBusInitials(code)}
      </span>
    </div>
  );
}
