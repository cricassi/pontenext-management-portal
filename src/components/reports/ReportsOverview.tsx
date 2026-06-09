import { ReportEmptyState } from "@/components/reports/ReportEmptyState";
import { ReportExportActions } from "@/components/reports/ReportExportActions";
import { ReportPreviewCardList } from "@/components/reports/ReportPreviewCardList";
import { ReportPreviewTable } from "@/components/reports/ReportPreviewTable";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { ReportPreview } from "@/types/report";
import { formatDateTime } from "@/utils/date";

type ReportsOverviewProps = {
  preview: ReportPreview;
};

export function ReportsOverview({ preview }: ReportsOverviewProps) {
  const hasRows = preview.previewRows.length > 0;

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{preview.definition.label}</CardTitle>
            <ReportStatusBadge label={`${preview.totalRows} righe`} />
            <ReportStatusBadge label="CSV / XLSX" variant="outline" />
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {preview.definition.description}
          </p>
          <p className="text-xs text-muted-foreground">
            Anteprima generata il {formatDateTime(preview.generatedAt)}. Sono
            mostrate al massimo {preview.previewLimit} righe.
          </p>
        </div>
        <ReportExportActions filters={preview.filters} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasRows ? (
          <>
            <ReportPreviewTable
              columns={preview.definition.columns}
              rows={preview.previewRows}
            />
            <ReportPreviewCardList
              columns={preview.definition.columns}
              rows={preview.previewRows}
            />
          </>
        ) : (
          <ReportEmptyState reportLabel={preview.definition.label} />
        )}
      </CardContent>
    </Card>
  );
}
