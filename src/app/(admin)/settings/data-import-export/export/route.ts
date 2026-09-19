import { unstable_rethrow } from "next/navigation";
import { exportFullApplicationData, requireFullExportAdmin } from "@/services/data-export.service";
import { DataExportError, DATA_EXPORT_ERRORS } from "@/utils/data-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function failure(error: unknown) {
  unstable_rethrow(error);
  const code = error instanceof DataExportError ? error.code : "read_failed";
  const status = code === "forbidden" ? 403 : code === "changed" ? 409 : code === "limit" ? 413 : 500;
  return Response.json({ error: DATA_EXPORT_ERRORS[code] }, { status, headers: privateHeaders });
}

export async function POST(request: Request) {
  try {
    await requireFullExportAdmin();
    if (request.headers.get("origin") !== new URL(request.url).origin ||
      (request.headers.has("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin")) {
      throw new DataExportError("forbidden");
    }
    const payload = await exportFullApplicationData(request.signal);
    return new Response(new Uint8Array(payload.body).buffer, {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${payload.filename}"`,
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function GET() {
  try {
    await requireFullExportAdmin();
    return Response.json({ error: "Usa il pulsante di esportazione nella pagina Impostazioni." }, {
      status: 405, headers: { ...privateHeaders, Allow: "POST" },
    });
  } catch (error) {
    return failure(error);
  }
}
