import type { AppRole } from "@/lib/auth/types";

export const DASHBOARD_REDIRECT_PATHS = [
  "/dashboard",
  "/dashboard/alerts",
  "/dashboard/daily",
  "/dashboard/daily/new",
  "/dashboard/buses",
  "/dashboard/debts",
  "/dashboard/maintenance",
  "/dashboard/repairs",
  "/dashboard/routes",
  "/dashboard/audit",
] as const;

export const MOBILE_REDIRECT_PATHS = [
  "/mobile",
  "/mobile/register",
  "/mobile/register/expenses",
  "/mobile/register/debts",
  "/mobile/buses",
  "/mobile/alerts",
  "/mobile/more",
] as const;

export const ALLOWED_REDIRECT_PATHS = [
  ...DASHBOARD_REDIRECT_PATHS,
  ...MOBILE_REDIRECT_PATHS,
] as const;

export type AllowedRedirectPath =
  | (typeof ALLOWED_REDIRECT_PATHS)[number]
  | `/dashboard/buses/${string}`
  | `/mobile/buses/${string}`;
export type LoginErrorCode =
  | "inactive-profile"
  | "missing-profile"
  | "session-expired";

const allowedRedirectPathSet = new Set<string>(ALLOWED_REDIRECT_PATHS);

function isBusProfilePath(path: string) {
  return /^\/(dashboard|mobile)\/buses\/[^/]+$/.test(path);
}

function splitRedirectTarget(path?: string | null) {
  const raw = typeof path === "string" ? path : "";
  const separatorIndex = raw.indexOf("?");
  if (separatorIndex === -1) {
    return {
      pathname: raw,
      search: "",
    };
  }

  return {
    pathname: raw.slice(0, separatorIndex),
    search: raw.slice(separatorIndex),
  };
}

export function getDefaultDashboardPath(role?: AppRole | null) {
  return role === "registrador" ? "/dashboard/daily/new" : "/dashboard";
}

export function getDefaultMobilePath(role?: AppRole | null) {
  return role === "registrador" ? "/mobile/register" : "/mobile";
}

export function isAllowedRedirectPath(path?: string | null): path is AllowedRedirectPath {
  return (
    typeof path === "string" &&
    (allowedRedirectPathSet.has(path) || isBusProfilePath(path))
  );
}

export function isMobileRedirectPath(path?: string | null) {
  return (
    typeof path === "string" &&
    (MOBILE_REDIRECT_PATHS.includes(path as never) ||
      /^\/mobile\/buses\/[^/]+$/.test(path))
  );
}

export function sanitizeRedirectPath(path?: string | null, role?: AppRole | null) {
  const target = splitRedirectTarget(path);

  if (!isAllowedRedirectPath(target.pathname)) {
    return getDefaultDashboardPath(role);
  }

  if (
    role === "registrador" &&
    (target.pathname === "/dashboard" ||
      target.pathname === "/dashboard/alerts" ||
      target.pathname === "/dashboard/debts" ||
      target.pathname === "/dashboard/maintenance" ||
      target.pathname === "/dashboard/repairs" ||
      target.pathname === "/dashboard/buses" ||
      target.pathname.startsWith("/dashboard/buses/") ||
      target.pathname === "/dashboard/routes" ||
      target.pathname === "/dashboard/audit")
  ) {
    return getDefaultDashboardPath(role);
  }

  if (
    role === "registrador" &&
    (target.pathname === "/mobile/buses" ||
      target.pathname.startsWith("/mobile/buses/") ||
      target.pathname === "/mobile/alerts" ||
      target.pathname === "/mobile/register/debts")
  ) {
    return getDefaultMobilePath(role);
  }

  return `${target.pathname}${target.search}`;
}

export function getLoginPath(options?: {
  error?: LoginErrorCode | null;
  redirectTo?: string | null;
}) {
  const params = new URLSearchParams();
  const safeRedirect = sanitizeRedirectPath(options?.redirectTo, null);

  if (options?.error) {
    params.set("error", options.error);
  }

  if (safeRedirect !== "/dashboard") {
    params.set("redirectTo", safeRedirect);
  }

  const queryString = params.toString();
  return queryString ? `/login?${queryString}` : "/login";
}

export function getLoginErrorMessage(code?: string | null) {
  switch (code) {
    case "inactive-profile":
      return "Tu cuenta esta inactiva. Contacta al administrador para reactivar el acceso.";
    case "missing-profile":
      return "Tu cuenta autentico correctamente, pero no tiene un perfil operativo en public.profiles.";
    case "session-expired":
      return "Tu sesion vencio o no pudo renovarse. Ingresa de nuevo para continuar.";
    default:
      return null;
  }
}
