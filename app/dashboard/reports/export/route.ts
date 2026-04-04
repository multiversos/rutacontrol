import { NextResponse } from "next/server";

import { buildReportCsv, getReportsData } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_SCOPES = new Set(["bus", "route", "weekly", "monthly"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");

  if (!scope || !ALLOWED_SCOPES.has(scope)) {
    return NextResponse.json(
      {
        error: "Scope de exportacion invalido.",
      },
      {
        status: 400,
      },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "No autenticado.",
      },
      {
        status: 401,
      },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.active || profile.role !== "admin") {
    return NextResponse.json(
      {
        error: "Acceso restringido al admin.",
      },
      {
        status: 403,
      },
    );
  }

  const data = await getReportsData({
    busId: url.searchParams.get("busId") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    routeId: url.searchParams.get("routeId") ?? undefined,
  });

  const csv = buildReportCsv({
    dateFrom: data.filters.dateFrom,
    dateTo: data.filters.dateTo,
    rows:
      scope === "bus"
        ? data.profitabilityByBus
        : scope === "route"
          ? data.profitabilityByRoute
          : scope === "weekly"
            ? data.weeklyClosures
            : data.monthlyClosures,
    scope: scope as "bus" | "monthly" | "route" | "weekly",
  });

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename=\"rutacontrol-${scope}-${data.filters.dateFrom}-${data.filters.dateTo}.csv\"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
    status: 200,
  });
}
