import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { User } from "@supabase/supabase-js";

import { hasRequiredPublicEnv } from "@/lib/env";
import { getDefaultDashboardPath, getLoginPath, type LoginErrorCode } from "@/lib/auth/routing";
import type { AppRole, Profile } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export type SessionContext = {
  authIssue: LoginErrorCode | null;
  envReady: boolean;
  profile: Profile | null;
  user: User | null;
};

export type AuthorizedSessionContext = {
  envReady: boolean;
  profile: Profile;
  user: User;
};

type RequireAuthOptions = {
  redirectTo?: string;
};

export const getSessionContext = cache(async (): Promise<SessionContext> => {
  if (!hasRequiredPublicEnv()) {
    return {
      authIssue: null,
      envReady: false,
      profile: null,
      user: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authIssue: null,
      envReady: true,
      profile: null,
      user: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      authIssue: "missing-profile",
      envReady: true,
      profile: null,
      user,
    };
  }

  if (!profile.active) {
    return {
      authIssue: "inactive-profile",
      envReady: true,
      profile: null,
      user,
    };
  }

  return {
    authIssue: null,
    envReady: true,
    profile,
    user,
  };
});

export async function requireAuth(
  options?: RequireAuthOptions,
): Promise<AuthorizedSessionContext> {
  const context = await getSessionContext();
  const loginRedirectOptions = options?.redirectTo
    ? { redirectTo: options.redirectTo }
    : undefined;

  if (!context.user) {
    redirect(getLoginPath(loginRedirectOptions));
  }

  if (!context.profile) {
    redirect(
      getLoginPath({
        error: context.authIssue ?? "missing-profile",
        ...(options?.redirectTo ? { redirectTo: options.redirectTo } : {}),
      }),
    );
  }

  return {
    envReady: context.envReady,
    profile: context.profile,
    user: context.user,
  };
}

export async function requireRole(requiredRole: AppRole | AppRole[]) {
  const context = await requireAuth();
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!allowedRoles.includes(context.profile.role)) {
    redirect(getDefaultDashboardPath(context.profile.role));
  }

  return context;
}
