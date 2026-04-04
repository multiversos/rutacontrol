import { z } from "zod";

const publicEnvSchema = z
  .object({
    BUSINESS_TIMEZONE: z.string().trim().min(1).default("America/Caracas"),
    NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("RutaControl"),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  })
  .superRefine((env, ctx) => {
    if (
      !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Debes configurar NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        path: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      });
    }
  });

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function getPublicEnvSource() {
  return {
    BUSINESS_TIMEZONE: process.env.BUSINESS_TIMEZONE,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function hasRequiredPublicEnv() {
  return publicEnvSchema.safeParse(getPublicEnvSource()).success;
}

export function hasServiceRoleEnv() {
  const result = serverEnvSchema.safeParse({
    ...getPublicEnvSource(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  return result.success && Boolean(result.data.SUPABASE_SERVICE_ROLE_KEY);
}

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse(getPublicEnvSource());
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    ...getPublicEnvSource(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getSupabasePublicKey(env: PublicEnv = getPublicEnv()) {
  return (
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
