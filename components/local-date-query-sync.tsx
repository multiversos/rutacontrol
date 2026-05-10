"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getLocalDateInputValue, isDateInputValue } from "@/lib/dates";

type LocalDateQuerySyncProps = {
  currentDate: string;
  paramName?: string;
};

export function LocalDateQuerySync({
  currentDate,
  paramName = "date",
}: LocalDateQuerySyncProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const existingDate = searchParams.get(paramName) ?? undefined;

    if (isDateInputValue(existingDate)) {
      return;
    }

    const localDate = getLocalDateInputValue();

    if (localDate === currentDate) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set(paramName, localDate);
    router.replace(`${pathname}?${nextParams.toString()}`);
  }, [currentDate, paramName, pathname, router, searchParams]);

  return null;
}
