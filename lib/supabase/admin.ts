import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv, hasServiceRoleEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminClient() {
  if (!hasServiceRoleEnv()) {
    return null;
  }

  const env = getServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
