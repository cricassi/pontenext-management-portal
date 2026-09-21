import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { loadModule } from "./load-module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FIELD_VISIBILITY_REGISTRY, VISIBILITY_SCREEN_KEYS } from "@/config/field-visibility-registry";
import type { FieldVisibilityRow } from "@/types/field-visibility";
import { assertVisibilityIntegrated, canonicalVisibilityKeys, FieldVisibilityError, prepareVisibilityUpsert, resolveVisibilityRows, validateVisibilitySave } from "@/utils/field-visibility";

const now = "2026-09-21T20:00:00Z";
const row = (overrides: Partial<FieldVisibilityRow> = {}): FieldVisibilityRow => ({ id: "policy-id", screen_key: "members.edit", field_key: "email", is_visible: false, updated_by: "admin-id", created_at: now, updated_at: now, archived_at: null, ...overrides });
const saveInput = () => ({ screenKey: "members.edit", values: Object.fromEntries(FIELD_VISIBILITY_REGISTRY["members.edit"].fields.filter((field) => field.configurable).map((field) => [field.fieldKey, true])) });
const errorCode = (code: string) => (error: unknown) => error instanceof FieldVisibilityError && error.code === code;

test("registry: only four member screens integrated; optional pairs still match 015 exactly", () => {
  const pairs: string[] = [];
  assert.equal(VISIBILITY_SCREEN_KEYS.length, 42);
  for (const [key, screen] of Object.entries(FIELD_VISIBILITY_REGISTRY)) {
    assert.equal(screen.integrated, ["members.list", "members.create", "members.edit", "members.detail"].includes(key));
    assert.equal(new Set(screen.fields.map((field) => field.fieldKey)).size, screen.fields.length);
    for (const field of screen.fields) {
      assert.equal(field.defaultVisible, true);
      assert.ok(field.formKey && field.description && field.label);
      if (field.configurable) {
        assert.equal(field.isRequired, false);
        assert.doesNotMatch(field.fieldKey, /^(id|created_at|updated_at|archived_at|created_by|updated_by)$/);
        pairs.push(`${key}:${field.fieldKey}`);
      }
    }
  }
  const sql = readFileSync("database/migrations/015_ui_field_visibility.sql", "utf8");
  const sqlPairs = [...sql.matchAll(/\('([a-z_]+\.[a-z_]+)', '([a-z_]+)'\)/g)].map((match) => `${match[1]}:${match[2]}`);
  assert.deepEqual(sqlPairs.sort(), pairs.sort());
  assert.equal(new Set(sqlPairs).size, 116);
  assert.doesNotMatch(sql, /(?:^|;)\s*(?:update\s+|delete\s+from|truncate\s|drop\s|insert\s+into)/im);
  assert.deepEqual([...sql.matchAll(/alter table ([\w.]+)/g)].map((match) => match[1]), ["public.ui_field_visibility"]);
});

test("016 contains only transaction boundaries and configuration policy/grant changes", () => {
  const sql = readFileSync("database/migrations/016_lock_ui_field_visibility_foundation.sql", "utf8");
  const statements = sql.replace(/--[^\n]*/g, "").split(";").map((statement) => statement.trim().replace(/\s+/g, " ")).filter(Boolean);
  assert.deepEqual(statements, [
    "begin",
    "drop policy if exists ui_field_visibility_insert_super_admin on public.ui_field_visibility",
    "drop policy if exists ui_field_visibility_update_super_admin on public.ui_field_visibility",
    "revoke insert, update, delete, truncate, references, trigger on table public.ui_field_visibility from authenticated",
    "revoke all on table public.ui_field_visibility from public, anon",
    "grant select on table public.ui_field_visibility to authenticated",
    "commit",
  ]);
});

