"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { hasRequiredPublicEnv } from "@/lib/env";
import {
  getLoginErrorMessage,
  sanitizeRedirectPath,
} from "@/lib/auth/routing";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators/auth";

export type LoginFormState = {
  error?: string;
};

export async function signInAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  if (!hasRequiredPublicEnv()) {
    return {
      error:
        "Configura las variables de Supabase antes de intentar iniciar sesion.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No pudimos validar tus datos.",
    };
  }

  const requestedRedirect = String(formData.get("redirectTo") ?? "/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Correo o contrasena incorrectos."
          : error.message,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  if (!profile) {
    await supabase.auth.signOut();

    return {
      error: getLoginErrorMessage("missing-profile") ?? "No pudimos validar tu acceso.",
    };
  }

  if (!profile.active) {
    await supabase.auth.signOut();

    return {
      error:
        getLoginErrorMessage("inactive-profile") ??
        "Tu usuario esta inactivo. Contacta al administrador.",
    };
  }

  await supabase.rpc("touch_last_login");

  const nextPath = sanitizeRedirectPath(requestedRedirect, profile.role);

  redirect(nextPath as Route);
}
