import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveSponsorAction } from "@/app/(admin)/sponsors/actions";
import { SponsorStatusBadge } from "@/components/sponsors/SponsorStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SponsorListItem } from "@/types/sponsor";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type SponsorTableProps = {
  sponsors: SponsorListItem[];
};

export function SponsorTable({ sponsors }: SponsorTableProps) {
  if (sponsors.length === 0) {
    return (
      <EmptyState
        title="Nessuno sponsor presente"
        description="Crea il primo sponsor per registrare anagrafica e contributi."
        actionHref="/sponsors/new"
        actionLabel="Nuovo sponsor"
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Ragione sociale</th>
            <th className="px-4 py-3 font-medium">Referente</th>
            <th className="px-4 py-3 font-medium">Contatti</th>
            <th className="px-4 py-3 font-medium">Contributi</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {sponsors.map((sponsor) => (
            <tr key={sponsor.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/sponsors/${sponsor.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {sponsor.companyName}
                </Link>
                {sponsor.city ? (
                  <p className="text-xs text-muted-foreground">{sponsor.city}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {sponsor.contactName ?? "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span>{sponsor.email ?? "-"}</span>
                  <span>{sponsor.phone ?? "-"}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {formatCurrency(sponsor.totalMoneyAmount)}
                  </span>
                  <span>
                    {sponsor.contributionCount} contributi
                    {sponsor.latestContributionDate
                      ? `, ultimo ${formatDate(sponsor.latestContributionDate)}`
                      : ""}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <SponsorStatusBadge status={sponsor.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/sponsors/${sponsor.id}`}>Apri</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/sponsors/${sponsor.id}/edit`}>Modifica</Link>
                  </Button>
                  <form action={archiveSponsorAction.bind(null, sponsor.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia ${sponsor.companyName}`}
                    >
                      <Archive aria-hidden="true" className="size-4" />
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
