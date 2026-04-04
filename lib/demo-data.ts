import type { Json, Tables } from "@/lib/supabase/database.types";

const DEMO_BUS_CODE_PATTERN =
  /^(B-0[1-3]|QA\d[0-9A-Z-]*|QF\d[0-9A-Z-]*|S2[0-9A-Z-]*|S3[0-9A-Z-]*|FIX\d+)$/i;
const DEMO_PLATE_PATTERN =
  /^(AB123CD|EF456GH|IJ789KL|QAB\d+|QAI\d+|QFA\d+|QFI\d+|QA\d+|FX\d+)$/i;
const DEMO_TEXT_PATTERN =
  /(qa|debug|demo|sample|sprint|mt-\d+|fix\d+|seed\.sql)/i;

function isJsonObject(value: Json | null): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDemoText(value?: string | null) {
  if (!value) {
    return false;
  }

  return DEMO_TEXT_PATTERN.test(value);
}

export function isDemoBusCode(code?: string | null) {
  if (!code) {
    return false;
  }

  return DEMO_BUS_CODE_PATTERN.test(code.trim().toUpperCase());
}

export function isDemoPlate(plate?: string | null) {
  if (!plate) {
    return false;
  }

  return DEMO_PLATE_PATTERN.test(plate.trim().toUpperCase());
}

export function isDemoBus(
  bus:
    | Pick<Tables<"buses">, "code" | "plate">
    | { code: string; plate?: string | null }
    | null
    | undefined,
) {
  if (!bus) {
    return false;
  }

  return isDemoBusCode(bus.code) || isDemoPlate(bus.plate);
}

export function isOperationalRecordDate(recordDate?: string | null, today?: string | null) {
  if (!recordDate || !today) {
    return true;
  }

  return recordDate <= today;
}

export function getAuditRecordDate(value: Json | null) {
  if (!isJsonObject(value)) {
    return undefined;
  }

  return typeof value.record_date === "string" ? value.record_date : undefined;
}

export function getAuditBusId(value: Json | null) {
  if (!isJsonObject(value)) {
    return undefined;
  }

  return typeof value.bus_id === "string" ? value.bus_id : undefined;
}

export function isDemoDebtRecord(debt: Pick<Tables<"debts">, "creditor" | "description">) {
  return isDemoText(`${debt.creditor} ${debt.description}`);
}

export function isArchivedCleanupAlert(metadata: Json) {
  return isJsonObject(metadata) && metadata.cleanup_archived === true;
}
