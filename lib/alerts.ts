import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { getBusinessTodayDate, shiftDateString } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

type AlertLookup = Pick<
  Tables<"alerts">,
  | "alert_type"
  | "bus_id"
  | "created_at"
  | "daily_record_id"
  | "id"
  | "message"
  | "profile_id"
  | "read"
  | "read_at"
  | "severity"
>;
type BusLookup = Pick<Tables<"buses">, "code" | "id">;
type ProfileLookup = Pick<Tables<"profiles">, "id" | "name">;

export type AlertFilters = {
  busId: string | undefined;
  dateFrom: string | undefined;
  dateTo: string | undefined;
  readState: "all" | "read" | "unread";
  severity: "all" | Tables<"alerts">["severity"];
};

export type AlertListItem = {
  alertType: Tables<"alerts">["alert_type"];
  busCode: string | undefined;
  createdAt: string;
  dailyRecordId: string | null;
  id: string;
  message: string;
  profileName: string | undefined;
  read: boolean;
  readAt: string | null;
  severity: Tables<"alerts">["severity"];
};

function normalizeAlerts(
  alerts: AlertLookup[],
  buses: BusLookup[],
  profiles: ProfileLookup[],
) {
  const busMap = new Map(buses.map((bus) => [bus.id, bus.code]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.name]));

  return alerts.map((alert) => ({
    alertType: alert.alert_type,
    busCode: alert.bus_id ? busMap.get(alert.bus_id) ?? alert.bus_id : undefined,
    createdAt: alert.created_at,
    dailyRecordId: alert.daily_record_id,
    id: alert.id,
    message: alert.message,
    profileName: alert.profile_id
      ? profileMap.get(alert.profile_id) ?? undefined
      : undefined,
    read: alert.read,
    readAt: alert.read_at,
    severity: alert.severity,
  })) satisfies AlertListItem[];
}

export async function reconcileMissingClosureAlerts(recordDate?: string) {
  const supabase = await createClient();
  const targetDate = recordDate ?? getBusinessTodayDate();
  const { error } = await supabase.rpc("reconcile_missing_closure_alerts", {
    _record_date: targetDate,
  });

  if (
    error &&
    error.code !== "PGRST202" &&
    error.code !== "42883" &&
    error.code !== "42P01"
  ) {
    throw error;
  }
}

export async function getAlertsData(filters: Partial<AlertFilters>) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, -13);
  const dateTo = filters.dateTo ?? today;
  const severity = filters.severity ?? "all";
  const readState = filters.readState ?? "all";
  const busId = filters.busId;

  await reconcileMissingClosureAlerts(dateTo);

  let alertsQuery = supabase
    .from("alerts")
    .select(
      "id, alert_type, severity, message, read, read_at, created_at, daily_record_id, bus_id, profile_id",
    )
    .gte("created_at", `${dateFrom}T00:00:00Z`)
    .lte("created_at", `${dateTo}T23:59:59.999Z`)
    .order("created_at", { ascending: false });

  if (severity !== "all") {
    alertsQuery = alertsQuery.eq("severity", severity);
  }

  if (readState === "read") {
    alertsQuery = alertsQuery.eq("read", true);
  }

  if (readState === "unread") {
    alertsQuery = alertsQuery.eq("read", false);
  }

  if (busId) {
    alertsQuery = alertsQuery.eq("bus_id", busId);
  }

  const [{ data: alerts, error: alertsError }, { data: buses }, { data: profiles }] =
    await Promise.all([
      alertsQuery,
      supabase.from("buses").select("id, code").order("code"),
      supabase.from("profiles").select("id, name"),
    ]);

  const migrationReady =
    !alertsError ||
    !["42P01", "PGRST205"].includes(alertsError.code ?? "");

  if (alertsError && migrationReady) {
    throw alertsError;
  }

  return {
    alerts: normalizeAlerts(alerts ?? [], buses ?? [], profiles ?? []),
    busOptions: (buses ?? []).map((bus) => ({
      code: bus.code,
      id: bus.id,
    })),
    filters: {
      busId,
      dateFrom,
      dateTo,
      readState,
      severity,
    } satisfies AlertFilters,
    migrationReady,
  };
}
