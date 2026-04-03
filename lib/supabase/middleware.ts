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

  const { data: claimsData } = await supabase.auth.getClaims();

  let userId =
    typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  let role: AppRole | null = null;
  let authIssue: LoginErrorCode | null = null;

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

  return {
    authIssue,
    response,
    role,
    userId,
  };
}
