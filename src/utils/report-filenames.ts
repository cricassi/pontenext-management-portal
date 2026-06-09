import { REPORT_EXPORT_FORMAT, type ReportExportFormat, type ReportType } from "@/types/report";

const REPORT_FILENAME_SLUGS: Record<ReportType, string> = {
  members: "soci",
  memberships: "iscrizioni",
  payments: "quote-pagamenti",
  expirations: "scadenze",
  sponsors: "sponsor",
  sponsor_contributions: "contributi-sponsor",
  events: "eventi",
  email_campaigns: "campagne-email",
};

function formatTimestamp(date: Date) {
  return date
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replace(/[:]/g, "")
    .replace("T", "-")
    .replace("Z", "");
}

export function buildReportFilename(
  reportType: ReportType,
  format: ReportExportFormat,
  date = new Date(),
) {
  const extension =
    format === REPORT_EXPORT_FORMAT.XLSX ? REPORT_EXPORT_FORMAT.XLSX : REPORT_EXPORT_FORMAT.CSV;

  return `pontenext-${REPORT_FILENAME_SLUGS[reportType]}-${formatTimestamp(date)}.${extension}`;
}
