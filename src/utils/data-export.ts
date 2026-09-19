import { createHash } from "node:crypto";
import {
  FULL_EXPORT_FORMAT, FULL_EXPORT_MAX_DATA_BYTES, FULL_EXPORT_MAX_FILE_BYTES,
  FULL_EXPORT_MAX_ROWS, FULL_EXPORT_PAGE_SIZE, FULL_EXPORT_PROJECT_REF,
  FULL_EXPORT_SCHEMA_VERSION, FULL_EXPORT_TABLES,
  type ExportColumn, type ExportTable,
} from "@/config/data-export";
import { exportSheetsToXlsx, type XlsxCell, type XlsxSheet } from "@/utils/xlsx";

export class DataExportError extends Error {
  constructor(public readonly code: "forbidden" | "read_failed" | "changed" | "limit" | "invalid" | "project") {
    super(code);
  }
}

export const DATA_EXPORT_ERRORS = {
  forbidden: "Esportazione riservata ai super admin attivi.",
  read_failed: "Non e' stato possibile completare la lettura. Riprova tra poco.",
  changed: "I dati sono cambiati durante la lettura. Riprova quando non sono in corso modifiche.",
  limit: "Esportazione oltre i limiti: nessun file parziale generato. Contatta il responsabile tecnico.",
  invalid: "Alcuni dati non sono rappresentabili nel formato Excel. Contatta il responsabile tecnico.",
  project: "Il progetto di esportazione non e' configurato correttamente.",
} as const;

export type ReadExportPage = (table: ExportTable, offset: number, signal: AbortSignal) => Promise<{
  rows: Record<string, unknown>[];
  count: number | null;
}>;

function convertCell(value: unknown, column: ExportColumn): XlsxCell {
  if (value === null) return null;
  if (column.type === "number" || column.type === "money") {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new DataExportError("invalid");
    if (column.type === "number" && !Number.isSafeInteger(value)) throw new DataExportError("invalid");
    if (column.type === "money" && Math.abs(value) > 99_999_999.99) throw new DataExportError("invalid");
    return value;
  }
  if (column.type === "boolean") {
    if (typeof value !== "boolean") throw new DataExportError("invalid");
    return value;
  }
  if (typeof value !== "string") throw new DataExportError("invalid");
  if (column.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new DataExportError("invalid");
  if (column.type === "timestamp") {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
      throw new DataExportError("invalid");
    }
    return value.replace(/\+00:00$/, "Z");
  }
  // Reversible markers distinguish null, empty string and literal backslashes.
  if (value === "") return "\\E";
  return value.startsWith("\\") ? `\\${value}` : value;
}

async function readPass(readPage: ReadExportPage, signal: AbortSignal) {
  const sheets: XlsxSheet[] = [];
  const hash = createHash("sha256");
  let totalRows = 0;
  let dataBytes = 0;

  for (const table of FULL_EXPORT_TABLES) {
    const rows: XlsxCell[][] = [];
    let expected: number | undefined;
    let lastId = "";
    do {
      signal.throwIfAborted();
      const page = await readPage(table, rows.length, signal);
      if (page.count === null || !Number.isSafeInteger(page.count) || page.count < 0) throw new DataExportError("read_failed");
      if (expected !== undefined && page.count !== expected) throw new DataExportError("changed");
      expected = page.count;
      if (totalRows + expected > FULL_EXPORT_MAX_ROWS) throw new DataExportError("limit");
      if (page.rows.length > FULL_EXPORT_PAGE_SIZE || rows.length + page.rows.length > expected) throw new DataExportError("changed");
      if (page.rows.length === 0 && rows.length < expected) throw new DataExportError("read_failed");
      for (const record of page.rows) {
        if (typeof record.id !== "string" || record.id <= lastId) throw new DataExportError("changed");
        lastId = record.id;
        const cells = table.columns.map((column) => convertCell(record[column.key], column));
        const serialized = JSON.stringify(cells);
        dataBytes += Buffer.byteLength(serialized, "utf8");
        if (dataBytes > FULL_EXPORT_MAX_DATA_BYTES) throw new DataExportError("limit");
        hash.update(serialized).update("\n");
        rows.push(cells);
      }
    } while (rows.length < expected);
    totalRows += rows.length;
    hash.update(table.name).update(String(rows.length));
    sheets.push({ name: table.name, columns: table.columns.map((column) => ({
      label: column.key, money: column.type === "money",
    })), rows });
  }
  return { sheets, digest: hash.digest("hex") };
}

