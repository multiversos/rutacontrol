import { getLocalDateInputValue, shiftDateInputValue } from "@/lib/dates";

export function formatCurrency(value: number | string, currency = "USD") {
  const amount =
    typeof value === "number"
      ? value
      : Number.parseFloat(value === "" ? "0" : value);

  return new Intl.NumberFormat("es-VE", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value: number | string, digits = 2) {
  const amount =
    typeof value === "number"
      ? value
      : Number.parseFloat(value === "" ? "0" : value);

  return new Intl.NumberFormat("es-VE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function isNonZeroAmount(value: number | string) {
  const amount =
    typeof value === "number"
      ? value
      : Number.parseFloat(value === "" ? "0" : value);

  return Math.abs(amount) >= 0.01;
}

export function getBusinessTodayDate() {
  return getLocalDateInputValue();
}

function parseDateString(value: string) {
  return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00Z`);
}

export function formatDateLabel(value: string) {
  const date = parseDateString(value);

  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeZone: value.includes("T") ? "America/Caracas" : "UTC",
  }).format(date);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  }).format(new Date(value));
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${formatNumber(size, unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function shiftDateString(value: string, days: number) {
  return shiftDateInputValue(value, days);
}
