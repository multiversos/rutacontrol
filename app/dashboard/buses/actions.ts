"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { ensureOperationalRoute } from "@/lib/operational-route";
import { createClient } from "@/lib/supabase/server";
import { busSchema } from "@/lib/validators/bus";

function normalizeBusFormData(formData: FormData) {
  return {
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    plate: String(formData.get("plate") ?? "").trim().toUpperCase(),
    status: formData.get("status"),
  };
}

export async function saveBusAction(
  _previousState: FormState = initialFormState,
  formData: FormData,
): Promise<FormState> {
  void _previousState;
  await requireRole("admin");

  const parsed = busSchema.safeParse(normalizeBusFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos del bus.",
      status: "error",
    };
  }

  const busId = String(formData.get("busId") ?? "").trim();
  const supabase = await createClient();

  let operationalRouteId: string;

  try {
    const operationalRoute = await ensureOperationalRoute(supabase);
    operationalRouteId = operationalRoute.id;
  } catch {
    return {
      message:
        "No pudimos asegurar la ruta operativa fija. Intenta nuevamente o revisa la configuracion interna.",
      status: "error",
    };
  }

  const payload = {
    code: parsed.data.code,
    plate: parsed.data.plate,
    route_id: operationalRouteId,
    status: parsed.data.status,
  };

  const query = busId
    ? supabase.from("buses").update(payload).eq("id", busId).select("id").single()
    : supabase.from("buses").insert(payload).select("id").single();

  const { error } = await query;

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "El codigo interno o la placa ya existen."
          : "No pudimos guardar el bus.",
      status: "error",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/buses");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/daily/new");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/intelligence");

  return {
    message: busId ? "Bus actualizado correctamente." : "Bus creado correctamente.",
    status: "success",
  };
}
