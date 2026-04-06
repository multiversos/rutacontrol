import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const BUS_PHOTO_BUCKET = "bus-photos";
export const BUS_PHOTO_PREFIX = "buses";
export const BUS_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const BUS_PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;
export const BUS_PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type BusPhotoSource = {
  id: string;
  photo_path: string | null;
};

export function sanitizeBusPhotoFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildBusPhotoObjectPath(busId: string, fileName: string) {
  const safeFileName = sanitizeBusPhotoFileName(fileName) || "bus-photo.webp";
  return `${BUS_PHOTO_PREFIX}/${busId}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
}

export async function getSignedBusPhotoUrl(
  supabase: SupabaseClient<Database>,
  photoPath: string | null | undefined,
) {
  if (!photoPath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(BUS_PHOTO_BUCKET)
    .createSignedUrl(photoPath, BUS_PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error) {
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function getBusPhotoUrlMap(
  supabase: SupabaseClient<Database>,
  buses: BusPhotoSource[],
) {
  const uniqueEntries = Array.from(
    new Map(
      buses
        .filter((bus) => Boolean(bus.id))
        .map((bus) => [bus.id, bus.photo_path ?? null]),
    ).entries(),
  );

  const entries = await Promise.all(
    uniqueEntries.map(async ([busId, photoPath]) => {
      const signedUrl = await getSignedBusPhotoUrl(supabase, photoPath);
      return [busId, signedUrl] as const;
    }),
  );

  return new Map(entries);
}
