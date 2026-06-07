import Link from "next/link";
import { SponsorContributionTypeBadge } from "@/components/sponsors/SponsorContributionTypeBadge";
import type { EventContribution } from "@/types/event";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type EventContributionCardListProps = {
  contributions: EventContribution[];
};

export function EventContributionCardList({
  contributions,
}: EventContributionCardListProps) {
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

          <div className="mt-4 text-sm">
            <Link
              href={`/sponsors/${contribution.sponsorId}`}
              className="font-medium text-foreground hover:underline"
            >
              {contribution.sponsorCompanyName}
            </Link>
            {contribution.description ? (
              <p className="mt-2 text-muted-foreground">
                {contribution.description}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
