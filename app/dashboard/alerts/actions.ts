"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const severityValues = new Set<Tables<"alerts">["severity"]>([
  "critical",
  "info",
  "warning",
]);

export async function markAlertReadAction(formData: FormData) {
  await requireRole("admin");
  const alertId = String(formData.get("alertId") ?? "").trim();

  if (!alertId) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("alerts")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("read", false);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
}

export async function markVisibleAlertsReadAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();
  const busId = String(formData.get("busId") ?? "").trim();
  const dateFrom = String(formData.get("dateFrom") ?? "").trim();
  const dateTo = String(formData.get("dateTo") ?? "").trim();
  const readState = String(formData.get("readState") ?? "all").trim();
  const severity = String(formData.get("severity") ?? "all").trim();
  const normalizedSeverity = severityValues.has(
    severity as Tables<"alerts">["severity"],
  )
    ? (severity as Tables<"alerts">["severity"])
    : null;

  let query = supabase
    .from("alerts")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("read", false);

  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00Z`);
  }

  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  if (busId) {
    query = query.eq("bus_id", busId);
  }

  if (normalizedSeverity) {
    query = query.eq("severity", normalizedSeverity);
  }

  if (readState === "read") {
    return;
  }

  await query;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
}
