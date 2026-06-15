import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  REPORT_EXPORT_FORMAT,
  type ReportExportFormat,
  type ReportFilters,
} from "@/types/report";

type ReportExportActionsProps = {
  filters: ReportFilters;
  disabled?: boolean;
};

function HiddenReportFilterFields({ filters }: { filters: ReportFilters }) {
  return (
    <>
      <input type="hidden" name="reportType" value={filters.reportType} />
      {filters.query ? (
        <input type="hidden" name="q" value={filters.query} />
      ) : null}
      {filters.status && filters.status !== "all" ? (
        <input type="hidden" name="status" value={filters.status} />
      ) : null}
      {filters.membershipStatus && filters.membershipStatus !== "all" ? (
        <input
          type="hidden"
          name="membershipStatus"
          value={filters.membershipStatus}
        />
      ) : null}
      {filters.paymentStatus && filters.paymentStatus !== "all" ? (
        <input
          type="hidden"
          name="paymentStatus"
          value={filters.paymentStatus}
        />
      ) : null}
      {filters.paymentMethod && filters.paymentMethod !== "all" ? (
        <input
          type="hidden"
          name="paymentMethod"
          value={filters.paymentMethod}
        />
      ) : null}
      {filters.contributionType && filters.contributionType !== "all" ? (
        <input
          type="hidden"
          name="contributionType"
          value={filters.contributionType}
        />
      ) : null}
      {filters.audienceType && filters.audienceType !== "all" ? (
        <input
          type="hidden"
          name="audienceType"
          value={filters.audienceType}
        />
      ) : null}
      {filters.expirationWindow ? (
        <input
          type="hidden"
          name="expirationWindow"
          value={filters.expirationWindow}
        />
      ) : null}
      {filters.dateFrom ? (
        <input type="hidden" name="dateFrom" value={filters.dateFrom} />
      ) : null}
      {filters.dateTo ? (
        <input type="hidden" name="dateTo" value={filters.dateTo} />
      ) : null}
      {filters.includeArchived ? (
        <input type="hidden" name="includeArchived" value="true" />
      ) : null}
    </>
  );
}

function ExportButton({
  filters,
  format,
  disabled,
}: {
  filters: ReportFilters;
  format: ReportExportFormat;
  disabled?: boolean;
}) {
  const isXlsx = format === REPORT_EXPORT_FORMAT.XLSX;
  const Icon = isXlsx ? FileSpreadsheet : FileText;

  return (
    <form action="/reports/export" method="post" className="min-w-0">
      <HiddenReportFilterFields filters={filters} />
      <input type="hidden" name="format" value={format} />
      <Button type="submit" variant="outline" disabled={disabled} className="w-full sm:w-auto">
        <Icon aria-hidden="true" className="mr-2 size-4" />
        {isXlsx ? "Esporta XLSX" : "Esporta CSV"}
      </Button>
    </form>
  );
}

export function ReportExportActions({
  filters,
  disabled,
}: ReportExportActionsProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
      <ExportButton
        filters={filters}
        format={REPORT_EXPORT_FORMAT.CSV}
        disabled={disabled}
      />
      <ExportButton
        filters={filters}
        format={REPORT_EXPORT_FORMAT.XLSX}
        disabled={disabled}
      />
      <div className="hidden items-center text-xs text-muted-foreground lg:flex">
        <Download aria-hidden="true" className="mr-2 size-4" />
        Generazione server-side
      </div>
    </div>
  );
}
