"use client";

import { useActionState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { deleteDailyRecordAction } from "@/app/dashboard/daily/actions";
import { initialFormState } from "@/lib/forms/action-state";

type DeleteDailyRecordButtonProps = {
  recordId: string;
};

export function DeleteDailyRecordButton({
  recordId,
}: DeleteDailyRecordButtonProps) {
  const [state, formAction, pending] = useActionState(
    deleteDailyRecordAction,
    initialFormState,
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${
    searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  }`;

  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-end gap-1"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Seguro que quieres eliminar este borrador? Esta accion no se puede deshacer.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="recordId" type="hidden" value={recordId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <button
        className="text-sm font-semibold text-destructive disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>
      {state.message && state.status === "error" ? (
        <span className="max-w-40 text-right text-xs text-destructive">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
