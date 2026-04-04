import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { isDemoBus } from "@/lib/demo-data";
import { getBusinessTodayDate, shiftDateString } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

type RepairAttachmentRow = Pick<
  Tables<"repair_attachments">,
  | "bucket_name"
  | "content_type"
  | "created_at"
  | "file_size_bytes"
  | "id"
  | "object_path"
  | "original_name"
  | "repair_id"
>;

export type RepairFilterState = {
  busId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type RepairListItem = {
  attachment: {
    contentType: string;
    createdAt: string;
    fileSizeBytes: number;
    id: string;
    originalName: string;
    signedUrl: string | null;
  } | null;
  busCode: string;
  busId: string;
  category: Tables<"repairs">["category"];
  costUsd: string;
  createdAt: string;
  description: string;
  id: string;
  nextServiceDueDate: string | null;
  nextServiceNotes: string | null;
  provider: string;
  repairDate: string;
};

export type NextServiceSuggestion = {
  busCode: string;
  busId: string;
  nextServiceDueDate: string | null;
  notes: string | null;
  repairDate: string | null;
};

export async function getRepairsData(filters: RepairFilterState) {
  const supabase = await createClient();
  const today = getBusinessTodayDate();
  const dateFrom = filters.dateFrom ?? shiftDateString(today, -59);
  const dateTo = filters.dateTo ?? today;

  let repairsQuery = supabase
    .from("repairs")
    .select(
      "id, bus_id, category, provider, description, cost_usd, repair_date, next_service_due_date, next_service_notes, created_at",
    )
    .gte("repair_date", dateFrom)
    .lte("repair_date", dateTo)
    .order("repair_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.busId) {
    repairsQuery = repairsQuery.eq("bus_id", filters.busId);
  }

  const [{ data: repairs, error: repairsError }, { data: buses }, { data: allRepairRows }] =
    await Promise.all([
      repairsQuery,
      supabase.from("buses").select("id, code, status").order("code"),
      supabase
        .from("repairs")
        .select(
          "id, bus_id, category, provider, description, cost_usd, repair_date, next_service_due_date, next_service_notes, created_at",
        )
        .order("repair_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const migrationReady =
    !repairsError || !["42P01", "PGRST205"].includes(repairsError.code ?? "");

  if (repairsError && migrationReady) {
    throw repairsError;
  }

  const repairIds = (repairs ?? []).map((repair) => repair.id);
  const { data: attachments } =
    repairIds.length > 0
      ? await supabase
          .from("repair_attachments")
          .select(
            "id, repair_id, bucket_name, object_path, original_name, content_type, file_size_bytes, created_at",
          )
          .in("repair_id", repairIds)
          .order("created_at", { ascending: false })
      : { data: [] as RepairAttachmentRow[] };

  const busMap = new Map((buses ?? []).map((bus) => [bus.id, bus.code]));
  const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
  const visibleBusIds = new Set(visibleBuses.map((bus) => bus.id));
  const attachmentMap = new Map<string, RepairAttachmentRow>();

  (attachments ?? []).forEach((attachment) => {
    if (!attachmentMap.has(attachment.repair_id)) {
      attachmentMap.set(attachment.repair_id, attachment);
    }
  });

  const signedUrlEntries = await Promise.all(
    Array.from(attachmentMap.values()).map(async (attachment) => {
      const { data } = await supabase.storage
        .from(attachment.bucket_name)
        .createSignedUrl(attachment.object_path, 60 * 60);

      return [attachment.repair_id, data?.signedUrl ?? null] as const;
    }),
  );
  const signedUrlMap = new Map(signedUrlEntries);

  const normalizedRepairs = (repairs ?? [])
    .filter((repair) => visibleBusIds.has(repair.bus_id))
    .map((repair) => {
    const attachment = attachmentMap.get(repair.id);

    return {
      attachment: attachment
        ? {
            contentType: attachment.content_type,
            createdAt: attachment.created_at,
            fileSizeBytes: attachment.file_size_bytes,
            id: attachment.id,
            originalName: attachment.original_name,
            signedUrl: signedUrlMap.get(repair.id) ?? null,
          }
        : null,
      busCode: busMap.get(repair.bus_id) ?? repair.bus_id,
      busId: repair.bus_id,
      category: repair.category,
      costUsd: repair.cost_usd,
      createdAt: repair.created_at,
      description: repair.description,
      id: repair.id,
      nextServiceDueDate: repair.next_service_due_date,
      nextServiceNotes: repair.next_service_notes,
      provider: repair.provider,
      repairDate: repair.repair_date,
    };
  }) satisfies RepairListItem[];

  const nextServiceMap = new Map<string, NextServiceSuggestion>();

  visibleBuses
    .filter((bus) => bus.status === "active")
    .forEach((bus) => {
      nextServiceMap.set(bus.id, {
        busCode: bus.code,
        busId: bus.id,
        nextServiceDueDate: null,
        notes: null,
        repairDate: null,
      });
    });

  (allRepairRows ?? []).forEach((repair) => {
    if (!repair.next_service_due_date) {
      return;
    }

    const current = nextServiceMap.get(repair.bus_id);

    if (!current || current.nextServiceDueDate) {
      return;
    }

    nextServiceMap.set(repair.bus_id, {
      busCode: busMap.get(repair.bus_id) ?? repair.bus_id,
      busId: repair.bus_id,
      nextServiceDueDate: repair.next_service_due_date,
      notes: repair.next_service_notes,
      repairDate: repair.repair_date,
    });
  });

  return {
    busOptions: visibleBuses.map((bus) => ({
      code: bus.code,
      id: bus.id,
    })),
    filters: {
      busId: filters.busId,
      dateFrom,
      dateTo,
    },
    migrationReady,
    repairs: normalizedRepairs,
    suggestedServices: Array.from(nextServiceMap.values()).sort((left, right) =>
      left.busCode.localeCompare(right.busCode),
    ),
  };
}
