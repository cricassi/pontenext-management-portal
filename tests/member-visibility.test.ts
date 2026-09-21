import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule } from "./load-module";
import type { Member, MemberListItem } from "@/types/member";
import { memberFormView, memberVisibility, prepareMemberSubmission } from "@/utils/member-visibility";
import { resolveVisibilityRows } from "@/utils/field-visibility";
import { FIELD_VISIBILITY_REGISTRY } from "@/config/field-visibility-registry";

const member: MemberListItem = { id: "40000000-0000-4000-8000-000000000001", firstName: "Ada", lastName: "Demo", country: "Italia", status: "active", email: "hidden@example.invalid", phone: "12345", city: "Demo city", address: "Demo address", postalCode: "00100", province: "PC", birthDate: "2000-01-01", fiscalCode: "DEMOCODE", profession: "Demo job", notes: "Hidden notes sentinel", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", archivedAt: null, activeRoles: [], primaryRoleName: "Demo role" };
const hidden = Object.fromEntries(FIELD_VISIBILITY_REGISTRY["members.edit"].fields.map((f) => [f.formKey, !f.configurable]));
const actions = { "@/app/(admin)/members/actions": { archiveMemberAction: () => undefined } };

test("hidden values are absent from form props, controls and HTML, required controls remain", () => {
  const view = memberFormView(member, hidden);
  assert.deepEqual(Object.keys(view).sort(), ["id", "firstName", "lastName", "country", "status"].sort());
  const { MemberForm } = loadModule<typeof import("@/components/members/MemberForm")>("src/components/members/MemberForm.tsx", {});
  for (const record of [view, undefined]) {
    const html = renderToStaticMarkup(createElement(MemberForm, { member: record, visibility: hidden, submitLabel: "Salva", action: async () => ({ errors: {} }) }));
    for (const key of ["firstName", "lastName", "country", "status"]) assert.match(html, new RegExp(`name="${key}"`));
    for (const f of FIELD_VISIBILITY_REGISTRY["members.edit"].fields.filter((f) => f.configurable)) assert.doesNotMatch(html, new RegExp(`name="${f.formKey}"`));
    assert.doesNotMatch(html, /hidden@example|Hidden notes|Demo address|DEMOCODE/);
  }
});
test("same visibility hides desktop headers/cells and mobile labels/values", () => {
  const { MemberTable } = loadModule<typeof import("@/components/members/MemberTable")>("src/components/members/MemberTable.tsx", actions);
  const { MemberCardList } = loadModule<typeof import("@/components/members/MemberCardList")>("src/components/members/MemberCardList.tsx", actions);
  for (const component of [MemberTable, MemberCardList]) {
    const html = renderToStaticMarkup(createElement(component, { members: [member], visibility: hidden }));
    assert.doesNotMatch(html, /hidden@example|12345|Demo city|>Email<|>Telefono<|>Citta</);
    assert.match(html, /Ada/); assert.match(html, /Demo role/); assert.match(html, /Modifica/);
    const visible = renderToStaticMarkup(createElement(component, { members: [member], visibility: {} }));
    assert.match(visible, /hidden@example/); assert.match(visible, /Demo city/);
  }
});
test("detail hides labels/values and retains identity, country and status", () => {
  const { MemberDetail } = loadModule<typeof import("@/components/members/MemberDetail")>("src/components/members/MemberDetail.tsx", {});
  const html = renderToStaticMarkup(createElement(MemberDetail, { member, visibility: hidden }));
  assert.doesNotMatch(html, /hidden@example|Hidden notes|Demo address|DEMOCODE|>Email<|>Telefono<|>Note</);
  for (const label of ["Ada", "Demo", "Italia", "Attivo"]) assert.ok(html.includes(label));
});
test("settings enables optional members fields for super_admin only; all other modules blocked", () => {
  const { FieldVisibilitySettings } = loadModule<typeof import("@/components/settings/FieldVisibilitySettings")>("src/components/settings/FieldVisibilitySettings.tsx", {
    "next/navigation": { useRouter: () => ({ refresh: () => undefined }) },
    "@/app/(admin)/settings/field-visibility/actions": {},
  });
  for (const [screenKey, definition] of Object.entries(FIELD_VISIBILITY_REGISTRY)) {
    for (const canConfigure of [true, false]) {
      const snapshot = resolveVisibilityRows([screenKey as "members.edit"], []);
      const html = renderToStaticMarkup(createElement(FieldVisibilitySettings, { snapshot, canConfigure }));
      const switches = [...html.matchAll(/<input[^>]*role="switch"[^>]*>/g)].map((m) => m[0]);
      const enabled = switches.filter((s) => !s.includes('disabled=""'));
      assert.equal(enabled.length, canConfigure && definition.integrated ? 2 * definition.fields.filter((f) => f.configurable).length : 0);
      if (!definition.integrated) assert.match(html, /Attivazione prevista in una fase successiva/);
    }
  }
});
test("no file/binary, duplicate, unknown or technical mass assignment; optional omissions preserved", () => {
  const screen = resolveVisibilityRows(["members.edit"], []).screens[0];
  const base = () => { const f = new FormData(); for (const k of ["firstName", "lastName", "country", "status"] as const) f.set(k, member[k]); return f; };
  const prepared = prepareMemberSubmission(base(), screen, member);
  assert.equal(prepared.formData.get("email"), member.email);
  assert.equal(prepared.submitted.has("email"), false);
  for (const key of ["__proto__", "updated_by", "archived_at", "member_roles", "id"]) {
    const f = base(); f.set(key, "bad"); assert.throws(() => prepareMemberSubmission(f, screen, member));
  }
  const f = base(); f.set("email", new Blob(["bad"])); assert.throws(() => prepareMemberSubmission(f, screen, member));
  assert.ok(Object.values(memberVisibility(screen)).every(Boolean));
});
test("fresh configuration error and auth failure stop member services before business queries", async () => {
  for (const denied of [true, false]) {
    const events: string[] = [];
    const service = loadModule<typeof import("@/services/members.service")>("src/services/members.service.ts", {
      "server-only": {},
      "@/services/admin-auth.service": { requireActiveAdmin: async () => { events.push("guard"); if (denied) throw new Error("denied"); } },
      "@/services/field-visibility.service": { getFreshFieldVisibility: async () => { events.push("visibility"); throw new Error("unavailable"); } },
      "@/services/supabase.service": { getSupabaseServerClientOrThrow: async () => { events.push("business"); throw new Error("Unexpected business query"); } },
    });
    await assert.rejects(service.createMember(new FormData()));
    await assert.rejects(service.updateMember(member.id, new FormData()));
    assert.ok(!events.includes("business"));
    assert.equal(events[0], "guard");
  }
});
test("page guards run before queries and edit strips hidden fields at the client boundary", async () => {
  const cases = ["page.tsx", "new/page.tsx", "[id]/page.tsx", "[id]/edit/page.tsx"];
  for (const name of cases) {
    const source = readFileSync(`src/app/(admin)/members/${name}`, "utf8");
    assert.ok(source.indexOf("await requireActiveAdmin()") < source.indexOf("await getFieldVisibility("));
  }
  const source = readFileSync("src/app/(admin)/members/[id]/edit/page.tsx", "utf8");
  assert.match(source, /member=\{memberFormView\(member, visibility\)\}/);
  for (const file of ["src/services/data-export.service.ts", "src/services/reports.service.ts", "src/services/email.service.ts"]) {
    // These modules must never acquire visibility as a filtering permission.
    try { assert.doesNotMatch(readFileSync(file, "utf8"), /getFieldVisibility|memberVisibility/); }
    catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error; }
  }
});