export async function collectFullExport(readPage: ReadExportPage, signal: AbortSignal) {
  const first = await readPass(readPage, signal);
  const second = await readPass(readPage, signal);
  if (first.digest !== second.digest) throw new DataExportError("changed");
  // Equal reads detect changes, but are not a PostgreSQL transactional snapshot.
  return first.sheets;
}

export function buildFullExportWorkbook(sheets: XlsxSheet[], startedAt: string, completedAt: string, applicationVersion: string) {
  const readme: XlsxSheet = {
    name: "README", columns: [{ label: "topic" }, { label: "description" }], rows: [
      ["application", "PonteNext Management Portal"],
      ["description", "Dati applicativi, inclusi record archiviati e inattivi. File riservato."],
      ["format", FULL_EXPORT_FORMAT], ["exported_at", completedAt],
      ["backup", "Portabilita' e consultazione: non sostituisce un dump PostgreSQL/Supabase completo."],
      ["consistency", "Letture paginate verificate due volte, non snapshot transazionale. Esportare senza modifiche concorrenti."],
      ["sheets", ["README", "METADATA", ...sheets.map((sheet) => sheet.name)].join(", ")],
      ["auth", "Non contiene Supabase Auth, admin_users, password, sessioni, token, chiavi o configurazioni segrete."],
      ["excluded_column", "email_campaign_recipients.opt_out_token_hash escluso come materiale di sicurezza."],
      ["external_references", "created_by e sent_by conservano UUID admin originali; admin_users non e' incluso."],
      ["import", "Il workbook completo non e' accettato dalla futura funzione import nuovi soci."],
      ["storage", "Conservare su supporto protetto; accesso limitato agli autorizzati. Non inviare pubblicamente o committare in Git."],
      ["types", "UUID/FK e codici come testo; date ISO; timestamp ISO con precisione originale; importi numerici; booleani nativi."],
      ["nulls", "Null = cella assente; stringa vuota = \\E. Backslash iniziale letterale raddoppiato. Nessun valore troncato."],
      ["formula_safety", "Testi sempre inlineStr, mai formule. Prefissi = + - @ (anche dopo spazi) con stile quotePrefix. Nessuna macro o link attivo."],
      ["limits", "Massimo 10000 record, 10 MiB di dati normalizzati, 3 MiB di file; superamento blocca tutto."],
    ],
  };
  const metadata: XlsxSheet = { name: "METADATA", columns: [{ label: "key" }, { label: "value" }], rows: [
    ["export_format_version", FULL_EXPORT_FORMAT], ["exported_at", completedAt],
    ["read_started_at", startedAt], ["application_version", applicationVersion],
    ["schema_migration_version", FULL_EXPORT_SCHEMA_VERSION],
    ["schema_migration_version_source", "manifest_baseline; non interrogato lo schema migration privilegiato a runtime"],
    ["source_project_ref", FULL_EXPORT_PROJECT_REF], ["application_name", "PonteNext Management Portal"],
    ["consistency", "non_transactional_double_read"], ["includes_archived", true],
    ["excluded_columns", "email_campaign_recipients.opt_out_token_hash"],
    ["external_references", "created_by, sent_by: admin_users non esportata"],
    ["null_encoding", "cella assente = null; \\E = stringa vuota; backslash iniziale raddoppiato"],
    ["max_total_records", FULL_EXPORT_MAX_ROWS], ["max_file_bytes", FULL_EXPORT_MAX_FILE_BYTES],
    ["rows.README", readme.rows.length],
    ...sheets.map((sheet): XlsxCell[] => [`rows.${sheet.name}`, sheet.rows.length]),
  ] };
  metadata.rows.push(["rows.METADATA", metadata.rows.length + 1]);
  try {
    return exportSheetsToXlsx([readme, metadata, ...sheets], FULL_EXPORT_MAX_FILE_BYTES);
  } catch (error) {
    if (error instanceof RangeError) throw new DataExportError("limit");
    throw new DataExportError("invalid");
  }
}

export function fullExportFilename(exportedAt: string) {
  return `pontenext-full-export-${exportedAt.slice(0, 10)}-${exportedAt.slice(11, 16).replace(":", "")}.xlsx`;
}
