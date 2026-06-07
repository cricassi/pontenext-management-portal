import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveEventSponsorAction } from "@/app/(admin)/events/actions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EventSponsor } from "@/types/event";

type EventSponsorTableProps = {
  eventId: string;
  sponsors: EventSponsor[];
};

export function EventSponsorTable({
  eventId,
  sponsors,
}: EventSponsorTableProps) {
  if (sponsors.length === 0) {
    return (
      <EmptyState
        title="Nessuno sponsor collegato"
        description="Un evento puo' esistere anche senza sponsor collegati."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Sponsor</th>
            <th className="px-4 py-3 font-medium">Livello</th>
            <th className="px-4 py-3 font-medium">Note</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {sponsors.map((sponsor) => (
            <tr key={sponsor.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/sponsors/${sponsor.sponsorId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {sponsor.sponsorCompanyName}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {sponsor.sponsorshipLevel ?? "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {sponsor.notes ?? "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link
                      href={`/events/${eventId}?editSponsor=${sponsor.id}#event-sponsor-form`}
                      aria-label={`Modifica ${sponsor.sponsorCompanyName}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                  <form
                    action={archiveEventSponsorAction.bind(
                      null,
                      eventId,
                      sponsor.id,
                    )}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
