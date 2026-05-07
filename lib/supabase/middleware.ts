import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { hasRequiredPublicEnv } from "@/lib/env";
import type { LoginErrorCode } from "@/lib/auth/routing";
import type { AppRole } from "@/lib/auth/types";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/config";

type MiddlewareSessionResult = {
  authIssue: LoginErrorCode | null;
  response: NextResponse;
  role: AppRole | null;
  userId: string | null;
};

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    );
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    )
    .forEach((cookie) => {
      request.cookies.delete(cookie.name);
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    });
}

export async function updateSession(
  request: NextRequest,
): Promise<MiddlewareSessionResult> {
  let response = NextResponse.next({
    request,
  });

  if (!hasRequiredPublicEnv()) {
    return {
      authIssue: null,
      response,
      role: null,
      userId: null,
    };
  }

  const { key, url } = getSupabaseConfig();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, options, value }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const hasAuthCookie = hasSupabaseAuthCookie(request);
  let user: User | null = null;
  let userErrorMessage: string | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    user = data.user;
    userErrorMessage = error?.message ?? null;
  } catch (error) {
    userErrorMessage =
      error instanceof Error ? error.message : "Unable to validate session.";
  }

  let authIssue: LoginErrorCode | null =
    userErrorMessage && hasAuthCookie
      ? "session-expired"
      : null;

  let userId = !authIssue && user ? user.id : null;
  let role: AppRole | null = null;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active, role")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      authIssue = "missing-profile";
    } else if (!profile.active) {
      authIssue = "inactive-profile";
    } else {
      role = profile.role;
    }

    if (authIssue) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        clearSupabaseAuthCookies(request, response);
      }

      userId = null;
      role = null;
    }
  }

  if (authIssue === "session-expired") {
    clearSupabaseAuthCookies(request, response);
  }

  return {
    authIssue,
    response,
    role,
    userId,
  };
}
