"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { BUS_PHOTO_BUCKET } from "@/lib/bus-photo";
import { initialFormState, type FormState } from "@/lib/forms/action-state";
import { OPERATIONAL_ROUTE } from "@/lib/operational-route";
import { createClient } from "@/lib/supabase/server";
import { busSchema } from "@/lib/validators/bus";

function normalizeBusFormData(formData: FormData) {
  return {
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    plate: String(formData.get("plate") ?? "").trim().toUpperCase(),
    status: formData.get("status"),
  };
}

async function ensureOperationalRouteId() {
  const supabase = await createClient();
  const { data: existingRoute, error: existingError } = await supabase
    .from("routes")
    .select("id, active, destination, name, origin")
    .eq("origin", OPERATIONAL_ROUTE.origin)
    .eq("destination", OPERATIONAL_ROUTE.destination)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingRoute) {
    if (
      !existingRoute.active ||
      existingRoute.name !== OPERATIONAL_ROUTE.name ||
      existingRoute.origin !== OPERATIONAL_ROUTE.origin ||
      existingRoute.destination !== OPERATIONAL_ROUTE.destination
    ) {
      const { error: updateError } = await supabase
        .from("routes")
        .update({
          active: true,
          destination: OPERATIONAL_ROUTE.destination,
          name: OPERATIONAL_ROUTE.name,
          origin: OPERATIONAL_ROUTE.origin,
        })
        .eq("id", existingRoute.id);

      if (updateError) {
        throw updateError;
      }
    }

    return existingRoute.id;
  }

  const { data: insertedRoute, error: insertError } = await supabase
    .from("routes")
    .insert({
      active: true,
      destination: OPERATIONAL_ROUTE.destination,
      name: OPERATIONAL_ROUTE.name,
      origin: OPERATIONAL_ROUTE.origin,
    })
    .select("id")
    .single();

  if (insertError || !insertedRoute) {
    throw insertError ?? new Error("No pudimos asegurar la ruta operativa.");
  }

  return insertedRoute.id;
}

function revalidateBusPaths(busId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/buses");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/daily/new");

  if (busId) {
    revalidatePath(`/dashboard/buses/${busId}`);
  }
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
  const routeId = await ensureOperationalRouteId();
  const payload = {
    code: parsed.data.code,
    plate: parsed.data.plate,
    route_id: routeId,
    status: parsed.data.status,
  };

  const supabase = await createClient();
  const query = busId
    ? supabase.from("buses").update(payload).eq("id", busId).select("id").single()
    : supabase.from("buses").insert(payload).select("id").single();

  const { data, error } = await query;

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "El codigo interno o la placa ya existen."
          : "No pudimos guardar el bus.",
      status: "error",
    };
  }

  revalidateBusPaths(data?.id);

  return {
    entityId: data?.id,
    message: busId
      ? "Bus actualizado correctamente. La linea fija quedo asignada automaticamente."
      : "Bus creado correctamente. La linea fija quedo asignada automaticamente.",
    status: "success",
  };
}

type SaveBusPhotoInput = {
  busId: string;
  photoPath: string;
};

export async function saveBusPhotoAction({
  busId,
  photoPath,
}: SaveBusPhotoInput): Promise<FormState> {
  await requireRole("admin");

  const normalizedBusId = busId.trim();
  const normalizedPhotoPath = photoPath.trim();

  if (!normalizedBusId || !normalizedPhotoPath) {
    return {
      message: "Faltan datos para guardar la foto del bus.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: bus, error: busError } = await supabase
    .from("buses")
    .select("id, photo_path")
    .eq("id", normalizedBusId)
    .maybeSingle();

  if (busError || !bus) {
    return {
      message: "No encontramos el bus para asociarle la foto.",
      status: "error",
    };
  }

  const { error: signedUrlError } = await supabase.storage
    .from(BUS_PHOTO_BUCKET)
    .createSignedUrl(normalizedPhotoPath, 60);

  if (signedUrlError) {
    return {
      message:
        "La foto subida no esta disponible en Storage. Intenta subirla nuevamente.",
      status: "error",
    };
  }

  const previousPhotoPath = bus.photo_path;
  const { error: updateError } = await supabase
    .from("buses")
    .update({ photo_path: normalizedPhotoPath })
    .eq("id", normalizedBusId);

  if (updateError) {
    return {
      message: "No pudimos guardar la referencia de la foto del bus.",
      status: "error",
    };
  }

  if (previousPhotoPath && previousPhotoPath !== normalizedPhotoPath) {
    const { error: removeError } = await supabase.storage
      .from(BUS_PHOTO_BUCKET)
      .remove([previousPhotoPath]);

    if (removeError) {
      console.error("No pudimos eliminar la foto anterior del bus.", removeError);
    }
  }

  revalidateBusPaths(normalizedBusId);

  return {
    entityId: normalizedBusId,
    message: "Foto del bus actualizada correctamente.",
    status: "success",
  };
}
