// Isolated PostgreSQL/WASM only. No live credentials, connection or business data.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FIELD_VISIBILITY_REGISTRY } from "@/config/field-visibility-registry";
import type { FieldVisibilityRow } from "@/types/field-visibility";
import { resolveVisibilityRows } from "@/utils/field-visibility";
import { loadModule } from "./load-module";

interface Database {
  exec(sql: string): Promise<unknown>;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  close(): Promise<void>;
}
const modulePath = process.env.PGLITE_TEST_MODULE;
if (!modulePath) throw new Error("PGLITE_TEST_MODULE must point to an isolated PGlite installation.");
const { PGlite } = require(modulePath) as { PGlite: new () => Database };
const uid = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const aid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const mid = "40000000-0000-4000-8000-000000000001";
const code = (state: string) => (error: unknown) => !!error && typeof error === "object" && "code" in error && error.code === state;
const defaults = (screen = "members.edit") => Object.fromEntries(FIELD_VISIBILITY_REGISTRY[screen as "members.edit"].fields.filter((f) => f.configurable).map((f) => [f.fieldKey, true]));
const sqlFile = (name: string) => readFileSync(`database/migrations/${name}.sql`, "utf8");

test("017 controlled RPC and real member update preservation in isolated PostgreSQL", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to authenticated,anon;
      create function public.set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at=now(); return new; end; $$;`);
    for (const migration of ["002_admin_users", "003_harden_admin_functions", "004_members_roles", "005_membership_plans", "006_memberships_payments", "015_ui_field_visibility", "016_lock_ui_field_visibility_foundation"]) await db.exec(sqlFile(migration));
    await db.exec("grant select on public.admin_users to authenticated");
    for (let n = 1; n <= 5; n++) {
      await db.query("insert into auth.users values ($1)", [uid(n)]);
      if (n !== 5) await db.query("insert into public.admin_users(id,auth_user_id,full_name,email,role,status,archived_at) values ($1,$2,'Demo',$3,$4,$5,$6)", [aid(n), uid(n), `demo${n}@example.invalid`, n === 2 ? "admin" : "super_admin", n === 3 ? "inactive" : "active", n === 4 ? "2026-01-01" : null]);
    }
    await db.query("insert into public.members(id,first_name,last_name,email,phone,address,notes,city) values ($1,'Ada','Demo','original@example.invalid','12345','Via Demo 1','Original notes','Demo city')", [mid]);
    await db.query("insert into public.roles(id,name) values ($1,'Demo role')", [uid(10)]);
    await db.query("insert into public.member_roles(member_id,role_id,start_date) values ($1,$2,'2026-01-01')", [mid, uid(10)]);
    await db.query("insert into public.memberships(member_id,start_date,end_date,minimum_fee,expected_fee) values ($1,'2026-01-01','2026-12-31',30,30)", [mid]);
    const rows = async (table: string) => (await db.query<{ value: Record<string, unknown> }>(`select to_jsonb(t) as value from public.${table} t order by id`)).rows.map((r) => r.value);
    const before = await rows("members");
    const relations = { roles: await rows("roles"), assignments: await rows("member_roles"), memberships: await rows("memberships") };
    const policies = (await db.query("select * from pg_policies order by schemaname,tablename,policyname")).rows;
    await db.exec(sqlFile("017_enable_member_field_visibility_rpc"));
    async function actor(n: number, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [n ? uid(n) : ""]);
      await db.exec(`set role ${role}`);
    }
    const rpc = (screen: string, values: unknown, expected: unknown, reset = false) => db.query("select public.set_member_field_visibility($1,$2::jsonb,$3::jsonb,$4)", [screen, JSON.stringify(values), JSON.stringify(expected), reset]);
    const config = async () => (await rows("ui_field_visibility")) as unknown as FieldVisibilityRow[];
    const hidden = { ...defaults(), email: false, notes: false };

    await t.test("migration changes only functions/EXECUTE; business data, policies and table grants untouched", async () => {
      assert.deepEqual(await rows("members"), before);
      assert.deepEqual((await db.query("select * from pg_policies order by schemaname,tablename,policyname")).rows, policies);
      assert.equal((await config()).length, 0);
      const functions = (await db.query<{ schema: string; prosecdef: boolean; proconfig: string[] }>("select n.nspname as schema,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='set_member_field_visibility' order by n.nspname")).rows;
      assert.deepEqual(functions.map((f) => [f.schema, f.prosecdef, f.proconfig]), [["app_private", true, ['search_path=""']], ["public", false, ['search_path=""']]]);
      for (const schema of ["public", "app_private"]) for (const role of ["anon", "authenticated", "service_role"]) {
        const privilege = (await db.query<{ ok: boolean }>("select has_function_privilege($1,$2,'EXECUTE') ok", [role, `${schema}.set_member_field_visibility(text,jsonb,jsonb,boolean)`])).rows[0].ok;
        assert.equal(privilege, role === "authenticated");
      }
      for (const p of ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]) assert.equal((await db.query<{ ok: boolean }>("select has_table_privilege('authenticated','public.ui_field_visibility',$1) ok", [p])).rows[0].ok, false);
    });
    await t.test("super_admin saves all optional fields atomically, author resolves to admin ID", async () => {
      await actor(1);
      await rpc("members.edit", hidden, defaults());
      const saved = await config();
      assert.equal(saved.length, 10);
      assert.ok(saved.every((r) => r.updated_by === aid(1) && r.archived_at === null));
      assert.equal(saved.find((r) => r.field_key === "email")!.is_visible, false);
      const originalIds = saved.map((r) => [r.id, r.created_at]);
      await rpc("members.edit", hidden, hidden);
      assert.deepEqual((await config()).map((r) => [r.id, r.created_at]), originalIds);
    });
    await t.test("ordinary/inactive/archived/non-admin/anonymous denied even through private function", async () => {
      for (const n of [0, 2, 3, 4, 5]) {
        await actor(n);
        await assert.rejects(rpc("members.edit", defaults(), hidden), code("42501"));
        await assert.rejects(db.query("select app_private.set_member_field_visibility('members.edit',$1::jsonb,$2::jsonb,false)", [JSON.stringify(defaults()), JSON.stringify(hidden)]), code("42501"));
      }
      await actor(0, "anon");
      await assert.rejects(rpc("members.edit", defaults(), hidden), code("42501"));
      await actor(1);
    });
    await t.test("direct INSERT/UPDATE/DELETE/TRUNCATE still denied to super_admin and admin", async () => {
      for (const n of [1, 2]) {
        await actor(n);
        await assert.rejects(db.query("insert into public.ui_field_visibility(screen_key,field_key,updated_by) values ('members.list','email',$1)", [aid(n)]), code("42501"));
        await assert.rejects(db.query("update public.ui_field_visibility set is_visible=true"), code("42501"));
        await assert.rejects(db.query("delete from public.ui_field_visibility"), code("42501"));
        await assert.rejects(db.query("truncate public.ui_field_visibility"), code("42501"));
      }
      await actor(1);
    });
    await t.test("strict screen/field/type allowlist and stale baseline reject without partial save", async () => {
      const initial = await config();
      for (const screen of ["sponsors.edit", "events.create", "members.import", "memberships.create", "__proto__"]) await assert.rejects(rpc(screen, hidden, defaults()), code("22023"));
      for (const values of [{ email: false }, { ...hidden, first_name: false }, { ...hidden, id: uid(1) }, { ...hidden, notes: "false" }, null, []]) await assert.rejects(rpc("members.edit", values, hidden), code("22023"));
      await assert.rejects(rpc("members.list", hidden, defaults("members.list")), code("22023"));
      await assert.rejects(rpc("members.edit", defaults(), defaults()), code("40001"));
      assert.deepEqual(await config(), initial);
      // Failure after the first row proves SQL statement/transaction atomicity.
      await db.exec("reset role");
      await db.exec("create function public.fail_visibility_phone() returns trigger language plpgsql as $$ begin if new.field_key='phone' then raise exception 'synthetic failure'; end if; return new; end $$; create trigger synthetic_visibility_failure before update on public.ui_field_visibility for each row execute function public.fail_visibility_phone();");
      await actor(1);
      await assert.rejects(rpc("members.edit", defaults(), hidden), code("P0001"));
      assert.deepEqual(await config(), initial);
      await db.exec("reset role; drop trigger synthetic_visibility_failure on public.ui_field_visibility; drop function public.fail_visibility_phone();");
      await actor(1);
    });

    // Small PostgREST-shaped adapter executes the ACTUAL service patch against this isolated DB.
    const writes: Record<string, unknown>[] = [];
    const client = {
      from: (table: string) => {
        assert.equal(table, "members");
        let payload: Record<string, unknown> | undefined;
        let insert = false;
        const where: [string, unknown][] = [];
        const allowed = new Set(FIELD_VISIBILITY_REGISTRY["members.edit"].fields.map((f) => f.fieldKey));
        const run = async () => {
          const params: unknown[] = [];
          const bind = (value: unknown) => { params.push(value); return `$${params.length}`; };
          let sql: string;
          if (payload) {
            assert.ok(Object.keys(payload).every((k) => allowed.has(k)));
            writes.push(payload);
            sql = insert ? `insert into public.members (${Object.keys(payload).join(",")}) values (${Object.values(payload).map(bind).join(",")})`
              : `update public.members set ${Object.entries(payload).map(([k, v]) => `${k}=${bind(v)}`).join(",")}`;
          } else sql = "select * from public.members";
          if (!insert) sql += ` where ${where.map(([k,v]) => v === null ? `${k} is null` : `${k}=${bind(v)}`).join(" and ")}`;
          const result = payload
            ? await db.query<{ value: Record<string, unknown> }>(`with changed as (${sql} returning *) select to_jsonb(changed) value from changed`, params)
            : await db.query<{ value: Record<string, unknown> }>(`select to_jsonb(t) value from (${sql}) t`, params);
          return { data: result.rows[0]?.value ?? null, error: !result.rows.length && payload ? { code: "PGRST116" } : null };
        };
        const builder = { select: () => builder, is: (k: string, v: unknown) => { where.push([k,v]); return builder; }, eq: (k: string, v: unknown) => { where.push([k,v]); return builder; }, update: (v: Record<string, unknown>) => { payload=v; return builder; }, insert: (v: Record<string, unknown>) => { payload=v; insert=true; return builder; }, maybeSingle: run, single: run };
        return builder;
      },
    };
    const service = loadModule<typeof import("@/services/members.service")>("src/services/members.service.ts", {
      "server-only": {},
      "@/services/admin-auth.service": { requireActiveAdmin: async () => ({ admin: { id: aid(1), role: "super_admin" } }) },
      "@/services/field-visibility.service": { getFreshFieldVisibility: async (screen: "members.edit" | "members.create") => resolveVisibilityRows([screen], (await config()).filter((r) => r.screen_key === screen)).screens[0] },
      "@/services/supabase.service": { getSupabaseServerClientOrThrow: async () => client },
    });
    const form = (values: Record<string, string> = {}) => {
      const data = new FormData();
      for (const [key,value] of Object.entries({ firstName: "Ada", lastName: "Updated", country: "Italia", status: "active", ...values })) data.set(key,value);
      return data;
    };
    await t.test("actual update service changes visible surname/phone, preserves hidden email/notes and missing address", async () => {
      const result = await service.updateMember(mid, form({ phone: "98765" }));
      assert.equal(result.ok, true);
      assert.deepEqual(writes.at(-1), { last_name: "Updated", phone: "98765" });
      const after = (await rows("members"))[0];
      for (const key of ["email", "notes", "address", "city", "id", "created_at", "archived_at"]) assert.deepEqual(after[key], before[0][key]);
      assert.equal((await rows("members")).length, 1);
      assert.deepEqual(await rows("roles"), relations.roles);
      assert.deepEqual(await rows("member_roles"), relations.assignments);
      assert.deepEqual(await rows("memberships"), relations.memberships);
    });
    await t.test("tampered hidden/unknown/technical/duplicate fields and missing required controls cause no writes", async () => {
      const baseline = await rows("members");
      const invalid: Record<string, string>[] = [{ email: "forged@example.invalid" }, { notes: "" }, { id: mid }, { membership_id: uid(10) }, { archived_at: "" }, { status: "" }];
      for (const extra of invalid) await assert.rejects(service.updateMember(mid, form(extra)));
      const duplicate = form(); duplicate.append("lastName", "Other");
      await assert.rejects(service.updateMember(mid, duplicate));
      const missing = form(); missing.delete("country");
      await assert.rejects(service.updateMember(mid, missing));
      assert.deepEqual(await rows("members"), baseline);
    });
    await t.test("visible explicit empty clears only that field; invalid values fail validation", async () => {
      const result = await service.updateMember(mid, form({ phone: "" }));
      assert.equal(result.ok, true);
      assert.deepEqual(writes.at(-1), { phone: null });
      const invalid = await service.updateMember(mid, form({ province: "TOO LONG" }));
      assert.equal(invalid.ok, false);
      assert.equal((await rows("members"))[0].email, "original@example.invalid");
    });
    await t.test("hidden create fields default to null, required validation remains, no relation created", async () => {
      await rpc("members.create", hidden, defaults());
      await db.exec("begin");
      try {
        const created = await service.createMember(form({ firstName: "New", lastName: "Demo" }));
        assert.equal(created.ok, true);
        if (created.ok) { assert.equal(created.member.email, null); assert.equal(created.member.notes, null); assert.equal(created.member.country, "Italia"); }
        assert.equal((await rows("members")).length, 2);
        assert.deepEqual(await rows("roles"), relations.roles);
        assert.deepEqual(await rows("member_roles"), relations.assignments);
        assert.deepEqual(await rows("memberships"), relations.memberships);
      } finally { await db.exec("rollback"); }
      assert.equal((await rows("members")).length, 1);
    });
    await t.test("legacy hidden values are not normalized or rejected when another field changes", async () => {
      await db.exec("reset role");
      await db.query("update public.members set email='legacy-invalid-email',notes='  Legacy notes  ' where id=$1", [mid]);
      await actor(1);
      const result = await service.updateMember(mid, form({ lastName: "Legacy preserved" }));
      assert.equal(result.ok, true);
      assert.deepEqual(writes.at(-1), { last_name: "Legacy preserved" });
      const stored = (await rows("members"))[0];
      assert.equal(stored.email, "legacy-invalid-email");
      assert.equal(stored.notes, "  Legacy notes  ");
    });
    await t.test("reset archives overrides, returns visible defaults; next save creates new IDs", async () => {
      const old = (await config()).filter((r) => r.screen_key === "members.edit");
      await rpc("members.edit", {}, hidden, true);
      const reset = (await config()).filter((r) => r.screen_key === "members.edit");
      assert.ok(reset.every((r) => r.archived_at !== null));
      assert.ok(resolveVisibilityRows(["members.edit"], reset).screens[0].fields.every((f) => f.isVisible));
      await rpc("members.edit", defaults(), defaults());
      const active = (await config()).filter((r) => r.screen_key === "members.edit" && !r.archived_at);
      assert.equal(active.length, 10);
      assert.ok(active.every((r) => !old.some((o) => o.id === r.id)));
      for (const screen of ["members.list", "members.detail"]) await rpc(screen, defaults(screen), defaults(screen));
    });
  } finally { await db.close(); }
});
