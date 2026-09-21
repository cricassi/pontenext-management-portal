// Optional isolated PostgreSQL/WASM harness. No live connection or environment secrets.
// PGLITE_TEST_MODULE points to a separately installed @electric-sql/pglite package.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FIELD_VISIBILITY_REGISTRY } from "@/config/field-visibility-registry";

interface TestDatabase {
  exec(sql: string): Promise<unknown>;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  close(): Promise<void>;
}

const modulePath = process.env.PGLITE_TEST_MODULE;
if (!modulePath) throw new Error("Set PGLITE_TEST_MODULE to an isolated @electric-sql/pglite installation. Never use a live database.");
const { PGlite } = require(modulePath) as { PGlite: new () => TestDatabase };
const uid = (index: number) => `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const adminId = (index: number) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const policyId = "30000000-0000-4000-8000-000000000001";
const sqlState = (code: string) => (error: unknown) => !!error && typeof error === "object" && "code" in error && error.code === code;

test("M10-A1 SQL, RLS and atomicity on isolated PostgreSQL with synthetic identities", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      create function public.set_updated_at() returns trigger language plpgsql as
        $$ begin new.updated_at = now(); return new; end; $$;
      create table public.members (id uuid primary key, notes text);
      insert into public.members values ('40000000-0000-4000-8000-000000000001', 'Synthetic sentinel, unchanged');
    `);
    await db.exec(readFileSync("database/migrations/002_admin_users.sql", "utf8"));
    await db.exec(readFileSync("database/migrations/003_harden_admin_functions.sql", "utf8"));
    await db.exec("grant select on public.admin_users to authenticated; alter default privileges in schema public grant all on tables to anon, authenticated;");
    for (let index = 1; index <= 6; index++) {
      await db.query("insert into auth.users values ($1)", [uid(index)]);
      if (index !== 6) await db.query("insert into public.admin_users (id,auth_user_id,full_name,email,role,status,archived_at) values ($1,$2,'Demo',$3,$4,$5,$6)", [adminId(index), uid(index), `demo${index}@example.invalid`, index === 2 ? "admin" : "super_admin", index === 3 ? "inactive" : "active", index === 4 ? "2026-01-01" : null]);
    }
    const before = await db.query("select * from public.members");
    const beforeAdmin = await db.query("select * from public.admin_users order by id");
    await db.exec(readFileSync("database/migrations/015_ui_field_visibility.sql", "utf8"));
    assert.deepEqual((await db.query("select * from public.members")).rows, before.rows);
    assert.deepEqual((await db.query("select * from public.admin_users order by id")).rows, beforeAdmin.rows);

    async function actor(index: number, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [index ? uid(index) : ""]);
      await db.exec(`set role ${role}`);
    }
    const insert = (field = "email", author = adminId(1)) => db.query("insert into public.ui_field_visibility (screen_key,field_key,is_visible,updated_by) values ('members.edit',$1,false,$2)", [field, author]);
    const count = async () => (await db.query<{ count: number }>("select count(*)::int from public.ui_field_visibility")).rows[0].count;

    await t.test("empty default, RLS, three policies, no dangerous grants and safe helper", async () => {
      assert.equal(await count(), 0);
      const table = (await db.query<{ rls: boolean }>("select relrowsecurity as rls from pg_class where oid='public.ui_field_visibility'::regclass")).rows[0];
      assert.equal(table.rls, true);
      const policies = (await db.query<{ cmd: string; roles: string[] }>("select cmd,roles from pg_policies where tablename='ui_field_visibility' order by cmd")).rows;
      assert.deepEqual(policies.map((policy) => policy.cmd), ["INSERT", "SELECT", "UPDATE"]);
      assert.ok(policies.every((policy) => policy.roles.join() === "authenticated"));
      for (const privilege of ["DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        assert.equal((await db.query<{ allowed: boolean }>("select has_table_privilege('authenticated','public.ui_field_visibility',$1) as allowed", [privilege])).rows[0].allowed, false);
      }
      assert.equal((await db.query<{ allowed: boolean }>("select has_table_privilege('anon','public.ui_field_visibility','SELECT') as allowed")).rows[0].allowed, false);
      const helper = (await db.query<{ prosecdef: boolean; proconfig: string[] }>("select prosecdef,proconfig from pg_proc where oid='app_private.is_super_admin()'::regprocedure")).rows[0];
      assert.equal(helper.prosecdef, true);
      assert.deepEqual(helper.proconfig, ['search_path=""']);
      await actor(1);
      assert.equal((await db.query<{ ok: boolean }>("select app_private.is_super_admin() as ok")).rows[0].ok, true);
    });

    await t.test("super_admin writes, database IDs/defaults and updated_at trigger work", async () => {
      await db.query("insert into public.ui_field_visibility (id,screen_key,field_key,updated_by,updated_at) values ($1,'members.edit','email',$2,'2000-01-01')", [policyId, adminId(1)]);
      const created = (await db.query<{ is_visible: boolean; created_at: Date }>("select * from public.ui_field_visibility")).rows[0];
      assert.equal(created.is_visible, true);
      await db.query("update public.ui_field_visibility set is_visible=false where id=$1", [policyId]);
      const updated = (await db.query<{ is_visible: boolean; created_at: Date; updated_at: Date }>("select * from public.ui_field_visibility")).rows[0];
      assert.equal(updated.is_visible, false);
      assert.deepEqual(updated.created_at, created.created_at);
      assert.ok(new Date(updated.updated_at).getFullYear() > 2000);
    });

    await t.test("admin reads but cannot insert or update; anon/inactive/archived/non-admin denied", async () => {
      await actor(2);
      assert.equal(await count(), 1);
      await assert.rejects(insert("phone", adminId(2)), sqlState("42501"));
      assert.equal((await db.query("update public.ui_field_visibility set is_visible=true returning id")).rows.length, 0);
      for (const index of [0, 3, 4, 6]) {
        await actor(index);
        assert.equal(await count(), 0);
        assert.equal((await db.query<{ ok: boolean }>("select app_private.is_super_admin() as ok")).rows[0].ok, false);
        await assert.rejects(insert("phone"), sqlState("42501"));
        assert.equal((await db.query("update public.ui_field_visibility set is_visible=true returning id")).rows.length, 0);
      }
      await actor(0, "anon");
      await assert.rejects(db.query("select * from public.ui_field_visibility"), sqlState("42501"));
      await assert.rejects(insert("phone"), sqlState("42501"));
    });

    await t.test("forged admin/Auth author, required/unknown pairs, null state and duplicates rejected", async () => {
      await actor(1);
      await assert.rejects(insert("phone", adminId(5)), sqlState("42501"));
      await assert.rejects(insert("phone", uid(1)), sqlState("42501"));
      await assert.rejects(db.query("update public.ui_field_visibility set updated_by=$1", [adminId(5)]), sqlState("42501"));
      for (const field of ["first_name", "arbitrary", "archived_at"]) await assert.rejects(insert(field), sqlState("23514"));
      await assert.rejects(db.query("insert into public.ui_field_visibility (screen_key,field_key,is_visible,updated_by) values ('members.edit','phone',null,$1)", [adminId(1)]), sqlState("23502"));
      await assert.rejects(insert(), sqlState("23505"));
      assert.equal(await count(), 1);
    });

    await t.test("entire registry accepted; SQL CHECK rejects a known field on the wrong screen", async () => {
      await db.exec("begin");
      try {
        for (const [screenKey, screen] of Object.entries(FIELD_VISIBILITY_REGISTRY)) {
          for (const field of screen.fields.filter((field) => field.configurable)) {
            if (screenKey === "members.edit" && field.fieldKey === "email") continue;
            await db.query("insert into public.ui_field_visibility (screen_key,field_key,updated_by) values ($1,$2,$3)", [screenKey, field.fieldKey, adminId(1)]);
          }
        }
        assert.equal(await count(), 116);
      } finally { await db.exec("rollback"); }
      await assert.rejects(db.query("insert into public.ui_field_visibility (screen_key,field_key,updated_by) values ('events.list','email',$1)", [adminId(1)]), sqlState("23514"));
    });

    await t.test("multi-row conflict rolls back all rows, no partial save", async () => {
      await assert.rejects(db.query("insert into public.ui_field_visibility (screen_key,field_key,is_visible,updated_by) values ('members.edit','phone',false,$1),('members.edit','email',true,$1) on conflict(id) do update set is_visible=excluded.is_visible", [adminId(1)]), sqlState("23505"));
      assert.equal(await count(), 1);
      assert.equal((await db.query<{ is_visible: boolean }>("select is_visible from public.ui_field_visibility")).rows[0].is_visible, false);
    });

    await t.test("soft reset preserves history, stale ID cannot revive; a new override gets a new ID", async () => {
      await db.query("update public.ui_field_visibility set archived_at=now() where id=$1", [policyId]);
      assert.equal((await db.query("select id from public.ui_field_visibility where archived_at is null")).rows.length, 0);
      await assert.rejects(db.query("insert into public.ui_field_visibility (id,screen_key,field_key,is_visible,updated_by) values ($1,'members.edit','email',true,$2) on conflict(id) do update set is_visible=excluded.is_visible,archived_at=null,updated_by=excluded.updated_by", [policyId, adminId(1)]), sqlState("42501"));
      assert.equal((await db.query("update public.ui_field_visibility set archived_at=null where id=$1 returning id", [policyId])).rows.length, 0);
      await insert();
      const rows = (await db.query<{ id: string }>("select id from public.ui_field_visibility where archived_at is null")).rows;
      assert.equal(rows.length, 1);
      assert.notEqual(rows[0].id, policyId);
      assert.equal(await count(), 2);
      await assert.rejects(db.query("delete from public.ui_field_visibility"), sqlState("42501"));
      await assert.rejects(db.query("truncate public.ui_field_visibility"), sqlState("42501"));
      await db.exec("reset role");
      assert.deepEqual((await db.query("select * from public.members")).rows, before.rows);
      assert.deepEqual((await db.query("select * from public.admin_users order by id")).rows, beforeAdmin.rows);
    });
  } finally { await db.close(); }
});
