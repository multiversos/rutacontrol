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
  const formatter = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Caracas",
    year: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
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

export function shiftDateString(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}
