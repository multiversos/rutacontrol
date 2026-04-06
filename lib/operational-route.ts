export const OPERATIONAL_ROUTE = {
  destination: "Maracaibo",
  label: "El Moján <-> Maracaibo",
  name: "El Moján - Maracaibo",
  origin: "El Moján",
} as const;

export function isOperationalRouteLike(
  route:
    | {
        destination: string;
        name: string;
        origin: string;
      }
    | null
    | undefined,
) {
  if (!route) {
    return false;
  }

  return (
    route.name === OPERATIONAL_ROUTE.name &&
    route.origin === OPERATIONAL_ROUTE.origin &&
    route.destination === OPERATIONAL_ROUTE.destination
  );
}
