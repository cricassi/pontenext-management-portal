import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createClient } from "@supabase/supabase-js";
import type { MemberListItem } from "@/types/member";
import { loadModule } from "./load-module";

const stamp = "2026-09-27T10:00:00Z";
const base = {
  first_name: "Demo", last_name: "Socio", email: "demo@example.invalid",
  phone: null, address: null, city: "Demo", postal_code: null,
  province: null, country: "Italia", birth_date: null, fiscal_code: null,
  profession: null, notes: null, created_at: stamp, updated_at: stamp,
  archived_at: null,
};
const rows = [
  { ...base, id: "active", status: "active" },
  { ...base, id: "inactive", status: "inactive" },
  { ...base, id: "archived", first_name: "NomeTest", last_name: "CognomeTest", status: "archived", archived_at: stamp },
  { ...base, id: "status-only", status: "archived" },
  { ...base, id: "soft-deleted-active", status: "active", archived_at: stamp },
];

function setup() {
  const queries: URL[] = [];
  // Exercise the real query builder, but replace transport with synthetic rows.
  const supabase = createClient("https://fixture.example.invalid", "synthetic-anon-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      assert.equal(init?.method, "GET");
      const url = new URL(String(input));
      queries.push(url);
      let result = url.pathname.endsWith("/members") ? rows : [];
      for (const [field, filter] of url.searchParams) {
        if (["select", "order"].includes(field)) continue;
        result = result.filter((row) => {
          const value = row[field as keyof typeof row];
          if (filter === "is.null") return value === null;
          if (filter.startsWith("eq.")) return value === filter.slice(3);
          if (filter.startsWith("in.(")) return filter.slice(4, -1).split(",").includes(String(value));
          throw new Error(`Unexpected test filter: ${filter}`);
        });
      }
      return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
    } },
  });
  const service = loadModule<typeof import("@/services/members.service")>("src/services/members.service.ts", {
    "server-only": {},
    "@/services/supabase.service": { getSupabaseServerClientOrThrow: async () => supabase },
    "@/services/admin-auth.service": {},
    "@/services/field-visibility.service": {},
  });
  return { service, queries };
}

test("archive filter retrieves soft-deleted and status-only archived members", async () => {
  const { service, queries } = setup();
  const members = await service.getMembers({ status: "archived" });
  assert.deepEqual(members.map((m) => m.id).sort(), ["archived", "status-only"]);
  assert.equal(members.find((m) => m.id === "archived")?.archivedAt, stamp);
  assert.equal(queries[0].searchParams.get("status"), "eq.archived");
  assert.equal(queries[0].searchParams.has("archived_at"), false);
  assert.equal(queries.length, 2, "one members query and one batch roles query");
});

test("default and all filters still exclude soft-deleted members from ordinary selection", async () => {
  const { service } = setup();
  for (const filters of [{}, { status: "all" as const }]) {
    const members = await service.getMembers(filters);
    assert.deepEqual(members.map((m) => m.id).sort(), ["active", "inactive", "status-only"]);
    assert.ok(members.every((m) => m.archivedAt === null));
  }
});

test("active and inactive filters retain the soft-delete exclusion", async () => {
  const { service, queries } = setup();
  for (const status of ["active", "inactive"] as const) {
    const members = await service.getMembers({ status });
    assert.deepEqual(members.map((m) => m.id), [status]);
  }
  for (const query of queries.filter((q) => q.pathname.endsWith("/members"))) {
    assert.equal(query.searchParams.get("archived_at"), "is.null");
  }
});

test("archive filtering composes with search, role filtering and sort", async () => {
  const { service } = setup();
  assert.deepEqual((await service.getMembers({ status: "archived", query: "nometest cognometest" })).map((m) => m.id), ["archived"]);
  assert.deepEqual((await service.getMembers({ status: "archived", sort: "name_desc" })).map((m) => m.id), ["status-only", "archived"]);
  assert.deepEqual(await service.getMembers({ status: "archived", roleId: "missing-role" }), []);
  assert.deepEqual(await service.getMembers({ status: "archived", query: "no match" }), []);
});

test("direct member lookup stays closed to soft-deleted members", async () => {
  const { service, queries } = setup();
  assert.equal(await service.getMemberById("archived"), null);
  assert.equal(queries[0].searchParams.get("archived_at"), "is.null");
});

test("desktop and mobile archives have no broken detail/edit links or archive action", async () => {
  const { service } = setup();
  const archived = (await service.getMembers({ status: "archived" })).find((m) => m.id === "archived")!;
  const mocks = { "@/app/(admin)/members/actions": { archiveMemberAction: () => undefined } };
  const { MemberTable } = loadModule<typeof import("@/components/members/MemberTable")>("src/components/members/MemberTable.tsx", mocks);
  const { MemberCardList } = loadModule<typeof import("@/components/members/MemberCardList")>("src/components/members/MemberCardList.tsx", mocks);
  for (const Component of [MemberTable, MemberCardList]) {
    const html = renderToStaticMarkup(createElement(Component, { members: [archived], visibility: { email: false } }));
    assert.match(html, /NomeTest/);
    assert.match(html, /CognomeTest/);
    assert.match(html, /Archiviato/);
    assert.doesNotMatch(html, /href="\/members\//);
    assert.doesNotMatch(html, /<form|Modifica|>Apri<|demo@example/);
    const active: MemberListItem = { ...archived, status: "active", archivedAt: null };
    const activeHtml = renderToStaticMarkup(createElement(Component, { members: [active], visibility: {} }));
    assert.match(activeHtml, /href="\/members\/archived"/);
    assert.match(activeHtml, /Modifica/);
    assert.match(activeHtml, /aria-label="Archivia/);
  }
});
