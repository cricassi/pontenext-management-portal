import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { FULL_EXPORT_TABLES, FULL_EXPORT_MAX_ROWS, type ExportTable } from "@/config/data-export";
import { collectFullExport, buildFullExportWorkbook, DataExportError, fullExportFilename, type ReadExportPage } from "@/utils/data-export";
import { exportRowsToXlsx, exportSheetsToXlsx } from "@/utils/xlsx";

function fixture(table: ExportTable, index = 1): Record<string, unknown> {
  return Object.fromEntries(table.columns.map((column) => [column.key,
    column.key === "id" ? `00000000-0000-0000-0000-${String(index).padStart(12, "0")}` :
      column.type === "money" ? 12.34 : column.type === "number" ? 1 :
        column.type === "boolean" ? true : column.type === "timestamp" ? "2026-09-19T12:34:56.123456+00:00" :
          column.type === "date" ? "2026-09-19" : "demo",
  ]));
}

const signal = () => new AbortController().signal;
const readFixture: ReadExportPage = async (table) => ({ rows: [fixture(table)], count: 1 });
const hasCode = (code: string) => (error: unknown) => error instanceof DataExportError && error.code === code;

function unzip(buffer: Buffer): Map<string, string> {
  const entries = new Map<string, string>();
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(buffer.readUInt16LE(offset + 8), 0);
    const size = buffer.readUInt32LE(offset + 18);
    const nameSize = buffer.readUInt16LE(offset + 26);
    const extraSize = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameSize).toString();
    const start = offset + 30 + nameSize + extraSize;
    entries.set(name, buffer.subarray(start, start + size).toString());
    offset = start + size;
  }
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
  assert.equal(buffer.readUInt32LE(buffer.length - 22), 0x06054b50);
  assert.equal(buffer.readUInt16LE(buffer.length - 12), entries.size);
  return entries;
}

// Isolated module loading: every external auth/database dependency is stubbed.
function loadModule<T>(filename: string, mocks: Record<string, unknown>): T {
  const absolute = resolve(filename);
  const source = readFileSync(absolute, "utf8");
  const { outputText } = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2020, esModuleInterop: true, jsx: JsxEmit.ReactJSX },
    fileName: absolute,
  });
  const module = { exports: {} };
  const fakeRequire = (name: string) => Object.hasOwn(mocks, name) ? mocks[name] : require(name.startsWith(".") ? resolve(absolute, "..", name) : name);
  new Function("require", "module", "exports", outputText)(fakeRequire, module, module.exports);
  return module.exports as T;
}

test("manifest includes exactly 13 tables and excludes security material", () => {
  assert.deepEqual(FULL_EXPORT_TABLES.map((table) => table.name), ["members", "roles", "member_roles", "membership_plans", "memberships", "payments", "sponsors", "sponsor_contributions", "events", "event_sponsors", "email_templates", "email_campaigns", "email_campaign_recipients"]);
  for (const table of FULL_EXPORT_TABLES) {
    assert.equal(new Set(table.columns.map((column) => column.key)).size, table.columns.length);
    assert.ok(!table.columns.some((column) => /token|password|secret|api_key/.test(column.key)));
    if (table.name !== "email_campaign_recipients") assert.ok(table.columns.some((column) => column.key === "archived_at"));
  }
});

test("two complete reads, archived rows, stable headers, native types and timestamp precision", async () => {
  let queries = 0;
  const sheets = await collectFullExport(async (table) => { queries++; return readFixture(table, 0, signal()); }, signal());
  assert.equal(queries, 26);
  assert.equal(sheets.length, 13);
  const members = sheets[0];
  assert.equal(members.rows[0][members.columns.findIndex((column) => column.label === "archived_at")], "2026-09-19T12:34:56.123456Z");
  const workbook = unzip(buildFullExportWorkbook(sheets, "2026-09-19T12:00:00Z", "2026-09-19T12:01:00Z", "test"));
  assert.equal(workbook.size, 20);
  assert.equal((workbook.get("xl/workbook.xml")!.match(/<sheet /g) || []).length, 15);
  assert.match(workbook.get("xl/workbook.xml")!, /name="README".*name="METADATA".*name="members".*name="email_campaign_recipients"/);
  assert.match(workbook.get("xl/worksheets/sheet6.xml")!, /t="n" s="2"><v>12\.34<\/v>/);
  assert.match(workbook.get("xl/worksheets/sheet4.xml")!, /t="b"><v>1<\/v>/);
  const metadata = workbook.get("xl/worksheets/sheet2.xml")!;
  for (const key of ["export_format_version", "exported_at", "application_version", "schema_migration_version", "source_project_ref", "rows.METADATA", ...FULL_EXPORT_TABLES.map((table) => `rows.${table.name}`)]) assert.ok(metadata.includes(key));
  for (const xml of workbook.values()) assert.doesNotMatch(xml, /<f[ >]|TargetMode="External"|vbaProject/);
  assert.equal(fullExportFilename("2026-09-19T12:34:56Z"), "pontenext-full-export-2026-09-19-1234.xlsx");
});

