import { NextResponse, type NextRequest } from "next/server";

import {
  getDefaultDashboardPath,
  isAllowedRedirectPath,
} from "@/lib/auth/routing";
import { updateSession } from "@/lib/supabase/middleware";

function redirectWithCookies(target: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(target);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { authIssue, response, role, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isLoginRoute = pathname === "/login";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isDashboardRoot = pathname === "/dashboard";

  if (!userId && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";

    if (authIssue) {
      loginUrl.searchParams.set("error", authIssue);
    }

    if (isAllowedRedirectPath(pathname) && pathname !== "/dashboard") {
      loginUrl.searchParams.set("redirectTo", pathname);
    }

    return redirectWithCookies(loginUrl, response);
  }

  if (authIssue && isLoginRoute && !request.nextUrl.searchParams.has("error")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("error", authIssue);

    return redirectWithCookies(loginUrl, response);
  }

  if (userId && isLoginRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = getDefaultDashboardPath(role);
    dashboardUrl.search = "";

    return redirectWithCookies(dashboardUrl, response);
  }

  if (userId && role === "registrador" && isDashboardRoot) {
    const registradorUrl = request.nextUrl.clone();
    registradorUrl.pathname = "/dashboard/daily/new";
    registradorUrl.search = "";

    return redirectWithCookies(registradorUrl, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
