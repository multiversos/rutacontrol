import "server-only";

import { getAlertsData, type AlertListItem } from "@/lib/alerts";
import type { AppRole, DailyRecordStatus } from "@/lib/auth/types";
import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import {
  getAdminDashboardData,
  type DashboardKpiItem,
  type DashboardRecordSummary,
} from "@/lib/dashboard";
import { isDemoBus } from "@/lib/demo-data";
import { getBusinessTodayDate, shiftDateString } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

export type MobileRecentRecord = {
  busCode: string;
  difference: string;
  id: string;
  recordDate: string;
  status: DailyRecordStatus;
};

export type MobileHomeData =
  | {
      alertsReady: boolean;
      businessDate: string;
      kpis: DashboardKpiItem[];
      mode: "admin";
      pendingBuses: string[];
      recentAlerts: AlertListItem[];
      recentRecords: DashboardRecordSummary[];
      recentRecordCount: number;
      unreadAlertCount: number;
    }
  | {
      businessDate: string;
      closedTodayCount: number;
      draftTodayCount: number;
      mode: "registrador";
      openDifferenceCount: number;
      recentRecords: MobileRecentRecord[];
      todayRecordCount: number;
    };

export type MobileBusSnapshot = {
  buses: Array<{
    code: string;
    id: string;
    plate: string;
    status: "active" | "inactive" | "maintenance";
  }>;
  counts: Record<"active" | "inactive" | "maintenance", number>;
};

export type MobileAlertSnapshot = {
  alerts: AlertListItem[];
  severityCounts: Record<"critical" | "info" | "warning", number>;
  unreadCount: number;
};

export type MobileAlertsViewData = {
  alertsReady: boolean;
  businessDate: string;
  criticalUnread: AlertListItem[];
  filters: {
    busId: string | undefined;
    dateFrom: string | undefined;
    dateTo: string | undefined;
    readState: "all" | "read" | "unread";
    severity: "all" | "critical" | "info" | "warning";
  };
  infoCount: number;
  pendingAlerts: AlertListItem[];
  recentAlerts: AlertListItem[];
  totalCount: number;
  unreadCount: number;
  warningCount: number;
};

export type MobileRegisterRecentRecord = {
  busCode: string;
  busPhotoUrl: string | null;
  busPlate: string | null;
  difference: string;
  id: string;
  recordDate: string;
  status: DailyRecordStatus;
  updatedAt: string;
  userName?: string;
};

