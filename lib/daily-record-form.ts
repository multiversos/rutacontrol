import "server-only";

import { getBusPhotoUrlMap } from "@/lib/bus-photo";
import { isDemoBus } from "@/lib/demo-data";
import { OPERATIONAL_ROUTE } from "@/lib/operational-route";
import { createClient } from "@/lib/supabase/server";

export type DailyFormContext = {
  buses: Array<{
    code: string;
    id: string;
    photoUrl: string | null;
    plate: string;
    routeName: string;
    status: "active" | "inactive" | "maintenance";
  }>;
  existingRecords: Array<{
    bus_id: string;
    id: string;
    record_date: string;
  }>;
  initialRecord: Awaited<ReturnType<typeof getInitialDailyRecord>> | null;
  loadError: string | null;
  requestedRecordMissing: boolean;
};

export async function getInitialDailyRecord(recordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_records")
    .select("*")
    .eq("id", recordId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getDailyFormContext(
  recordId?: string,
): Promise<DailyFormContext> {
  try {
    const supabase = await createClient();
    const initialRecord = recordId ? await getInitialDailyRecord(recordId) : null;
    const busQueryBase = supabase
      .from("buses")
      .select("id, code, plate, photo_path, route_id, status");
    const filteredBusQuery = initialRecord
      ? busQueryBase.or(`status.eq.active,id.eq.${initialRecord.bus_id}`)
      : busQueryBase.eq("status", "active");
    const [{ data: buses, error: busesError }, { data: existingRecords, error: recordsError }] =
      await Promise.all([
        filteredBusQuery.order("code"),
        supabase.from("daily_records").select("id, bus_id, record_date"),
      ]);

    if (busesError) {
      throw busesError;
    }

    if (recordsError) {
      throw recordsError;
    }

    const visibleBuses = (buses ?? []).filter((bus) => !isDemoBus(bus));
    const photoMap = await getBusPhotoUrlMap(supabase, visibleBuses);

    return {
      buses: visibleBuses.map((bus) => ({
        ...bus,
        photoUrl: photoMap.get(bus.id) ?? null,
        routeName: OPERATIONAL_ROUTE.label,
      })),
      existingRecords: existingRecords ?? [],
      initialRecord,
      loadError: null,
      requestedRecordMissing: Boolean(recordId && !initialRecord),
    };
  } catch (error) {
    console.error("No pudimos preparar el contexto del formulario diario.", error);

    return {
      buses: [],
      existingRecords: [],
      initialRecord: null,
      loadError:
        "No pudimos cargar este registro diario en este momento. Intenta volver al historial y reabrirlo.",
      requestedRecordMissing: Boolean(recordId),
    };
  }
}
