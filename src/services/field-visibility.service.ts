import "server-only";
import { cache } from "react";
import { FIELD_VISIBILITY_REGISTRY, VISIBILITY_SCREEN_KEYS, isVisibilityScreenKey, type VisibilityScreenKey } from "@/config/field-visibility-registry";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import type { FieldVisibilityRow, VisibilitySnapshot } from "@/types/field-visibility";
import { assertVisibilityIntegrated, canonicalVisibilityKeys, FieldVisibilityError, resolveVisibilityRows, validateVisibilitySave } from "@/utils/field-visibility";

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

export async function getFreshFieldVisibility(screenKey: VisibilityScreenKey) {
  await requireActiveAdmin();
  const snapshot = resolveVisibilityRows([screenKey], await readOverrides([screenKey]));
  if (snapshot.warning) throw new FieldVisibilityError("unavailable");
  return snapshot.screens[0];
}

async function requireVisibilitySuperAdmin() {
  const { admin } = await requireActiveAdmin();
  if (admin.role !== "super_admin" || admin.status !== "active") throw new FieldVisibilityError("forbidden");
  return admin;
}

export async function saveFieldVisibility(input: unknown, expected: unknown) {
  await requireVisibilitySuperAdmin();
  const { screenKey, values } = validateVisibilitySave(input);
  const baseline = validateVisibilitySave({ screenKey, values: expected }).values;
  assertVisibilityIntegrated(screenKey);
  await writeVisibility(screenKey, values, baseline, false);
}

export async function resetFieldVisibility(screenKey: unknown, expected: unknown) {
  await requireVisibilitySuperAdmin();
  if (typeof screenKey !== "string" || !isVisibilityScreenKey(screenKey)) throw new FieldVisibilityError("invalid");
  assertVisibilityIntegrated(screenKey);
  const baseline = validateVisibilitySave({ screenKey, values: expected }).values;
  await writeVisibility(screenKey, {}, baseline, true);
}

async function writeVisibility(screenKey: VisibilityScreenKey, values: Record<string, boolean>, expected: Record<string, boolean>, reset: boolean) {
  try {
    // Fresh read detects unavailable/invalid configuration; the RPC checks concurrency atomically.
    await getFreshFieldVisibility(screenKey);
    const supabase = await getSupabaseServerClientOrThrow();
    const { error } = await supabase.rpc("set_member_field_visibility", {
      p_screen_key: screenKey, p_values: values, p_expected: expected, p_reset: reset,
    });
    if (error) throw new FieldVisibilityError(error.code === "40001" ? "conflict" : error.code === "42501" ? "forbidden" : "unavailable");
  } catch (error) {
    if (error instanceof FieldVisibilityError) throw error;
    throw new FieldVisibilityError("unavailable");
  }
}
