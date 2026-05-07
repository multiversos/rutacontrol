import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

function isInvalidSessionError(errorMessage?: string) {
  return /expired|invalid|jwt|session|token/i.test(errorMessage ?? "");
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
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  let authIssue: LoginErrorCode | null =
    claimsError && hasAuthCookie && isInvalidSessionError(claimsError.message)
      ? "session-expired"
      : null;

  let userId =
    !authIssue && typeof claimsData?.claims?.sub === "string"
      ? claimsData.claims.sub
      : null;
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
      await supabase.auth.signOut();
      userId = null;
      role = null;
    }
  }

  if (authIssue === "session-expired") {
    await supabase.auth.signOut();
  }

  return {
    authIssue,
    response,
    role,
    userId,
  };
}
