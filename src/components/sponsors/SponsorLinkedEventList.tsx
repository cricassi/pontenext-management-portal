import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Event } from "@/types/event";
import { formatDateTimeRange } from "@/utils/date";

type SponsorLinkedEventListProps = {
  events: Event[];
};

export function SponsorLinkedEventList({
  events,
}: SponsorLinkedEventListProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Nessun evento collegato"
        description="Lo sponsor puo' essere collegato a zero, uno o piu' eventi."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {events.map((event) => (
        <article key={event.id} className="rounded-lg border bg-card p-4">
          <Link
            href={`/events/${event.id}`}
            className="font-medium text-foreground hover:underline"
          >
            {event.name}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDateTimeRange(event.startDatetime, event.endDatetime)}
          </p>
          {event.location ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {event.location}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
