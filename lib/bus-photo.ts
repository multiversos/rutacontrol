import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const BUS_PHOTO_BUCKET = "repair-receipts";
export const BUS_PHOTO_PREFIX = "bus-photos";

export function getBusPhotoObjectPath(busId: string) {
  return `${BUS_PHOTO_PREFIX}/${busId}/current`;
}

export async function getBusPhotoUrlMap(
  supabase: SupabaseClient<Database>,
  busIds: string[],
) {
  const uniqueBusIds = Array.from(new Set(busIds.filter(Boolean)));

  const entries = await Promise.all(
    uniqueBusIds.map(async (busId) => {
      const folder = `${BUS_PHOTO_PREFIX}/${busId}`;
      const { data: objects, error: listError } = await supabase.storage
        .from(BUS_PHOTO_BUCKET)
        .list(folder, {
          limit: 10,
        });

      if (listError) {
        return [busId, null] as const;
      }

      const currentObject = objects?.find((object) => object.name === "current");

      if (!currentObject) {
        return [busId, null] as const;
      }

      const { data } = await supabase.storage
        .from(BUS_PHOTO_BUCKET)
        .createSignedUrl(`${folder}/${currentObject.name}`, 60 * 60);

      return [busId, data?.signedUrl ?? null] as const;
    }),
  );

  return new Map(entries);
}