test("empty tables still export headers and metadata with zero counts", async () => {
  const sheets = await collectFullExport(async () => ({ rows: [], count: 0 }), signal());
  assert.ok(sheets.every((sheet) => sheet.rows.length === 0 && sheet.columns.length > 0));
  const workbook = unzip(buildFullExportWorkbook(sheets, "start", "end", "test"));
  assert.match(workbook.get("xl/worksheets/sheet3.xml")!, /<row r="1">/);
  assert.doesNotMatch(workbook.get("xl/worksheets/sheet3.xml")!, /<row r="2">/);
});

test("pagination handles a server cap below requested page size without truncating", async () => {
  const offsets: number[] = [];
  const sheets = await collectFullExport(async (table, offset) => {
    if (table.name !== "members") return { rows: [], count: 0 };
    offsets.push(offset);
    return { rows: Array.from({ length: Math.min(100, 251 - offset) }, (_, index) => fixture(table, offset + index + 1)), count: 251 };
  }, signal());
  assert.deepEqual(offsets, [0, 100, 200, 0, 100, 200]);
  assert.equal(sheets[0].rows.length, 251);
});

test("changing data, count drift, duplicate IDs, missing rows and unknown columns fail closed", async () => {
  let calls = 0;
  await assert.rejects(collectFullExport(async (table) => {
    const row = fixture(table);
    if (++calls > 13 && table.name === "members") row.first_name = "changed";
    return { rows: [row], count: 1 };
  }, signal()), hasCode("changed"));
  await assert.rejects(collectFullExport(async () => ({ rows: [], count: null }), signal()), hasCode("read_failed"));
  await assert.rejects(collectFullExport(async () => ({ rows: [], count: 1 }), signal()), hasCode("read_failed"));
  await assert.rejects(collectFullExport(async (table) => ({ rows: [fixture(table), fixture(table)], count: 2 }), signal()), hasCode("changed"));
  await assert.rejects(collectFullExport(async (table) => { const row = fixture(table); delete row.first_name; return { rows: [row], count: 1 }; }, signal()), hasCode("invalid"));
  await assert.rejects(collectFullExport(async (table, offset) => ({ rows: [fixture(table, offset + 1)], count: offset ? 1 : 2 }), signal()), hasCode("changed"));
});

test("row, data, file, cell length limits and cancellation never return partial workbook", async () => {
  await assert.rejects(collectFullExport(async () => ({ rows: [], count: FULL_EXPORT_MAX_ROWS + 1 }), signal()), hasCode("limit"));
  await assert.rejects(collectFullExport(async (table) => ({ rows: [{ ...fixture(table), notes: "x".repeat(11 * 1024 * 1024) }], count: 1 }), signal()), hasCode("limit"));
  const controller = new AbortController(); controller.abort();
  let reads = 0;
  await assert.rejects(collectFullExport(async () => { reads++; return { rows: [], count: 0 }; }, controller.signal));
  assert.equal(reads, 0);
  assert.throws(() => exportSheetsToXlsx([{ name: "demo", columns: [{ label: "text" }], rows: [["demo"]] }], 1), RangeError);
  assert.throws(() => exportSheetsToXlsx([{ name: "demo", columns: [{ label: "text" }], rows: [["x".repeat(32768)]] }], 1_000_000), RangeError);
});

test("null, empty string and literal backslashes remain distinguishable", async () => {
  const sheets = await collectFullExport(async (table) => ({ rows: [{ ...fixture(table), first_name: "", last_name: "\\E", email: null }], count: 1 }), signal());
  assert.deepEqual(sheets[0].rows[0].slice(1, 4), ["\\E", "\\\\E", null]);
});

