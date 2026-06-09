import type { ReportColumn, ReportRow } from "@/types/report";

type ReportPreviewTableProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
};

function renderCell(value: ReportRow[string]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function ReportPreviewTable({ columns, rows }: ReportPreviewTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={
                    column.align === "right"
                      ? "px-4 py-3 text-right font-medium"
                      : "px-4 py-3 font-medium"
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={
                      column.align === "right"
                        ? "max-w-72 truncate px-4 py-3 text-right"
                        : "max-w-72 truncate px-4 py-3"
                    }
                    title={renderCell(row[column.key])}
                  >
                    {renderCell(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
