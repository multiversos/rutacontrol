import type { AppRole } from "@/lib/auth/types";

export const ALLOWED_REDIRECT_PATHS = [
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

export type AllowedRedirectPath = (typeof ALLOWED_REDIRECT_PATHS)[number];
export type LoginErrorCode = "inactive-profile" | "missing-profile";

const allowedRedirectPathSet = new Set<string>(ALLOWED_REDIRECT_PATHS);

export function getDefaultDashboardPath(role?: AppRole | null) {
  return role === "registrador" ? "/dashboard/daily/new" : "/dashboard";
}

export function isAllowedRedirectPath(path?: string | null): path is AllowedRedirectPath {
  return typeof path === "string" && allowedRedirectPathSet.has(path);
}

export function sanitizeRedirectPath(path?: string | null, role?: AppRole | null) {
  if (!isAllowedRedirectPath(path)) {
    return getDefaultDashboardPath(role);
  }

  if (
    role === "registrador" &&
    (path === "/dashboard" ||
      path === "/dashboard/alerts" ||
      path === "/dashboard/debts" ||
      path === "/dashboard/maintenance" ||
      path === "/dashboard/repairs" ||
      path === "/dashboard/buses" ||
      path === "/dashboard/routes" ||
      path === "/dashboard/audit")
  ) {
    return getDefaultDashboardPath(role);
  }

  return path;
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
    default:
      return null;
  }
}