test("formula-like strings stay literal; no macros, formulas or active hyperlinks", () => {
  const values = ["=1+1", "+cmd", "-1", "@SUM(A1)", " \t=HYPERLINK(\"https://example.invalid\")", "<tag>&", "a\r\nb", "_x000A_", "test \ud83d\ude00"];
  const files = unzip(exportSheetsToXlsx([{ name: "demo", columns: [{ label: "text" }], rows: values.map((value) => [value]) }], 100_000));
  const xml = files.get("xl/worksheets/sheet1.xml")!;
  assert.equal((xml.match(/s="1"/g) || []).length, 5);
  assert.match(xml, /a_x000D_\nb/);
  assert.match(xml, /_x005F_x000A_/);
  assert.match(xml, /&lt;tag&gt;&amp;/);
  assert.doesNotMatch(xml, /<f[ >]|<hyperlink/);
  assert.match(files.get("xl/styles.xml")!, /quotePrefix="1"/);
  for (const value of ["bad\u0000", "bad\ud800"]) {
    assert.throws(() => exportSheetsToXlsx([{ name: "demo", columns: [{ label: "text" }], rows: [[value]] }], 100_000));
  }
});

test("M8 single-sheet export contract remains unchanged", () => {
  const files = unzip(exportRowsToXlsx([{ key: "value", label: "Value" }], [{ value: 12.34 }, { value: "=1+1" }]));
  assert.equal(files.size, 5);
  assert.match(files.get("xl/workbook.xml")!, /name="Report"/);
  assert.match(files.get("xl/worksheets/sheet1.xml")!, /t="inlineStr"><is><t xml:space="preserve">12.34/);
});

test("service rejects ordinary admin or anonymous before business queries", async () => {
  let clients = 0;
  for (const anonymous of [false, true]) {
    const service = loadModule<typeof import("@/services/data-export.service")>("src/services/data-export.service.ts", {
      "server-only": {},
      "@/services/admin-auth.service": { requireActiveAdmin: async () => { if (anonymous) throw new Error("redirect-login"); return { admin: { role: "admin" } }; } },
      "@/services/supabase.service": { getSupabaseServerClientOrThrow: async () => { clients++; } },
    });
    await assert.rejects(service.exportFullApplicationData(signal()));
  }
  assert.equal(clients, 0);
});

test("service uses explicit read-only session queries and rechecks authorization", async () => {
  let guards = 0;
  let queries = 0;
  const selected: string[] = [];
  const service = loadModule<typeof import("@/services/data-export.service")>("src/services/data-export.service.ts", {
    "server-only": {},
    "@/services/admin-auth.service": { requireActiveAdmin: async () => { guards++; return { admin: { role: "super_admin" }, user: { id: "demo-admin" } }; } },
    "@/lib/supabase/config": { getSupabaseEnv: () => ({ url: "https://uhxfpsamenjhyrfgwckw.supabase.co" }) },
    "@/services/supabase.service": { getSupabaseServerClientOrThrow: async () => ({ from: (name: string) => {
      assert.ok(guards > 0); queries++;
      const query = {
        select: (columns: string, options: unknown) => { selected.push(columns); assert.deepEqual(options, { count: "exact" }); return query; },
        order: (column: string, options: unknown) => { assert.equal(column, "id"); assert.deepEqual(options, { ascending: true }); return query; },
        range: (from: number, to: number) => { assert.equal(from, 0); assert.equal(to, 249); return query; },
        abortSignal: async () => ({ data: [fixture(FULL_EXPORT_TABLES.find((table) => table.name === name)!)], count: 1, error: null }),
      }; return query;
    } }) },
  });
  const result = await service.exportFullApplicationData(signal());
  assert.equal(guards, 2);
  assert.equal(queries, 26);
  assert.ok(selected.every((columns) => !columns.includes("*") && !columns.includes("token")));
  assert.match(result.filename, /^pontenext-full-export-/);
  assert.ok(result.body.length > 0);
});

