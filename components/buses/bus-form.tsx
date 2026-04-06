"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveBusAction, saveBusPhotoAction } from "@/app/dashboard/buses/actions";
import { BusPhoto } from "@/components/buses/bus-photo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { initialFormState } from "@/lib/forms/action-state";
import {
  buildBusPhotoObjectPath,
  BUS_PHOTO_ACCEPTED_TYPES,
  BUS_PHOTO_BUCKET,
  BUS_PHOTO_MAX_SIZE_BYTES,
} from "@/lib/bus-photo";
import { OPERATIONAL_ROUTE } from "@/lib/operational-route";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type BusFormProps = {
  bus?: Tables<"buses"> | null;
  photoUrl?: string | null;
};

const ACCEPTED_PHOTO_TYPES = new Set<string>(BUS_PHOTO_ACCEPTED_TYPES);

function isPhotoValid(file: File) {
  if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
    return "Solo se aceptan JPG, PNG o WEBP.";
  }

  if (file.size > BUS_PHOTO_MAX_SIZE_BYTES) {
    return "La foto supera el limite de 5 MB.";
  }

  return null;
}

export function BusForm({ bus, photoUrl }: BusFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [fileLabel, setFileLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(initialFormState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const selectedFile = fileInputRef.current?.files?.[0];
    const photoValidationError = selectedFile ? isPhotoValid(selectedFile) : null;

    if (photoValidationError) {
      setState({
        fieldErrors: {
          photoFile: [photoValidationError],
        },
        message: "Revisa la foto del bus antes de guardar.",
        status: "error",
      });
      return;
    }

    startTransition(() => {
      void saveBusAction(initialFormState, formData)
        .then(async (result) => {
          if (result.status !== "success") {
            setState(result);
            return;
          }

          const resolvedBusId = result.entityId ?? bus?.id ?? "";

          if (selectedFile && resolvedBusId) {
            const supabase = createClient();
            const objectPath = buildBusPhotoObjectPath(
              resolvedBusId,
              selectedFile.name,
            );
            try {
              setIsUploading(true);
              const { error: uploadError } = await supabase.storage
                .from(BUS_PHOTO_BUCKET)
                .upload(objectPath, selectedFile, {
                  cacheControl: "3600",
                  contentType: selectedFile.type,
                  upsert: false,
                });

              if (uploadError) {
                setIsUploading(false);
                setState({
                  entityId: resolvedBusId,
                  message:
                    "Guardamos el bus, pero no pudimos subir la foto. Intenta otra vez con JPG, PNG o WEBP menor a 5 MB.",
                  status: "error",
                });
                router.refresh();
                return;
              }

              const photoResult = await saveBusPhotoAction({
                busId: resolvedBusId,
                photoPath: objectPath,
              });

              if (photoResult.status !== "success") {
                setIsUploading(false);
                await supabase.storage.from(BUS_PHOTO_BUCKET).remove([objectPath]);
                setState({
                  entityId: resolvedBusId,
                  message:
                    photoResult.message ??
                    "Guardamos el bus, pero no pudimos asociar la foto.",
                  status: "error",
                });
                router.refresh();
                return;
              }

              setIsUploading(false);
            } catch {
              setState({
                entityId: resolvedBusId,
                message:
                  "Guardamos el bus, pero ocurrio un problema al subir o asociar la foto. La imagen temporal fue descartada.",
                status: "error",
              });
              await supabase.storage.from(BUS_PHOTO_BUCKET).remove([objectPath]);
              setIsUploading(false);
              router.refresh();
              return;
            }
          }

          setState({
            entityId: resolvedBusId,
            message:
              selectedFile
                ? "Bus y foto guardados correctamente."
                : result.message ?? "Bus guardado correctamente.",
            status: "success",
          });

          if (!bus && resolvedBusId) {
            router.push(`/dashboard/buses?edit=${resolvedBusId}`);
          } else {
            router.refresh();
          }

          if (!bus) {
            formRef.current?.reset();
          }

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setFileLabel("");
        })
        .catch(() => {
          setIsUploading(false);
          setState({
            message: "No pudimos guardar el bus en este momento.",
            status: "error",
          });
        });
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} ref={formRef}>
      <input name="busId" type="hidden" value={bus?.id ?? ""} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bus-code">Codigo interno</Label>
          <Input
            defaultValue={bus?.code ?? ""}
            id="bus-code"
            name="code"
            placeholder="B-09"
            style={{ textTransform: "uppercase" }}
          />
          {state.fieldErrors?.code?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.code[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bus-plate">Placa</Label>
          <Input
            defaultValue={bus?.plate ?? ""}
            id="bus-plate"
            name="plate"
            placeholder="AB123CD"
            style={{ textTransform: "uppercase" }}
          />
          {state.fieldErrors?.plate?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.plate[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="space-y-2">
          <Label>Linea operativa</Label>
          <div className="rounded-3xl border border-border/80 bg-muted/40 px-4 py-4 text-sm">
            <p className="font-semibold text-foreground">{OPERATIONAL_ROUTE.label}</p>
            <p className="mt-1 text-muted-foreground">
              Se asigna automaticamente al guardar la unidad. Ya no necesitas escoger
              rutas manualmente.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white/80 p-4">
          <div className="flex items-start gap-4">
            <BusPhoto
              code={bus?.code ?? "BUS"}
              photoUrl={photoUrl ?? null}
              size="md"
            />
            <div className="min-w-0 space-y-2">
              <Label htmlFor="bus-photo">Foto del bus</Label>
              <Input
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                id="bus-photo"
                name="photoFile"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];
                  setFileLabel(selectedFile ? selectedFile.name : "");
                }}
                ref={fileInputRef}
                type="file"
              />
              {fileLabel ? (
                <p className="text-xs text-muted-foreground">{fileLabel}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {bus
                    ? "Puedes subir o reemplazar la foto administrativa de la unidad."
                    : "Tambien puedes adjuntar una foto al crear la unidad."}
                </p>
              )}
              {state.fieldErrors?.photoFile?.[0] ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.photoFile[0]}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bus-status">Estado</Label>
        <Select defaultValue={bus?.status ?? "active"} id="bus-status" name="status">
          <option value="active">Activo</option>
          <option value="maintenance">Mantenimiento</option>
          <option value="inactive">Inactivo</option>
        </Select>
        {state.fieldErrors?.status?.[0] ? (
          <p className="text-sm text-destructive">{state.fieldErrors.status[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={isPending || isUploading} type="submit">
          {isUploading
            ? "Subiendo foto..."
            : isPending
              ? "Guardando..."
              : bus
                ? "Guardar cambios"
                : "Crear bus"}
        </Button>
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/dashboard/buses"
        >
          {bus ? "Cancelar edicion" : "Limpiar"}
        </Link>
      </div>
    </form>
  );
}
