import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveSponsorContributionAction } from "@/app/(admin)/sponsors/actions";
import { SponsorContributionTypeBadge } from "@/components/sponsors/SponsorContributionTypeBadge";
import { Button } from "@/components/ui/Button";
import type { SponsorContribution } from "@/types/sponsor";
import { formatCurrency } from "@/utils/currency";
import { formatDate, formatDateTime } from "@/utils/date";

type SponsorContributionCardListProps = {
  sponsorId: string;
  contributions: SponsorContribution[];
};

export function SponsorContributionCardList({
  sponsorId,
  contributions,
}: SponsorContributionCardListProps) {
  if (contributions.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {contributions.map((contribution) => (
        <article key={contribution.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold tracking-normal">
                {formatCurrency(contribution.amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(contribution.contributionDate)}
              </p>
            </div>
            <SponsorContributionTypeBadge
              type={contribution.contributionType}
            />
          </div>

          {contribution.description || contribution.notes ? (
            <div className="mt-4 text-sm text-muted-foreground">
              {contribution.description ? (
                <p>{contribution.description}</p>
              ) : null}
              {contribution.notes ? (
                <p className="mt-1 whitespace-pre-wrap">{contribution.notes}</p>
              ) : null}
            </div>
          ) : null}

          {contribution.eventId && contribution.eventName ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Evento:{" "}
              <Link
                href={`/events/${contribution.eventId}`}
                className="font-medium text-foreground hover:underline"
              >
                {contribution.eventName}
                {contribution.eventStartDatetime
                  ? `, ${formatDateTime(contribution.eventStartDatetime)}`
                  : ""}
              </Link>
            </p>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
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
        </article>
      ))}
    </div>
  );
}
