"use server";

import { redirect } from "next/navigation";

import { getLoginPath, sanitizeRedirectPath } from "@/lib/auth/routing";
import { hasRequiredPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction(formData?: FormData) {
  const requestedRedirect =
    typeof formData?.get("redirectTo") === "string"
      ? String(formData?.get("redirectTo"))
      : null;
  const redirectTo = sanitizeRedirectPath(requestedRedirect, null);

  if (!hasRequiredPublicEnv()) {
    redirect(getLoginPath({ redirectTo }));
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(getLoginPath({ redirectTo }));
}
