import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export const OPERATIONAL_ROUTE_NAME = "El Moján - Maracaibo";
export const OPERATIONAL_ROUTE_ORIGIN = "El Moján";
export const OPERATIONAL_ROUTE_DESTINATION = "Maracaibo";
export const OPERATIONAL_ROUTE_LABEL = "El Moján <-> Maracaibo";

type RouteShape = Pick<
  Tables<"routes">,
  "destination" | "id" | "name" | "origin"
> & {
  active?: boolean;
};

function normalizeRouteValue(value?: string | null) {
  return (value ?? "").trim().toLocaleLowerCase("es-VE");
}

export function isOperationalRoute(route?: Partial<RouteShape> | null) {
  if (!route) {
    return false;
  }

  return (
    normalizeRouteValue(route.name) === normalizeRouteValue(OPERATIONAL_ROUTE_NAME) &&
    normalizeRouteValue(route.origin) === normalizeRouteValue(OPERATIONAL_ROUTE_ORIGIN) &&
    normalizeRouteValue(route.destination) ===
      normalizeRouteValue(OPERATIONAL_ROUTE_DESTINATION)
  );
}

export function findOperationalRouteInList(routes: RouteShape[]) {
  return routes.find((route) => isOperationalRoute(route)) ?? null;
}

export async function ensureOperationalRoute(
  supabase: SupabaseClient<Database>,
) {
  const selectColumns = "id, name, origin, destination, active";
  const { data: existingRoutes, error: fetchError } = await supabase
    .from("routes")
    .select(selectColumns)
    .order("created_at");

  if (fetchError) {
    throw fetchError;
  }

  const existing = findOperationalRouteInList(existingRoutes ?? []);

  if (existing) {
    if (existing.active) {
      return existing;
    }

    const { data: activated, error: updateError } = await supabase
      .from("routes")
      .update({ active: true })
      .eq("id", existing.id)
      .select(selectColumns)
      .single();

    if (updateError) {
      throw updateError;
    }

    return activated;
  }

  const { data: created, error: insertError } = await supabase
    .from("routes")
    .insert({
      active: true,
      destination: OPERATIONAL_ROUTE_DESTINATION,
      name: OPERATIONAL_ROUTE_NAME,
      origin: OPERATIONAL_ROUTE_ORIGIN,
    })
    .select(selectColumns)
    .single();

  if (!insertError) {
    return created;
  }

  if (insertError.code !== "23505") {
    throw insertError;
  }

  const { data: recovered, error: recoverError } = await supabase
    .from("routes")
    .select(selectColumns)
    .order("created_at");

  if (recoverError) {
    throw recoverError;
  }

  const recoveredRoute = findOperationalRouteInList(recovered ?? []);

  if (!recoveredRoute) {
    throw insertError;
  }

  return recoveredRoute;
}
