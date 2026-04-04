"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import type { FormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/server";
import { repairSchema } from "@/lib/validators/repair";

function normalizeRepairFormData(formData: FormData) {
  return {
    bucketName: formData.get("bucketName"),
    busId: formData.get("busId"),
    category: formData.get("category"),
    contentType: formData.get("contentType"),
    costUsd: formData.get("costUsd"),
    description: formData.get("description"),
    fileSizeBytes: formData.get("fileSizeBytes"),
    nextServiceDueDate: formData.get("nextServiceDueDate"),
    nextServiceNotes: formData.get("nextServiceNotes"),
    objectPath: formData.get("objectPath"),
    originalName: formData.get("originalName"),
    provider: formData.get("provider"),
    repairDate: formData.get("repairDate"),
  };
}

export async function createRepairAction(formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = repairSchema.safeParse(normalizeRepairFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revisa los datos de la reparacion y del comprobante.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: bus, error: busError } = await supabase
    .from("buses")
    .select("id")
    .eq("id", parsed.data.busId)
    .maybeSingle();

  if (busError || !bus) {
    return {
      message: "El bus seleccionado no existe o no esta disponible.",
      status: "error",
    };
  }

  const { data, error } = await supabase.rpc("create_repair_with_receipt", {
    _bucket_name: parsed.data.bucketName,
    _bus_id: parsed.data.busId,
    _category: parsed.data.category,
    _content_type: parsed.data.contentType,
    _cost_usd: parsed.data.costUsd.toFixed(2),
    _description: parsed.data.description,
    _file_size_bytes: parsed.data.fileSizeBytes,
    _next_service_due_date: parsed.data.nextServiceDueDate ?? null,
    _next_service_notes: parsed.data.nextServiceNotes ?? null,
    _object_path: parsed.data.objectPath,
    _original_name: parsed.data.originalName,
    _provider: parsed.data.provider,
    _repair_date: parsed.data.repairDate,
    _repair_id: crypto.randomUUID(),
  });

  if (error || !data) {
    return {
      message:
        error?.code === "23514"
          ? "La reparacion requiere un comprobante valido y reglas consistentes."
          : "No pudimos registrar la reparacion.",
      status: "error",
    };
  }

  revalidatePath("/dashboard/repairs");

  return {
    message: "Reparacion registrada correctamente.",
    status: "success",
  };
}
