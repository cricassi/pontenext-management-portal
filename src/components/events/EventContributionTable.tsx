import Link from "next/link";
import { SponsorContributionTypeBadge } from "@/components/sponsors/SponsorContributionTypeBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EventContribution } from "@/types/event";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type EventContributionTableProps = {
  contributions: EventContribution[];
};

export function EventContributionTable({
  contributions,
}: EventContributionTableProps) {
  if (contributions.length === 0) {
    return (
      <EmptyState
        title="Nessun contributo collegato"
        description="I contributi sponsor possono restare non collegati a eventi oppure essere associati a questo evento dalla scheda sponsor."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Sponsor</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Importo</th>
            <th className="px-4 py-3 font-medium">Descrizione</th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((contribution) => (
            <tr key={contribution.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(contribution.contributionDate)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/sponsors/${contribution.sponsorId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {contribution.sponsorCompanyName}
                </Link>
              </td>
              <td className="px-4 py-3">
                <SponsorContributionTypeBadge
                  type={contribution.contributionType}
                />
              </td>
              <td className="px-4 py-3 font-medium">
                {formatCurrency(contribution.amount)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {contribution.description ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
