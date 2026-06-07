import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveSponsorContributionAction } from "@/app/(admin)/sponsors/actions";
import { SponsorContributionTypeBadge } from "@/components/sponsors/SponsorContributionTypeBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SponsorContribution } from "@/types/sponsor";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type SponsorContributionTableProps = {
  sponsorId: string;
  contributions: SponsorContribution[];
};

export function SponsorContributionTable({
  sponsorId,
  contributions,
}: SponsorContributionTableProps) {
  if (contributions.length === 0) {
    return (
      <EmptyState
        title="Nessun contributo registrato"
        description="Registra il primo contributo ricevuto da questo sponsor."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Importo</th>
            <th className="px-4 py-3 font-medium">Descrizione</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((contribution) => (
            <tr key={contribution.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(contribution.contributionDate)}
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
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link
                      href={`/sponsors/${sponsorId}?editContribution=${contribution.id}#contribution-form`}
                      aria-label={`Modifica contributo del ${formatDate(
                        contribution.contributionDate,
                      )}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                  <form
                    action={archiveSponsorContributionAction.bind(
                      null,
                      sponsorId,
                      contribution.id,
                    )}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia contributo del ${formatDate(
                        contribution.contributionDate,
                      )}`}
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