test("endpoint auth, same-origin, POST-only, safe errors and private attachment headers", async () => {
  let allowed = false;
  let exports = 0;
  let exportFailure = false;
  const route = loadModule<typeof import("../src/app/(admin)/settings/data-import-export/export/route")>("src/app/(admin)/settings/data-import-export/export/route.ts", {
    "next/navigation": { unstable_rethrow: (error: unknown) => { if (error === "redirect-login") throw error; } },
    "@/services/data-export.service": {
      requireFullExportAdmin: async () => { if (!allowed) throw new DataExportError("forbidden"); },
      exportFullApplicationData: async () => { exports++; if (exportFailure) throw new Error("secret SQL detail"); return { body: Buffer.from("demo"), filename: "pontenext-full-export-2026-09-19-1234.xlsx" }; },
    },
  });
  const post = (origin = "https://portal.example") => new Request("https://portal.example/settings/data-import-export/export", { method: "POST", headers: { origin } });
  assert.equal((await route.POST(post())).status, 403);
  assert.equal((await route.GET()).status, 403);
  assert.equal(exports, 0);
  allowed = true;
  assert.equal((await route.GET()).status, 405);
  assert.equal((await route.POST(post("https://external.example"))).status, 403);
  assert.equal((await route.POST(new Request("https://portal.example/settings/data-import-export/export", { method: "POST" }))).status, 403);
  assert.equal(exports, 0);
  const response = await route.POST(post());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("content-type"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.match(response.headers.get("content-disposition")!, /attachment; filename="pontenext-full-export-/);
  exportFailure = true;
  const failure = await route.POST(post());
  assert.equal(failure.status, 500);
  assert.doesNotMatch(await failure.text(), /secret|SQL/);
});

test("settings page: super admin only, no upload/import and guarded before rendering", async () => {
  let role = "admin";
  const page = loadModule<typeof import("../src/app/(admin)/settings/data-import-export/page")>("src/app/(admin)/settings/data-import-export/page.tsx", {
    "next/navigation": { redirect: (path: string) => { throw new Error(`redirect:${path}`); } },
    "@/services/admin-auth.service": { requireActiveAdmin: async () => ({ admin: { role } }) },
    "@/components/settings/DataExportButton": { DataExportButton: () => createElement("button", null, "Esporta tutti i dati in Excel") },
  });
  await assert.rejects(page.default(), /redirect:\/settings/);
  role = "super_admin";
  const html = renderToStaticMarkup(await page.default());
  assert.match(html, /Excel non sostituisce un backup completo/);
  assert.match(html, /Esporta tutti i dati in Excel/);
  assert.doesNotMatch(html, /type="file"|<form/);
});

test("real admin guard requires Auth user and active non-archived admin row", async () => {
  for (const state of ["anonymous", "auth-only", "inactive", "archived", "active"]) {
    const filters: Record<string, unknown> = {};
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { filters[key] = value; return query; },
      is: (key: string, value: unknown) => { filters[key] = value; return query; },
      maybeSingle: async () => ({ data: state === "active" ? { id: "demo-admin", auth_user_id: "demo-user", full_name: "Demo", email: "demo@example.invalid", role: "super_admin", status: "active" } : null }),
    };
    const auth = loadModule<typeof import("@/services/admin-auth.service")>("src/services/admin-auth.service.ts", {
      "next/navigation": { redirect: () => { throw new Error("login-required"); } },
      "@/lib/supabase/server": { createSupabaseServerClient: async () => ({
        auth: { getUser: async () => ({ data: { user: state === "anonymous" ? null : { id: "demo-user" } } }) },
        from: (table: string) => { assert.equal(table, "admin_users"); return query; },
      }) },
    });
    if (state === "active") assert.equal((await auth.requireActiveAdmin()).admin.role, "super_admin");
    else await assert.rejects(auth.requireActiveAdmin(), /login-required/);
    if (state !== "anonymous") assert.deepEqual(filters, { auth_user_id: "demo-user", status: "active", archived_at: null });
  }
});

test("export refuses other projects without querying data", async () => {
  let queried = false;
  const service = loadModule<typeof import("@/services/data-export.service")>("src/services/data-export.service.ts", {
    "server-only": {},
    "@/services/admin-auth.service": { requireActiveAdmin: async () => ({ admin: { role: "super_admin" } }) },
    "@/lib/supabase/config": { getSupabaseEnv: () => ({ url: "https://other.supabase.co" }) },
    "@/services/supabase.service": { getSupabaseServerClientOrThrow: async () => { queried = true; } },
  });
  await assert.rejects(service.exportFullApplicationData(signal()), hasCode("project"));
  assert.equal(queried, false);
});

test("endpoint preserves authentication redirect instead of leaking framework errors", async () => {
  const redirect = new Error("NEXT_REDIRECT");
  const route = loadModule<typeof import("../src/app/(admin)/settings/data-import-export/export/route")>("src/app/(admin)/settings/data-import-export/export/route.ts", {
    "next/navigation": { unstable_rethrow: (error: unknown) => { if (error === redirect) throw error; } },
    "@/services/data-export.service": { requireFullExportAdmin: async () => { throw redirect; } },
  });
  await assert.rejects(route.GET(), (error) => error === redirect);
  await assert.rejects(route.POST(new Request("https://portal.example/export", { method: "POST" })), (error) => error === redirect);
});
