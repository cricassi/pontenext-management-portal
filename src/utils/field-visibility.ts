import { FIELD_VISIBILITY_REGISTRY, VISIBILITY_SCREEN_KEYS, isVisibilityScreenKey, type VisibilityScreenKey } from "@/config/field-visibility-registry";
import type { FieldVisibilityRow, VisibilitySnapshot } from "@/types/field-visibility";

export class FieldVisibilityError extends Error {
  constructor(public readonly code: "forbidden" | "invalid" | "not_integrated" | "unavailable" | "conflict") {
    const messages = {
      forbidden: "Solo un super_admin attivo può modificare la configurazione.",
      invalid: "Configurazione non valida. Ricarica la pagina e verifica i campi.",
      not_integrated: "Configurazione non ancora attiva per questa schermata. Nessuna modifica salvata.",
      unavailable: "Configurazione non disponibile. Nessuna modifica confermata; ricarica e verifica prima di riprovare.",
      conflict: "Configurazione cambiata durante il salvataggio. Ricarica la pagina prima di riprovare.",
    };
    super(messages[code]);
  }
}

export function canonicalVisibilityKeys(keys: readonly string[]): VisibilityScreenKey[] {
  if (keys.some((key) => !isVisibilityScreenKey(key))) throw new FieldVisibilityError("invalid");
  return [...new Set(keys)].sort() as VisibilityScreenKey[];
}

export function resolveVisibilityRows(keys: readonly VisibilityScreenKey[], rows: readonly FieldVisibilityRow[]): VisibilitySnapshot {
  let invalid = false;
  const byPair = new Map<string, FieldVisibilityRow>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    if (row.archived_at !== null) continue;
    const field = isVisibilityScreenKey(row.screen_key) && keys.includes(row.screen_key)
      ? FIELD_VISIBILITY_REGISTRY[row.screen_key].fields.find((candidate) => candidate.fieldKey === row.field_key)
      : undefined;
    if (!field?.configurable || typeof row.is_visible !== "boolean" || !Number.isFinite(Date.parse(row.updated_at))) {
      invalid = true;
      continue;
    }
    const pair = `${row.screen_key}:${row.field_key}`;
    if (byPair.has(pair)) {
      invalid = true;
      duplicates.add(pair);
    }
    byPair.set(pair, row);
  }
  for (const pair of duplicates) byPair.delete(pair);
  return {
    warning: invalid ? "invalid_overrides" : null,
    screens: VISIBILITY_SCREEN_KEYS.filter((key) => keys.includes(key)).map((screenKey) => {
      const definition = FIELD_VISIBILITY_REGISTRY[screenKey];
      let updatedAt: string | null = null;
      const fields = definition.fields.map((field) => {
        const row = byPair.get(`${screenKey}:${field.fieldKey}`);
        if (row && (!updatedAt || Date.parse(row.updated_at) > Date.parse(updatedAt))) updatedAt = row.updated_at;
        return { ...field, isVisible: row?.is_visible ?? field.defaultVisible, hasOverride: !!row };
      });
      return { ...definition, screenKey, fields, updatedAt };
    }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateVisibilitySave(input: unknown): { screenKey: VisibilityScreenKey; values: Record<string, boolean> } {
  if (!isRecord(input) || Object.keys(input).length !== 2 || typeof input.screenKey !== "string" || !isVisibilityScreenKey(input.screenKey) || !isRecord(input.values)) {
    throw new FieldVisibilityError("invalid");
  }
  const allowed = FIELD_VISIBILITY_REGISTRY[input.screenKey].fields.filter((field) => field.configurable);
  const values = input.values;
  if (!allowed.length || Object.keys(values).length !== allowed.length || allowed.some((field) => !Object.hasOwn(values, field.fieldKey) || typeof values[field.fieldKey] !== "boolean")) {
    throw new FieldVisibilityError("invalid");
  }
  return { screenKey: input.screenKey, values: Object.fromEntries(allowed.map((field) => [field.fieldKey, values[field.fieldKey] as boolean])) };
}

export function assertVisibilityIntegrated(screenKey: VisibilityScreenKey) {
  if (!FIELD_VISIBILITY_REGISTRY[screenKey].integrated) throw new FieldVisibilityError("not_integrated");
}

export function prepareVisibilityUpsert(
  screenKey: VisibilityScreenKey,
  values: Record<string, boolean>,
  existing: readonly FieldVisibilityRow[],
  adminId: string,
  now: string,
  newId: () => string,
) {
  // IDs, author and timestamps come only from the server and a fresh DB read.
  const active = new Map(existing.map((row) => [row.field_key, row]));
  if (active.size !== existing.length || existing.some((row) => row.screen_key !== screenKey || row.archived_at !== null || !Object.hasOwn(values, row.field_key))) {
    throw new FieldVisibilityError("conflict");
  }
  return Object.entries(values).map(([fieldKey, isVisible]) => ({
    id: active.get(fieldKey)?.id ?? newId(),
    screen_key: screenKey,
    field_key: fieldKey,
    is_visible: isVisible,
    updated_by: adminId,
    created_at: active.get(fieldKey)?.created_at ?? now,
    archived_at: null,
  }));
}
