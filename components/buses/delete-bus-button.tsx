"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteBusAction } from "@/app/dashboard/buses/actions";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/forms/action-state";
import { cn } from "@/lib/utils";

type DeleteBusButtonProps = {
  blockers?: string[];
  busCode: string;
  busId: string;
  canDelete: boolean;
  className?: string;
  compact?: boolean;
};

export function DeleteBusButton({
  blockers = [],
  busCode,
  busId,
  canDelete,
  className,
  compact = false,
}: DeleteBusButtonProps) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(initialFormState);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsOpen(false);
      router.push("/dashboard/buses");
      router.refresh();
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, state.status]);

  function openDialog() {
    setState(initialFormState);
    setIsOpen(true);
  }

  function closeDialog() {
    if (isPending) {
      return;
    }

    setIsOpen(false);
  }

  function handleConfirmDelete() {
    const formData = new FormData();
    formData.set("busId", busId);

    startTransition(() => {
      void deleteBusAction(initialFormState, formData)
        .then((result) => {
          setState(result);
        })
        .catch(() => {
          setState({
            message: "No pudimos eliminar el bus en este momento.",
            status: "error",
          });
        });
    });
  }

  return (
    <>
      <button
        className={cn(
          "text-sm font-semibold text-destructive transition-colors hover:text-destructive/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:ring-offset-2",
          className,
        )}
        onClick={openDialog}
        type="button"
      >
        Eliminar
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
          onClick={closeDialog}
        >
          <div
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className={cn(
              "w-full rounded-[28px] border border-border/80 bg-white p-6 shadow-soft",
              compact ? "max-w-lg" : "max-w-xl",
            )}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="space-y-3">
              <h3 className="text-xl font-semibold tracking-tight" id={titleId}>
                {canDelete
                  ? `Eliminar el bus ${busCode}`
                  : `No puedes eliminar el bus ${busCode}`}
              </h3>
              <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p id={descriptionId}>
                  {canDelete
                    ? "Esta accion eliminara definitivamente la unidad y su foto administrativa. No podras recuperarla desde la app."
                    : "Esta unidad ya tiene historial asociado y no se puede borrar sin comprometer trazabilidad, reportes o auditoria."}
                </p>
                {!canDelete && blockers.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                ) : null}
                {!canDelete ? (
                  <p>
                    Si este bus ya no debe aparecer en la operacion diaria, cambiale
                    el estado a <strong>inactivo</strong> desde la edicion.
                  </p>
                ) : null}
              </div>
            </div>

            {state.message ? (
              <p
                className={cn(
                  "mt-5 rounded-2xl px-4 py-3 text-sm",
                  state.status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {state.message}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                onClick={closeDialog}
                ref={closeButtonRef}
                type="button"
                variant="outline"
              >
                {state.status === "success" ? "Cerrar" : "Cancelar"}
              </Button>
              {canDelete ? (
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isPending || state.status === "success"}
                  onClick={handleConfirmDelete}
                  type="button"
                >
                  {isPending ? "Eliminando..." : "Confirmar eliminacion"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
