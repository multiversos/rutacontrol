"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { routeSchema } from "@/lib/validators/route";

function normalizeRouteFormData(formData: FormData) {
  return {
    active: formData.get("active") === "on",
    destination: formData.get("destination"),
    expectedIncome: formData.get("expectedIncome"),
    name: formData.get("name"),
    origin: formData.get("origin"),
  };
}

export async function saveRouteAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  await requireRole("admin");

  const parsed = routeSchema.safeParse(normalizeRouteFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos de la ruta.",
      status: "error",
    };
  }

  const routeId = String(formData.get("routeId") ?? "").trim();
  const payload = {
    active: parsed.data.active,
    destination: parsed.data.destination,
    expected_income:
      parsed.data.expectedIncome == null
        ? null
        : parsed.data.expectedIncome.toFixed(2),
    name: parsed.data.name,
    origin: parsed.data.origin,
  };

  const supabase = await createClient();
  const query = routeId
    ? supabase.from("routes").update(payload).eq("id", routeId).select("id").single()
    : supabase.from("routes").insert(payload).select("id").single();

  const { error } = await query;

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "Ya existe una ruta con esa combinacion de nombre, origen y destino."
          : "No pudimos guardar la ruta.",
      status: "error",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/buses");
  revalidatePath("/dashboard/routes");

  return {
    message: routeId ? "Ruta actualizada correctamente." : "Ruta creada correctamente.",
    status: "success",
  };
}
