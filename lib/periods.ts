import { getBusinessTodayDate } from "@/lib/formatters";

export type CalendarPeriodView = "month" | "week";

function parseUtcDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`);
}

function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getWeekStart(dateString: string) {
  const date = parseUtcDate(dateString);
  const weekday = date.getUTCDay();
  const offset = (weekday + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);

  return date;
}

export function getWeekEnd(weekStart: Date) {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + 6);

  return date;
}

export function getMonthStart(dateString: string) {
  const date = parseUtcDate(dateString);
  date.setUTCDate(1);

  return date;
}

export function getMonthEnd(monthStart: Date) {
  const date = new Date(monthStart);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);

  return date;
}

function formatShortMonthDay(dateString: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(parseUtcDate(dateString))
    .replace(".", "");
}

function formatDayNumber(dateString: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(parseUtcDate(dateString));
}

function formatShortMonthYear(dateString: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  })
    .format(parseUtcDate(dateString))
    .replace(".", "");
}

export function formatMonthYearLabel(dateString: string) {
  const label = new Intl.DateTimeFormat("es-VE", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(parseUtcDate(dateString));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function buildWeeklyLabel(periodStart: string, periodEnd: string) {
  const startDate = parseUtcDate(periodStart);
  const endDate = parseUtcDate(periodEnd);
  const sameMonth =
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCFullYear() === endDate.getUTCFullYear();
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();

  if (sameMonth) {
    return `Semana del lun ${formatDayNumber(periodStart)} al dom ${formatShortMonthDay(periodEnd)} ${endDate.getUTCFullYear()}`;
  }

  if (sameYear) {
    return `Semana del lun ${formatShortMonthDay(periodStart)} al dom ${formatShortMonthDay(periodEnd)} ${endDate.getUTCFullYear()}`;
  }

  return `Semana del lun ${formatShortMonthYear(periodStart)} al dom ${formatShortMonthYear(periodEnd)}`;
}

export function shiftIsoDate(value: string, days: number) {
  const date = parseUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);

  return toIsoDate(date);
}

export function shiftCalendarAnchor(
  view: CalendarPeriodView,
  anchorDate: string,
  amount: number,
) {
  if (view === "week") {
    return shiftIsoDate(toIsoDate(getWeekStart(anchorDate)), amount * 7);
  }

  const monthStart = getMonthStart(anchorDate);
  monthStart.setUTCMonth(monthStart.getUTCMonth() + amount, 1);
  return toIsoDate(monthStart);
}

export function getCalendarPeriod(
  view: CalendarPeriodView,
  anchorDate?: string,
) {
  const safeAnchor =
    anchorDate && isIsoDateString(anchorDate) ? anchorDate : getBusinessTodayDate();
  const startDate =
    view === "week" ? getWeekStart(safeAnchor) : getMonthStart(safeAnchor);
  const endDate =
    view === "week" ? getWeekEnd(startDate) : getMonthEnd(startDate);
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);

  return {
    anchor: safeAnchor,
    end,
    label: view === "week" ? buildWeeklyLabel(start, end) : formatMonthYearLabel(start),
    previousAnchor: shiftCalendarAnchor(view, start, -1),
    rangeLabel: `${start} al ${end}`,
    start,
    view,
    nextAnchor: shiftCalendarAnchor(view, start, 1),
  };
}

export function isDateInRange(dateString: string, start: string, end: string) {
  return dateString >= start && dateString <= end;
}
