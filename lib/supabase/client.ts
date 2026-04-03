"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const { key, url } = getSupabaseConfig();

  return createBrowserClient<Database>(url, key);
}
