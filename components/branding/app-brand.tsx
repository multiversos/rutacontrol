import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AppBrandProps = {
  className?: string;
  description?: string;
  href?: string;
  priority?: boolean;
  size?: "hero" | "sidebar";
};

const containerClassMap = {
  hero: "rounded-[32px] border border-border/80 bg-card/90 p-6 shadow-soft backdrop-blur sm:p-7 lg:p-8",
  sidebar:
    "rounded-[24px] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] px-4 py-5 shadow-soft",
} as const;

const logoSizeClassMap = {
  hero: "w-full max-w-[420px]",
  sidebar: "w-full max-w-[210px]",
} as const;

function AppBrandContent({
  className,
  description,
  priority = false,
  size = "sidebar",
}: Omit<AppBrandProps, "href">) {
  return (
    <div className={cn("space-y-4", containerClassMap[size], className)}>
      <div className={cn("relative", logoSizeClassMap[size])}>
        <Image
          alt="Logo de Colectivos La Rosita"
          className="h-auto w-full object-contain"
          height={1037}
          priority={priority}
          src="/branding/logo-colectivos-la-rosita.png"
          width={1515}
        />
      </div>

      {description ? (
        <p
          className={cn(
            "text-sm leading-6 text-muted-foreground",
            size === "sidebar" && "max-w-[30ch] text-[13px] leading-5",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function AppBrand({ href, ...props }: AppBrandProps) {
  if (!href) {
    return <AppBrandContent {...props} />;
  }

  return (
    <Link
      aria-label="Ir al inicio de RutaControl"
      className="block rounded-[32px] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
    >
      <AppBrandContent {...props} />
    </Link>
  );
}
