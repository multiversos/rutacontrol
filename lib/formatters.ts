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
