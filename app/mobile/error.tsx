"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { buttonVariants } from "@/components/ui/button";

type MobileErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function MobileErrorPage({
  error,
  reset,
}: MobileErrorPageProps) {
  useEffect(() => {
    console.error("Error en la experiencia movil.", error);
  }, [error]);

  return (
    <MobileEmptyState
      action={
        <button
          className={buttonVariants({
            className: "w-full",
          })}
          onClick={() => reset()}
          type="button"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reintentar
        </button>
      }
      description="No pudimos cargar esta pantalla movil en este momento. Puedes reintentar sin salir de la shell."
      icon={TriangleAlert}
      title="Error temporal"
    />
  );
}
