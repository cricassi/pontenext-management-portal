import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveEventSponsorAction } from "@/app/(admin)/events/actions";
import { Button } from "@/components/ui/Button";
import type { EventSponsor } from "@/types/event";

type EventSponsorCardListProps = {
  eventId: string;
  sponsors: EventSponsor[];
};

export function EventSponsorCardList({
  eventId,
  sponsors,
}: EventSponsorCardListProps) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {sponsors.map((sponsor) => (
        <article key={sponsor.id} className="rounded-lg border bg-card p-4">
          <div className="min-w-0">
            <Link
              href={`/sponsors/${sponsor.sponsorId}`}
              className="truncate text-base font-semibold tracking-normal hover:underline"
            >
              {sponsor.sponsorCompanyName}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {sponsor.sponsorshipLevel ?? "Livello non indicato"}
            </p>
          </div>

          {sponsor.notes ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
              {sponsor.notes}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link
                href={`/events/${eventId}?editSponsor=${sponsor.id}#event-sponsor-form`}
                aria-label={`Modifica ${sponsor.sponsorCompanyName}`}
              >
                <Pencil aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <form
              action={archiveEventSponsorAction.bind(null, eventId, sponsor.id)}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label={`Archivia ${sponsor.sponsorCompanyName}`}
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
