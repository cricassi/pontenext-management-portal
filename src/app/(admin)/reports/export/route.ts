import { NextResponse } from "next/server";
import { readReportExportRequestFromFormData } from "@/services/report-filters.service";
import { exportReport } from "@/services/report-export.service";
import { requireActiveAdmin } from "@/services/admin-auth.service";

export const dynamic = "force-dynamic";

function buildDownloadHeaders(contentType: string, filename: string) {
  return {
    "Cache-Control": "no-store",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };
}

export async function POST(request: Request) {
  await requireActiveAdmin();

  const formData = await request.formData();
  const { filters, format } = readReportExportRequestFromFormData(formData);
  const payload = await exportReport(filters, format);
  const body =
    typeof payload.body === "string"
      ? payload.body
      : new Uint8Array(payload.body).buffer;

  return new Response(body, {
    headers: buildDownloadHeaders(payload.contentType, payload.filename),
  });
}

export async function GET() {
  await requireActiveAdmin();

  return NextResponse.json(
    { error: "Usa POST per generare un export report." },
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Cache-Control": "no-store",
      },
    },
  );
}
