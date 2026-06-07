import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveEventAction } from "@/app/(admin)/events/actions";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { Button } from "@/components/ui/Button";
import type { EventListItem } from "@/types/event";
import { formatCurrency } from "@/utils/currency";
import { formatDateTimeRange } from "@/utils/date";

type EventCardListProps = {
  events: EventListItem[];
};

export function EventCardList({ events }: EventCardListProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {events.map((event) => (
        <article key={event.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {event.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTimeRange(event.startDatetime, event.endDatetime)}
              </p>
            </div>
            <EventStatusBadge status={event.status} />
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Luogo</dt>
              <dd className="text-right">{event.location ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Sponsor</dt>
              <dd className="text-right">{event.sponsorCount}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Contributi</dt>
              <dd className="text-right">
                {event.contributionCount} /{" "}
                {formatCurrency(event.totalMoneyAmount)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
            <Button asChild variant="outline">
              <Link href={`/events/${event.id}`}>Apri</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/events/${event.id}/edit`}>Modifica</Link>
            </Button>
            <form action={archiveEventAction.bind(null, event.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label={`Archivia ${event.name}`}
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
