// Loopback-only synthetic HTTP fixture for interactive Next.js UI verification.
// Not a Supabase/RLS replacement: real SQL behavior is tested separately in PGlite.
const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { FIELD_VISIBILITY_REGISTRY } = require("../src/config/field-visibility-registry.ts");
const stamp = () => new Date().toISOString();
const userId = "20000000-0000-4000-8000-000000000001";
const adminId = "10000000-0000-4000-8000-000000000001";
const memberId = "40000000-0000-4000-8000-000000000001";
const user = { id: userId, aud: "authenticated", role: "authenticated", email: "demo@example.invalid", email_confirmed_at: stamp(), created_at: stamp(), app_metadata: { provider: "email" }, user_metadata: {} };
const token = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now()/1000)+86400, role: "authenticated" })).toString("base64url"), "synthetic-not-a-real-signature"].join(".");
const data = {
  admin_users: [{ id: adminId, auth_user_id: userId, full_name: "Demo Super Admin", email: user.email, role: "super_admin", status: "active", archived_at: null }],
  members: [{ id: memberId, first_name: "Ada", last_name: "Demo", email: "preserved@example.invalid", phone: "0123456789", address: "Via Dimostrativa 1", city: "Ponte Demo", postal_code: "00100", province: "PC", country: "Italia", birth_date: "1990-01-01", fiscal_code: "DEMOONLY", profession: "Dimostrazione", notes: "Note demo da preservare", status: "active", created_at: stamp(), updated_at: stamp(), archived_at: null }],
  ui_field_visibility: [], roles: [], member_roles: [], memberships: [], membership_plans: [], payments: [],
};
for (const [screen, definition] of Object.entries(FIELD_VISIBILITY_REGISTRY)) {
  if (!definition.integrated) continue;
  for (const field of definition.fields.filter(f => f.configurable)) data.ui_field_visibility.push({ id: randomUUID(), screen_key: screen, field_key: field.fieldKey, is_visible: !["email", "notes"].includes(field.fieldKey), updated_by: adminId, created_at: stamp(), updated_at: stamp(), archived_at: null });
}
function matches(row, params) {
  return [...params].every(([key, value]) => {
    if (["select", "order", "limit", "offset"].includes(key)) return true;
    if (value === "is.null") return row[key] == null;
    if (value.startsWith("eq.")) return String(row[key]) === value.slice(3);
    if (value.startsWith("in.(")) return value.slice(4,-1).split(",").map(v=>v.replaceAll('"','')).includes(String(row[key]));
    return false;
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:54329");
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3011");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range");
  const send = (status, body) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); };
  if (req.method === "OPTIONS") return send(200, {});
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 64000) return send(413, {}); }
  let input;
  try { input = body ? JSON.parse(body) : {}; } catch { return send(400, {}); }
  if (url.pathname === "/auth/v1/token") {
    if (input.email !== user.email || input.password !== "SyntheticDemo123!") return send(400, { message: "Demo credentials only" });
    return send(200, { access_token: token, token_type: "bearer", expires_in: 86400, refresh_token: "synthetic-refresh-only", user });
  }
  if (req.headers.authorization !== `Bearer ${token}`) return send(401, { code: "42501", message: "Fixture authentication required" });
  if (url.pathname === "/auth/v1/user") return send(200, user);
  if (url.pathname === "/auth/v1/logout") return send(200, {});
  if (url.pathname === "/rest/v1/rpc/set_member_field_visibility" && req.method === "POST") {
    const def = FIELD_VISIBILITY_REGISTRY[input.p_screen_key];
    if (!def?.integrated) return send(400, { code: "22023" });
    const active = data.ui_field_visibility.filter(r=>r.screen_key===input.p_screen_key && !r.archived_at);
    const fields = def.fields.filter(f=>f.configurable);
    if (fields.some(f => input.p_expected[f.fieldKey] !== (active.find(r=>r.field_key===f.fieldKey)?.is_visible ?? true))) return send(409, { code: "40001" });
    if (input.p_reset) active.forEach(r=> { r.archived_at=stamp(); });
    else for (const field of fields) {
      const row = active.find(r=>r.field_key===field.fieldKey);
      if (row) { row.is_visible=input.p_values[field.fieldKey]; row.updated_at=stamp(); }
      else data.ui_field_visibility.push({ id: randomUUID(), screen_key: input.p_screen_key, field_key: field.fieldKey, is_visible: input.p_values[field.fieldKey], updated_by: adminId, created_at: stamp(), updated_at: stamp(), archived_at: null });
    }
    return send(200, null);
  }
  const table = url.pathname.replace("/rest/v1/", "");
  if (!Object.hasOwn(data, table)) return send(404, { message: "Fixture route unavailable" });
  let rows = data[table].filter(r=>matches(r,url.searchParams));
  if (req.method !== "GET") {
    if (table !== "members" || !["POST", "PATCH"].includes(req.method)) return send(403, { code: "42501" });
    if (req.method === "POST") { const row = { ...input, id: randomUUID(), created_at: stamp(), updated_at: stamp(), archived_at: null }; data.members.push(row); rows=[row]; }
    else rows.forEach(row=>Object.assign(row,input,{ updated_at: stamp() }));
  }
  const count = rows.length;
  const limit = Number(url.searchParams.get("limit") ?? count);
  rows = rows.slice(0,limit);
  res.setHeader("Content-Range", count ? `0-${rows.length-1}/${count}` : "*/0");
  return send(200, req.headers.accept?.includes("vnd.pgrst.object") ? (rows[0] ?? null) : rows);
});
server.listen(54329, "127.0.0.1", () => console.log("Synthetic fixture only: http://127.0.0.1:54329"));
process.on("SIGINT", () => server.close(()=>process.exit(0)));
