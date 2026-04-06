"use client";

import type { FormEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createRepairAction } from "@/app/dashboard/repairs/actions";
import { BusSelector } from "@/components/bus-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms/action-state";
import { formatFileSize, getBusinessTodayDate } from "@/lib/formatters";
import { initialFormState } from "@/lib/forms/action-state";
import { createClient } from "@/lib/supabase/client";

type RepairBusOption = {
  code: string;
  id: string;
  photoUrl?: string | null;
  plate: string;
};

type RepairFormProps = {
  buses: RepairBusOption[];
  currentUserId: string;
};

const ACCEPTED_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export function RepairForm({ buses, currentUserId }: RepairFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<FormState>(initialFormState);
  const [busId, setBusId] = useState("");
  const [fileLabel, setFileLabel] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setState({
        fieldErrors: {
          receiptFile: ["Adjunta un comprobante real antes de registrar la reparacion."],
        },
        message: "El comprobante es obligatorio.",
        status: "error",
      });
      return;
    }

    if (!ACCEPTED_RECEIPT_TYPES.has(file.type)) {
      setState({
        fieldErrors: {
          receiptFile: ["Solo se aceptan PDF, JPG, PNG o WEBP."],
        },
        message: "El comprobante debe usar un formato permitido.",
        status: "error",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setState({
        fieldErrors: {
          receiptFile: ["El comprobante supera el limite de 10 MB."],
        },
        message: "Reduce el tamano del archivo antes de subirlo.",
        status: "error",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const busId = String(formData.get("busId") ?? "").trim();

    if (!busId) {
      setState({
        fieldErrors: {
          busId: ["Selecciona un bus antes de adjuntar el comprobante."],
        },
        message: "Selecciona el bus para generar la ruta segura del archivo.",
        status: "error",
      });
      return;
    }

    const objectPath = `${currentUserId}/${busId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const bucketName = "repair-receipts";
    const supabase = createClient();
    setIsUploading(true);
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(objectPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setIsUploading(false);
      setState({
        message: "No pudimos subir el comprobante a Storage.",
        status: "error",
      });
      return;
    }

    formData.set("bucketName", bucketName);
    formData.set("contentType", file.type);
    formData.set("fileSizeBytes", String(file.size));
    formData.set("objectPath", objectPath);
    formData.set("originalName", file.name);

    startTransition(() => {
      void createRepairAction(formData)
        .then(async (result) => {
          setIsUploading(false);
          if (result.status !== "success") {
            await supabase.storage.from(bucketName).remove([objectPath]);
            setState(result);
            return;
          }

          setState(result);
          formRef.current?.reset();
          setBusId("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setFileLabel("");
          router.refresh();
        })
        .catch(async () => {
          setIsUploading(false);
          await supabase.storage.from(bucketName).remove([objectPath]);
          setState({
            message: "No pudimos registrar la reparacion despues de subir el comprobante.",
            status: "error",
          });
        });
    });
  }

  return (
    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="repair-bus">Bus</Label>
        <BusSelector
          buses={buses}
          emptyLabel="No hay buses activos disponibles para registrar reparaciones."
          helperText="Selecciona la unidad correcta usando foto, codigo y placa antes de subir el comprobante."
          id="repair-bus"
          onChange={setBusId}
          value={busId}
        />
        {state.fieldErrors?.busId?.[0] ? (
          <p className="text-sm text-destructive">{state.fieldErrors.busId[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(180px,0.55fr)_minmax(0,1.45fr)]">
        <div className="space-y-2">
          <Label htmlFor="repair-date">Fecha de reparacion</Label>
          <Input
            defaultValue={getBusinessTodayDate()}
            id="repair-date"
            name="repairDate"
            type="date"
          />
          {state.fieldErrors?.repairDate?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.repairDate[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="repair-provider">Proveedor o taller</Label>
          <Input
            className="w-full"
            id="repair-provider"
            name="provider"
            placeholder="Ej. Taller Los Andes"
          />
          {state.fieldErrors?.provider?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.provider[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="repair-category">Categoria</Label>
          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-white/90 px-4 py-2 text-sm"
            defaultValue="mechanical"
            id="repair-category"
            name="category"
          >
            <option value="mechanical">Mecanica</option>
            <option value="electrical">Electrica</option>
            <option value="bodywork">Carroceria</option>
            <option value="tires">Cauchos</option>
            <option value="oil_change">Cambio de aceite</option>
            <option value="inspection">Inspeccion</option>
            <option value="other">Otra</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repair-cost">Costo (USD)</Label>
          <Input
            id="repair-cost"
            min="0"
            name="costUsd"
            placeholder="85.00"
            step="0.01"
            type="number"
          />
          {state.fieldErrors?.costUsd?.[0] ? (
            <p className="text-sm text-destructive">{state.fieldErrors.costUsd[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repair-description">Descripcion</Label>
        <Textarea
          className="min-h-[144px] resize-y"
          id="repair-description"
          name="description"
          placeholder="Describe el trabajo realizado y las piezas involucradas."
        />
        {state.fieldErrors?.description?.[0] ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(180px,0.55fr)_minmax(0,1.45fr)]">
        <div className="space-y-2">
          <Label htmlFor="repair-next-service-date">Proximo servicio sugerido</Label>
          <Input
            id="repair-next-service-date"
            name="nextServiceDueDate"
            type="date"
          />
          {state.fieldErrors?.nextServiceDueDate?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.nextServiceDueDate[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="repair-receipt">Comprobante</Label>
          <Input
            accept=".pdf,image/jpeg,image/png,image/webp"
            id="repair-receipt"
            name="receiptFile"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              setFileLabel(
                selectedFile
                  ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                  : "",
              );
            }}
            ref={fileInputRef}
            type="file"
          />
          {fileLabel ? (
            <p className="text-xs text-muted-foreground">{fileLabel}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Obligatorio. Formatos permitidos: PDF, JPG, PNG o WEBP.
            </p>
          )}
          {state.fieldErrors?.receiptFile?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.receiptFile[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repair-next-service-notes">Notas del proximo servicio</Label>
        <Textarea
          className="min-h-[132px] resize-y"
          id="repair-next-service-notes"
          name="nextServiceNotes"
          placeholder="Ej. Revisar frenos y cambio preventivo en 30 dias."
        />
        {state.fieldErrors?.nextServiceNotes?.[0] ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.nextServiceNotes[0]}
          </p>
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

      <Button className="w-full" disabled={isPending || isUploading} type="submit">
        {isUploading || isPending ? "Subiendo comprobante..." : "Registrar reparacion"}
      </Button>
    </form>
  );
}
