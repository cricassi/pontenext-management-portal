import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveSponsorAction } from "@/app/(admin)/sponsors/actions";
import { SponsorStatusBadge } from "@/components/sponsors/SponsorStatusBadge";
import { Button } from "@/components/ui/Button";
import type { SponsorListItem } from "@/types/sponsor";
import { formatCurrency } from "@/utils/currency";

type SponsorCardListProps = {
  sponsors: SponsorListItem[];
};

export function SponsorCardList({ sponsors }: SponsorCardListProps) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {sponsors.map((sponsor) => (
        <article key={sponsor.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {sponsor.companyName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {sponsor.contactName ?? "Referente non indicato"}
              </p>
            </div>
            <SponsorStatusBadge status={sponsor.status} />
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-right">{sponsor.email ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Telefono</dt>
              <dd className="text-right">{sponsor.phone ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Contributi</dt>
              <dd className="text-right">
                {sponsor.contributionCount} /{" "}
                {formatCurrency(sponsor.totalMoneyAmount)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
            <Button asChild variant="outline">
              <Link href={`/sponsors/${sponsor.id}`}>Apri</Link>
            </Button>
            <Button asChild variant="outline">
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
        </article>
      ))}
    </div>
  );
}