function toNumber(value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getMobileHomeData(options: {
  businessDate?: string | undefined;
  role: AppRole;
  userId: string;
}): Promise<MobileHomeData> {
  const businessDate = options.businessDate ?? getBusinessTodayDate();

  if (options.role === "admin") {
    const [dashboard, alerts] = await Promise.all([
      getAdminDashboardData({
        busId: undefined,
        date: businessDate,
      }),
      getAlertsData({
        busId: undefined,
        dateFrom: shiftDateString(businessDate, -6),
        dateTo: businessDate,
        readState: "unread",
        severity: "all",
      }),
    ]);

    return {
      alertsReady: alerts.migrationReady,
      businessDate,
      kpis: dashboard.kpis,
      mode: "admin",
      pendingBuses: dashboard.pendingBuses.slice(0, 4),
      recentAlerts: alerts.alerts.slice(0, 3),
      recentRecords: dashboard.records.slice(0, 3),
      recentRecordCount: dashboard.records.length,
      unreadAlertCount: alerts.alerts.length,
    };
  }

  const supabase = await createClient();
  const [{ data: todayRecords }, { data: recentRecords }] = await Promise.all([
    supabase
      .from("daily_records")
      .select("id, difference, record_date, status")
      .eq("user_id", options.userId)
      .eq("record_date", businessDate)
      .order("updated_at", { ascending: false }),
    supabase
      .from("daily_records")
      .select("id, bus_id, difference, record_date, status")
      .eq("user_id", options.userId)
      .order("record_date", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const busIds = Array.from(
    new Set((recentRecords ?? []).map((record) => record.bus_id).filter(Boolean)),
  );
  const { data: buses } =
    busIds.length > 0
      ? await supabase.from("buses").select("id, code").in("id", busIds)
      : { data: [] };

  const busMap = new Map((buses ?? []).map((bus) => [bus.id, bus.code]));

  return {
    businessDate,
    closedTodayCount: (todayRecords ?? []).filter(
      (record) => record.status === "closed",
    ).length,
    draftTodayCount: (todayRecords ?? []).filter(
      (record) => record.status === "draft",
    ).length,
    mode: "registrador",
    openDifferenceCount: (todayRecords ?? []).filter(
      (record) => Math.abs(toNumber(record.difference)) >= 0.01,
    ).length,
    recentRecords: (recentRecords ?? []).map((record) => ({
      busCode: busMap.get(record.bus_id) ?? "Bus no disponible",
      difference: record.difference ?? "0.00",
      id: record.id,
      recordDate: record.record_date,
      status: record.status,
    })),
    todayRecordCount: todayRecords?.length ?? 0,
  };
}

export async function getMobileBusSnapshot(): Promise<MobileBusSnapshot> {
  const supabase = await createClient();
  const { data: buses } = await supabase
    .from("buses")
    .select("id, code, plate, status")
    .order("code");

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));

  return {
    buses: visibleBuses.slice(0, 8),
    counts: {
      active: visibleBuses.filter((bus) => bus.status === "active").length,
      inactive: visibleBuses.filter((bus) => bus.status === "inactive").length,
      maintenance: visibleBuses.filter((bus) => bus.status === "maintenance")
        .length,
    },
  };
}

export async function getMobileAlertSnapshot(): Promise<MobileAlertSnapshot> {
  const businessDate = getBusinessTodayDate();
  const alertsData = await getAlertsData({
    busId: undefined,
    dateFrom: shiftDateString(businessDate, -6),
    dateTo: businessDate,
    readState: "all",
    severity: "all",
  });

  return {
    alerts: alertsData.alerts.slice(0, 6),
    severityCounts: {
      critical: alertsData.alerts.filter((alert) => alert.severity === "critical")
        .length,
      info: alertsData.alerts.filter((alert) => alert.severity === "info").length,
      warning: alertsData.alerts.filter((alert) => alert.severity === "warning")
        .length,
    },
    unreadCount: alertsData.alerts.filter((alert) => !alert.read).length,
  };
}

export async function getMobileAlertsViewData(): Promise<MobileAlertsViewData> {
  const businessDate = getBusinessTodayDate();
  const alertsData = await getAlertsData({
    busId: undefined,
    dateFrom: shiftDateString(businessDate, -6),
    dateTo: businessDate,
    readState: "all",
    severity: "all",
  });

  const severityRank = {
    critical: 0,
    warning: 1,
    info: 2,
  } as const;
  const prioritizedAlerts = [...alertsData.alerts].sort((left, right) => {
    if (left.read !== right.read) {
      return Number(left.read) - Number(right.read);
    }

    if (left.severity !== right.severity) {
      return severityRank[left.severity] - severityRank[right.severity];
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
  const criticalUnread = prioritizedAlerts.filter(
    (alert) => !alert.read && alert.severity === "critical",
  );
  const pendingAlerts = prioritizedAlerts.filter(
    (alert) => !alert.read && alert.severity !== "critical",
  );
  const highlightedIds = new Set(
    [...criticalUnread, ...pendingAlerts].map((alert) => alert.id),
  );
  const recentAlerts = prioritizedAlerts.filter(
    (alert) => !highlightedIds.has(alert.id),
  );

  return {
    alertsReady: alertsData.migrationReady,
    businessDate,
    criticalUnread,
    filters: alertsData.filters,
    infoCount: alertsData.alerts.filter((alert) => alert.severity === "info").length,
    pendingAlerts,
    recentAlerts,
    totalCount: alertsData.alerts.length,
    unreadCount: alertsData.alerts.filter((alert) => !alert.read).length,
    warningCount: alertsData.alerts.filter((alert) => alert.severity === "warning")
      .length,
  };
}

export async function getMobileRegisterActivity(options: {
  businessDate?: string | undefined;
  role: AppRole;
  userId: string;
}): Promise<{
  businessDate: string;
  records: MobileRegisterRecentRecord[];
}> {
  const businessDate = options.businessDate ?? getBusinessTodayDate();
  const supabase = await createClient();
  let recordsQuery = supabase
    .from("daily_records")
    .select("id, bus_id, user_id, record_date, difference, status, updated_at")
    .eq("record_date", businessDate)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (options.role !== "admin") {
    recordsQuery = recordsQuery.eq("user_id", options.userId);
  }

  const [{ data: records }, { data: buses }, { data: profiles }] = await Promise.all([
    recordsQuery,
    supabase.from("buses").select("id, code, plate, photo_path, status").order("code"),
    supabase.from("profiles").select("id, name"),
  ]);

  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const visibleBusIds = new Set(visibleBuses.map((bus) => bus.id));
  const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses);
  const busMap = new Map(
    visibleBuses.map((bus) => [
      bus.id,
      {
        code: bus.code,
        photoUrl: photoMap.get(bus.id) ?? null,
        plate: bus.plate,
      },
    ]),
  );
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));

  return {
    businessDate,
    records: (records ?? [])
      .filter((record) => visibleBusIds.has(record.bus_id))
      .map((record) => {
        const baseRecord = {
          busCode: busMap.get(record.bus_id)?.code ?? "Bus no disponible",
          busPhotoUrl: busMap.get(record.bus_id)?.photoUrl ?? null,
          busPlate: busMap.get(record.bus_id)?.plate ?? null,
          difference: record.difference,
          id: record.id,
          recordDate: record.record_date,
          status: record.status,
          updatedAt: record.updated_at,
        };
        const userName = profileMap.get(record.user_id);

        return userName ? { ...baseRecord, userName } : baseRecord;
      }) satisfies MobileRegisterRecentRecord[],
  };
}
