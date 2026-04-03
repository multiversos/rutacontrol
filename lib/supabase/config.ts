import { getPublicEnv, getSupabasePublicKey } from "@/lib/env";

export function getSupabaseConfig() {
  const env = getPublicEnv();

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: getSupabasePublicKey(env),
  };
}
