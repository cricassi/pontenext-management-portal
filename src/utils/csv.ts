import type { ReportColumn, ReportRow } from "@/types/report";

const CSV_FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"] as const;

function neutralizeFormulaValue(value: string) {
  return CSV_FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix))
    ? `'${value}`
    : value;
}

function normalizeCsvValue(value: string) {
  return neutralizeFormulaValue(value.replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
}

function stringifyCell(value: ReportRow[string]) {
  if (value === null || value === undefined) {
    return "";
  }

  return normalizeCsvValue(String(value));
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportRowsToCsv(columns: ReportColumn[], rows: ReportRow[]) {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) => escapeCsvCell(stringifyCell(row[column.key])))
      .join(","),
  );

  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}
