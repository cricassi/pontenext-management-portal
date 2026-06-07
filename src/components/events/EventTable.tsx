import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveEventAction } from "@/app/(admin)/events/actions";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EventListItem } from "@/types/event";
import { formatCurrency } from "@/utils/currency";
import { formatDateTimeRange } from "@/utils/date";

type EventTableProps = {
  events: EventListItem[];
};

export function EventTable({ events }: EventTableProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Nessun evento presente"
        description="Crea il primo evento per collegare sponsor e contributi dedicati."
        actionHref="/events/new"
        actionLabel="Nuovo evento"
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Evento</th>
            <th className="px-4 py-3 font-medium">Quando</th>
            <th className="px-4 py-3 font-medium">Sponsor</th>
            <th className="px-4 py-3 font-medium">Contributi</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/events/${event.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {event.name}
                </Link>
                {event.location ? (
                  <p className="text-xs text-muted-foreground">
                    {event.location}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDateTimeRange(event.startDatetime, event.endDatetime)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {event.sponsorCount}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span>{event.contributionCount} contributi</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(event.totalMoneyAmount)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <EventStatusBadge status={event.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}`}>Apri</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