test("default, active override, archive, required and malformed fallback", () => {
  const resolved = resolveVisibilityRows(["members.edit"], [row()]);
  assert.equal(resolved.screens[0].fields.find((field) => field.fieldKey === "email")!.isVisible, false);
  assert.equal(resolved.screens[0].fields.find((field) => field.fieldKey === "phone")!.hasOverride, false);
  assert.equal(resolved.warning, null);
  assert.equal(resolveVisibilityRows(["members.edit"], [row({ archived_at: now })]).screens[0].fields.every((field) => field.isVisible), true);
  for (const bad of [row({ field_key: "first_name" }), row({ field_key: "arbitrary" }), row({ is_visible: "false" as unknown as boolean }), row({ updated_at: "bad" })]) {
    const result = resolveVisibilityRows(["members.edit"], [bad]);
    assert.equal(result.warning, "invalid_overrides");
    assert.ok(result.screens[0].fields.every((field) => field.isVisible));
  }
  const duplicate = resolveVisibilityRows(["members.edit"], [row(), row({ id: "another" })]);
  assert.equal(duplicate.warning, "invalid_overrides");
  assert.ok(duplicate.screens[0].fields.every((field) => field.isVisible));
});

test("save rejects missing, unknown, required fields, truthy strings and technical metadata", () => {
  assert.deepEqual(validateVisibilitySave(saveInput()), saveInput());
  for (const input of [null, [], {}, { ...saveInput(), updated_by: "forged" }, { screenKey: "__proto__", values: {} }, { ...saveInput(), values: { email: false } }, { ...saveInput(), values: { ...saveInput().values, first_name: false } }, { ...saveInput(), values: { ...saveInput().values, email: "false" } }]) {
    assert.throws(() => validateVisibilitySave(input), errorCode("invalid"));
  }
  for (const key of VISIBILITY_SCREEN_KEYS) {
    if (FIELD_VISIBILITY_REGISTRY[key].integrated) assert.doesNotThrow(() => assertVisibilityIntegrated(key));
    else assert.throws(() => assertVisibilityIntegrated(key), errorCode("not_integrated"));
  }
  assert.deepEqual(canonicalVisibilityKeys(["members.edit", "members.create", "members.edit"]), ["members.create", "members.edit"]);
  assert.throws(() => canonicalVisibilityKeys(["toString"]), errorCode("invalid"));
});

test("bulk rows preserve creation, use server author/IDs and explicit true/false", () => {
  const rows = prepareVisibilityUpsert("members.edit", { email: false, phone: true }, [row()], "verified-admin", "2026-09-22T00:00:00Z", () => "new-server-uuid");
  assert.deepEqual(rows.map((value) => [value.id, value.created_at, value.is_visible, value.updated_by]), [["policy-id", now, false, "verified-admin"], ["new-server-uuid", "2026-09-22T00:00:00Z", true, "verified-admin"]]);
  for (const existing of [[row({ archived_at: now })], [row(), row()], [row({ screen_key: "sponsors.edit" })]]) {
    assert.throws(() => prepareVisibilityUpsert("members.edit", { email: true }, existing, "admin", now, () => "new"), errorCode("conflict"));
  }
});

