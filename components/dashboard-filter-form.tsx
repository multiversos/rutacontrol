"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getLocalDateInputValue } from "@/lib/dates";
import type { BusOption } from "@/lib/dashboard";

type DashboardFilterFormProps = {
  busId?: string | undefined;
  busOptions: BusOption[];
  hasExplicitDate: boolean;
  selectedDate: string;
};

export function DashboardFilterForm({
  busId,
  busOptions,
  hasExplicitDate,
  selectedDate,
}: DashboardFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasExplicitDate) {
      return;
    }

    const localDate = getLocalDateInputValue();

    if (dateInputRef.current) {
      dateInputRef.current.value = localDate;
    }

    if (localDate === selectedDate) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("date", localDate);
    router.replace(`${pathname}?${nextParams.toString()}`);
  }, [hasExplicitDate, pathname, router, searchParams, selectedDate]);

  return (
    <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="dashboard-date">
          Fecha operativa
        </label>
        <input
          className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
          defaultValue={hasExplicitDate ? selectedDate : ""}
          id="dashboard-date"
          name="date"
          ref={dateInputRef}
          type="date"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="dashboard-bus">
          Filtrar por bus
        </label>
        <select
          className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
          defaultValue={busId ?? ""}
          id="dashboard-bus"
          name="busId"
        >
          <option value="">Todos los buses</option>
          {busOptions.map((bus) => (
            <option key={bus.id} value={bus.id}>
              {bus.code}
            </option>
          ))}
        </select>
      </div>

      <button
        className="inline-flex h-11 items-center justify-center self-end rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
        type="submit"
      >
        Aplicar
      </button>

      <Link
        className="inline-flex h-11 items-center justify-center self-end rounded-full border border-border px-5 text-sm font-semibold"
        href="/dashboard"
      >
        Limpiar
      </Link>
    </form>
  );
}
