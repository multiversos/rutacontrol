"use server";

import { redirect } from "next/navigation";

import { hasRequiredPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  if (!hasRequiredPublicEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