type Service = typeof import("@/services/field-visibility.service");
function serviceFixture(options: { role?: string; denied?: boolean; readError?: boolean; truncated?: boolean; integrated?: boolean; writeError?: string } = {}) {
  const events: string[] = [];
  let written: unknown;
  const builder = {
    select: () => { events.push("select"); return builder; },
    in: (_column: string, keys: string[]) => { events.push(`keys:${keys.join(",")}`); return builder; },
    is: () => builder, eq: () => builder, order: () => builder, limit: () => builder,
    returns: async () => ({ data: options.readError ? null : [row()], count: options.truncated ? 2 : 1, error: options.readError ? { message: "secret-db-error" } : null }),
    upsert: async (rows: unknown, conflict: unknown) => { events.push("upsert"); written = { rows, conflict }; return { error: options.writeError ? { code: options.writeError, message: "secret" } : null }; },
    update: (values: unknown) => { events.push("update"); written = values; return builder; },
  };
  const memo = new Map<string, unknown>();
  const utils = require("@/utils/field-visibility");
  const service = loadModule<Service>("src/services/field-visibility.service.ts", {
    "server-only": {},
    react: { cache: (fn: (key: string) => unknown) => (key: string) => { if (!memo.has(key)) memo.set(key, fn(key)); return memo.get(key); } },
    "@/services/admin-auth.service": { requireActiveAdmin: async () => { events.push("guard"); if (options.denied) throw new Error("NEXT_REDIRECT"); return { admin: { id: "verified-admin", role: options.role ?? "super_admin", status: "active" } }; } },
    "@/services/supabase.service": { getSupabaseServerClientOrThrow: async () => { events.push("client"); return {
      from: (table: string) => { events.push(table); assert.equal(table, "ui_field_visibility"); return builder; },
      rpc: async (name: string, args: unknown) => { assert.equal(name, "set_member_field_visibility"); events.push("rpc"); written = args; return { error: options.writeError ? { code: options.writeError, message: "secret" } : null }; },
    }; } },
    // Test-only stand-in for a future A2-integrated screen, never a runtime bypass.
    "@/utils/field-visibility": options.integrated ? { ...utils, assertVisibilityIntegrated: () => undefined } : utils,
  });
  return { service, events, written: () => written };
}

test("anonymous denied before any configuration query", async () => {
  const fixture = serviceFixture({ denied: true });
  await assert.rejects(fixture.service.getFieldVisibility(), /NEXT_REDIRECT/);
  await assert.rejects(fixture.service.saveFieldVisibility(saveInput(), saveInput().values), /NEXT_REDIRECT/);
  await assert.rejects(fixture.service.resetFieldVisibility("members.edit", saveInput().values), /NEXT_REDIRECT/);
  assert.deepEqual(fixture.events, ["guard", "guard", "guard"]);
});

test("ordinary admin cannot write; inactive integration rejects super_admin without queries", async () => {
  for (const role of ["admin", "super_admin"]) {
    const fixture = serviceFixture({ role });
    const code = role === "admin" ? "forbidden" : "not_integrated";
    const input = { screenKey: "sponsors.list", values: { contact_name: true, email: true, phone: true, city: true } };
    await assert.rejects(fixture.service.saveFieldVisibility(input, input.values), errorCode(code));
    await assert.rejects(fixture.service.resetFieldVisibility(input.screenKey, input.values), errorCode(code));
    assert.deepEqual(fixture.events, ["guard", "guard"]);
  }
});

test("one batch per canonical screen set; request-cache adapter never bypasses guards", async () => {
  const fixture = serviceFixture({ role: "admin" });
  await fixture.service.getFieldVisibility(["members.edit", "members.create"]);
  await fixture.service.getFieldVisibility(["members.create", "members.edit", "members.edit"]);
  assert.equal(fixture.events.filter((value) => value === "select").length, 1);
  assert.equal(fixture.events.filter((value) => value === "guard").length, 2);
  assert.equal(fixture.events[0], "guard");
  assert.ok(fixture.events.includes("keys:members.create,members.edit"));
});

test("DB failures and truncated reads default visible and forbid a write", async () => {
  for (const options of [{ readError: true }, { truncated: true }]) {
    const fixture = serviceFixture({ ...options, integrated: true });
    const snapshot = await fixture.service.getFieldVisibility(["members.edit"]);
    assert.equal(snapshot.warning, "unavailable");
    assert.ok(snapshot.screens[0].fields.every((field) => field.isVisible));
    await assert.rejects(fixture.service.saveFieldVisibility(saveInput(), saveInput().values), errorCode("unavailable"));
    assert.equal(fixture.written(), undefined);
  }
});

