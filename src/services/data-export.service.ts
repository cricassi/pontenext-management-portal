import "server-only";
import { version } from "../../package.json";
import {
  FULL_EXPORT_PAGE_SIZE, FULL_EXPORT_PROJECT_REF, FULL_EXPORT_TIMEOUT_MS,
} from "@/config/data-export";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  buildFullExportWorkbook, collectFullExport, DataExportError, fullExportFilename,
} from "@/utils/data-export";

export async function requireFullExportAdmin() {
  const context = await requireActiveAdmin();
  if (context.admin.role !== "super_admin") throw new DataExportError("forbidden");
  return context;
}

export async function exportFullApplicationData(requestSignal: AbortSignal) {
  const context = await requireFullExportAdmin();
  const expectedUrl = `https://${FULL_EXPORT_PROJECT_REF}.supabase.co`;
  if (getSupabaseEnv().url.replace(/\/$/, "") !== expectedUrl) throw new DataExportError("project");

  const startedAt = new Date().toISOString();
  const signal = AbortSignal.any([requestSignal, AbortSignal.timeout(FULL_EXPORT_TIMEOUT_MS)]);
  const supabase = await getSupabaseServerClientOrThrow();
  const sheets = await collectFullExport(async (table, offset, abortSignal) => {
    const { data, error, count } = await supabase.from(table.name)
      .select(table.columns.map((column) => column.key).join(","), { count: "exact" })
      .order("id", { ascending: true })
      .range(offset, offset + FULL_EXPORT_PAGE_SIZE - 1)
      .abortSignal(abortSignal);
    if (error || !data) throw new DataExportError("read_failed");
    return { rows: data as unknown as Record<string, unknown>[], count };
  }, signal);

  signal.throwIfAborted();
  const finalContext = await requireFullExportAdmin();
  if (finalContext.user.id !== context.user.id) throw new DataExportError("forbidden");
  const completedAt = new Date().toISOString();
  const body = buildFullExportWorkbook(sheets, startedAt, completedAt, version);
  signal.throwIfAborted();
  return { body, filename: fullExportFilename(completedAt) };
}
