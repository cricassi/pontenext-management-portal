import "server-only";
import { randomUUID } from "node:crypto";
import { cache } from "react";
import { FIELD_VISIBILITY_REGISTRY, VISIBILITY_SCREEN_KEYS, isVisibilityScreenKey, type VisibilityScreenKey } from "@/config/field-visibility-registry";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import type { FieldVisibilityRow, VisibilitySnapshot } from "@/types/field-visibility";
import { assertVisibilityIntegrated, canonicalVisibilityKeys, FieldVisibilityError, prepareVisibilityUpsert, resolveVisibilityRows, validateVisibilitySave } from "@/utils/field-visibility";

const COLUMNS = "id,screen_key,field_key,is_visible,updated_by,created_at,updated_at,archived_at";

async function readOverrides(keys: readonly VisibilityScreenKey[]) {
  if (!keys.length) return [];
  const supabase = await getSupabaseServerClientOrThrow();
  const maximum = keys.reduce((total, key) => total + FIELD_VISIBILITY_REGISTRY[key].fields.filter((field) => field.configurable).length, 0);
  const { data, error, count } = await supabase.from("ui_field_visibility")
    .select(COLUMNS, { count: "exact" }).in("screen_key", [...keys]).is("archived_at", null)
    .order("screen_key").order("field_key").limit(maximum + 1).returns<FieldVisibilityRow[]>();
  if (error || !data || count !== data.length || data.length > maximum) throw new FieldVisibilityError("unavailable");
  return data;
}

// React cache is request/render scoped. Canonical strings avoid array-identity misses.
const loadVisibility = cache(async (canonicalKeys: string): Promise<VisibilitySnapshot> => {
  const keys = canonicalKeys ? canonicalVisibilityKeys(canonicalKeys.split(",")) : [];
  try {
    return resolveVisibilityRows(keys, await readOverrides(keys));
  } catch {
    return { ...resolveVisibilityRows(keys, []), warning: "unavailable" };
  }
});

export async function getFieldVisibility(keys: readonly VisibilityScreenKey[] = VISIBILITY_SCREEN_KEYS) {
  await requireActiveAdmin();
  return loadVisibility(canonicalVisibilityKeys(keys).join(","));
}

async function requireVisibilitySuperAdmin() {
  const { admin } = await requireActiveAdmin();
  if (admin.role !== "super_admin" || admin.status !== "active") throw new FieldVisibilityError("forbidden");
  return admin;
}

export async function saveFieldVisibility(input: unknown) {
  const admin = await requireVisibilitySuperAdmin();
  const { screenKey, values } = validateVisibilitySave(input);
  assertVisibilityIntegrated(screenKey);
  try {
    // Never reuse the render cache before a mutation.
    const existing = await readOverrides([screenKey]);
    if (resolveVisibilityRows([screenKey], existing).warning) throw new FieldVisibilityError("conflict");
    const rows = prepareVisibilityUpsert(screenKey, values, existing, admin.id, new Date().toISOString(), randomUUID);
    const supabase = await getSupabaseServerClientOrThrow();
    const { error } = await supabase.from("ui_field_visibility").upsert(rows, { onConflict: "id" });
    if (error) throw new FieldVisibilityError(error.code === "23505" || error.code === "42501" ? "conflict" : "unavailable");
  } catch (error) {
    if (error instanceof FieldVisibilityError) throw error;
    throw new FieldVisibilityError("unavailable");
  }
}

export async function resetFieldVisibility(screenKey: unknown) {
  const admin = await requireVisibilitySuperAdmin();
  if (typeof screenKey !== "string" || !isVisibilityScreenKey(screenKey)) throw new FieldVisibilityError("invalid");
  assertVisibilityIntegrated(screenKey);
  try {
    const supabase = await getSupabaseServerClientOrThrow();
    const { error } = await supabase.from("ui_field_visibility")
      .update({ archived_at: new Date().toISOString(), updated_by: admin.id })
      .eq("screen_key", screenKey).is("archived_at", null);
    if (error) throw new FieldVisibilityError("unavailable");
  } catch (error) {
    if (error instanceof FieldVisibilityError) throw error;
    throw new FieldVisibilityError("unavailable");
  }
}
