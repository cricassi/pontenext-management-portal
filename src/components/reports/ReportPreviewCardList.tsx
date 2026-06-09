import type { ReportColumn, ReportRow } from "@/types/report";

type ReportPreviewCardListProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
};

function renderCell(value: ReportRow[string]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function ReportPreviewCardList({
  columns,
  rows,
}: ReportPreviewCardListProps) {
  if (rows.length === 0) {
    return null;
  }

  const previewColumns = columns.slice(0, 6);

  return (
    <div className="grid gap-3 md:hidden">
      {rows.map((row, rowIndex) => (
        <article key={rowIndex} className="rounded-lg border bg-card p-4">
          <dl className="grid gap-3 text-sm">
            {previewColumns.map((column) => (
              <div key={column.key} className="grid gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {column.label}
                </dt>
                <dd className="break-words text-foreground">
                  {renderCell(row[column.key])}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
