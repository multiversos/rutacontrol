const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isDateInputValue(value: string | undefined): value is string {
  return Boolean(value && DATE_INPUT_PATTERN.test(value));
}

export function shiftDateInputValue(value: string, days: number) {
  if (!isDateInputValue(value)) {
    return value;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (![year, month, day].every(Number.isFinite)) {
    return value;
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return getLocalDateInputValue(date);
}
