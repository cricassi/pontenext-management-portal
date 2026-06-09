import { buildReport } from "@/services/reports.service";
import {
  REPORT_EXPORT_FORMAT,
  type ReportExportFormat,
  type ReportFilters,
} from "@/types/report";
import { exportRowsToCsv } from "@/utils/csv";
import { buildReportFilename } from "@/utils/report-filenames";
import { exportRowsToXlsx } from "@/utils/xlsx";

export type ReportExportPayload = {
  body: string | Buffer;
  contentType: string;
  filename: string;
};

export async function exportReport(
  filters: ReportFilters,
  format: ReportExportFormat,
): Promise<ReportExportPayload> {
  const report = await buildReport(filters);
  const filename = buildReportFilename(filters.reportType, format);

  if (format === REPORT_EXPORT_FORMAT.XLSX) {
    return {
      body: exportRowsToXlsx(report.definition.columns, report.rows),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename,
    };
  }

  return {
    body: exportRowsToCsv(report.definition.columns, report.rows),
    contentType: "text/csv; charset=utf-8",
    filename,
  };
}