test("one guarded RPC, fresh read, explicit baseline and reset, no direct write or retry", async () => {
  const fixture = serviceFixture({ integrated: true });
  await fixture.service.getFieldVisibility(["members.edit"]);
  await fixture.service.saveFieldVisibility(saveInput(), saveInput().values);
  assert.equal(fixture.events.filter((value) => value === "select").length, 2);
  assert.equal(fixture.events.filter((value) => value === "rpc").length, 1);
  assert.deepEqual(fixture.written(), { p_screen_key: "members.edit", p_values: saveInput().values, p_expected: saveInput().values, p_reset: false });
  await fixture.service.resetFieldVisibility("members.edit", saveInput().values);
  assert.deepEqual(fixture.written(), { p_screen_key: "members.edit", p_values: {}, p_expected: saveInput().values, p_reset: true });
  assert.ok(!fixture.events.includes("upsert") && !fixture.events.includes("update"));
  const conflict = serviceFixture({ integrated: true, writeError: "40001" });
  await assert.rejects(conflict.service.saveFieldVisibility(saveInput(), saveInput().values), errorCode("conflict"));
  assert.equal(conflict.events.filter((value) => value === "rpc").length, 1);
});

test("actions sanitize errors, preserve redirects and invalidate settings and member pages only", async () => {
  const invalidations: string[] = [];
  let failure: Error | null = null;
  const actions = loadModule<typeof import("@/app/(admin)/settings/field-visibility/actions")>("src/app/(admin)/settings/field-visibility/actions.ts", {
    "next/cache": { revalidatePath: (path: string) => invalidations.push(path) },
    "next/navigation": { unstable_rethrow: (error: Error) => { if (error.message === "NEXT_REDIRECT") throw error; } },
    "@/services/field-visibility.service": { saveFieldVisibility: async () => { if (failure) throw failure; }, resetFieldVisibility: async () => { if (failure) throw failure; } },
  });
  assert.equal((await actions.saveFieldVisibilityAction(saveInput(), saveInput().values)).ok, true);
  assert.equal((await actions.resetFieldVisibilityAction("members.edit", saveInput().values)).ok, true);
  assert.deepEqual(invalidations, Array(2).fill(["/settings/field-visibility", "/members", "/members/new", "/members/[id]", "/members/[id]/edit"]).flat());
  failure = new Error("secret-token-db-error");
  assert.doesNotMatch((await actions.saveFieldVisibilityAction(saveInput(), saveInput().values)).message, /secret|token|db-error/);
  failure = new Error("NEXT_REDIRECT");
  await assert.rejects(actions.saveFieldVisibilityAction(saveInput(), saveInput().values), /NEXT_REDIRECT/);
});

test("non-integrated catalog controls stay disabled, no readonly/group/import, responsive views", () => {
  const { FieldVisibilitySettings } = loadModule<typeof import("@/components/settings/FieldVisibilitySettings")>("src/components/settings/FieldVisibilitySettings.tsx", {
    "next/navigation": { useRouter: () => ({ refresh: () => undefined }) },
    "@/app/(admin)/settings/field-visibility/actions": {},
  });
  const snapshot = resolveVisibilityRows(["sponsors.create"], []);
  const html = renderToStaticMarkup(createElement(FieldVisibilitySettings, { snapshot, canConfigure: true }));
  assert.match(html, /Questa configurazione è globale/);
  assert.match(html, /Non ancora attiva/);
  for (const input of html.matchAll(/<input[^>]*role="switch"[^>]*>/g)) assert.match(input[0], /disabled=""/);
  assert.match(html, /<table/);
  assert.match(html, /md:hidden/);
  assert.doesNotMatch(html, /type="file"|permission.group|localStorage/);
});

test("page has its own guard before resolving preferences", async () => {
  const events: string[] = [];
  const { default: page } = loadModule<{ default: () => Promise<unknown> }>("src/app/(admin)/settings/field-visibility/page.tsx", {
    "@/components/settings/FieldVisibilitySettings": { FieldVisibilitySettings: () => null },
    "@/components/layout/PageHeader": { PageHeader: () => null },
    "@/services/admin-auth.service": { requireActiveAdmin: async () => { events.push("guard"); return { admin: { role: "admin" } }; } },
    "@/services/field-visibility.service": { getFieldVisibility: async () => { events.push("read"); return resolveVisibilityRows(["members.edit"], []); } },
  });
  await page();
  assert.deepEqual(events, ["guard", "read"]);
});
