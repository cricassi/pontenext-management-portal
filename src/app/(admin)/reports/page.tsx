import { PageHeader } from "@/components/layout/PageHeader";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportPrivacyNotice } from "@/components/reports/ReportPrivacyNotice";
import { ReportsOverview } from "@/components/reports/ReportsOverview";
import { readReportFiltersFromSearchParams } from "@/services/report-filters.service";
import {
  getReportDefinition,
  getReportDefinitions,
  getReportPreview,
} from "@/services/reports.service";
import { requireActiveAdmin } from "@/services/admin-auth.service";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireActiveAdmin();

  const params = (await searchParams) ?? {};
  const filters = readReportFiltersFromSearchParams(params);
  const [definitions, preview] = await Promise.all([
    Promise.resolve(getReportDefinitions()),
    getReportPreview(filters),
  ]);
  const selectedDefinition = getReportDefinition(filters.reportType);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Report"
        description="Reportistica operativa esportabile in CSV e XLSX sui dati disponibili da M1 a M7."
      />

      <ReportPrivacyNotice />
      <ReportFilterPanel
        definitions={definitions}
        selectedDefinition={selectedDefinition}
        filters={filters}
      />
      <ReportsOverview preview={preview} />
    </div>
  );
}
