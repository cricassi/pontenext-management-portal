export function parseCurrencyInput(value: string) {
  const normalizedValue = value.replace(",", ".").trim();
  const parsedValue = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    return Number.NaN;
  }

  return Math.round(parsedValue * 100) / 100;
}

export function formatCurrency(value: number | string | null | undefined) {
  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (numericValue === null || numericValue === undefined) {
    return "-";
  }

  if (Number.isNaN(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(numericValue);
}
