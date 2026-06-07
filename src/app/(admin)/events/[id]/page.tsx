import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Pencil } from "lucide-react";
import {
  archiveEventAction,
  linkSponsorToEventAction,
  updateEventSponsorAction,
} from "@/app/(admin)/events/actions";
import { EventContributionCardList } from "@/components/events/EventContributionCardList";
import { EventContributionTable } from "@/components/events/EventContributionTable";
import { EventDetail } from "@/components/events/EventDetail";
import { EventSponsorCardList } from "@/components/events/EventSponsorCardList";
import { EventSponsorForm } from "@/components/events/EventSponsorForm";
import { EventSponsorTable } from "@/components/events/EventSponsorTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  getAvailableSponsorsForEvent,
  getEventById,
  getEventContributions,
  getEventSponsorById,
  getEventSponsors,
} from "@/services/events.service";
import type { EventSponsorOption } from "@/types/event";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getSponsorOptions(
  editingSponsor:
    | {
        sponsorId: string;
        sponsorCompanyName: string;
      }
    | null,
  availableSponsors: EventSponsorOption[],
) {
  if (!editingSponsor) {
    return availableSponsors;
  }

  return [
    {
      id: editingSponsor.sponsorId,
      companyName: editingSponsor.sponsorCompanyName,
    },
    ...availableSponsors,
  ];
}

export default async function EventPage({
  params,
  searchParams,
}: EventPageProps) {
  await requireActiveAdmin();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const editSponsorId = readSearchParam(resolvedSearchParams, "editSponsor");

  if (editSponsorId && !isUuid(editSponsorId)) {
    notFound();
  }

  const [
    eventSponsors,
    availableSponsors,
    contributions,
    editingSponsor,
  ] = await Promise.all([
    getEventSponsors(event.id),
    getAvailableSponsorsForEvent(event.id),
    getEventContributions(event.id),
    editSponsorId
      ? getEventSponsorById(event.id, editSponsorId)
      : Promise.resolve(null),
  ]);

  if (editSponsorId && !editingSponsor) {
    notFound();
  }

  const sponsorOptions = getSponsorOptions(editingSponsor, availableSponsors);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={event.name}
        description="Scheda evento, sponsor collegati e contributi dedicati."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/events/${event.id}/edit`}>
                <Pencil aria-hidden="true" className="mr-2 size-4" />
                Modifica
              </Link>
            </Button>
            <form action={archiveEventAction.bind(null, event.id)}>
              <Button type="submit" variant="outline">
                <Archive aria-hidden="true" className="mr-2 size-4" />
                Archivia
              </Button>
            </form>
          </div>
        }
      />

      <EventDetail event={event} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-normal">
          Sponsor collegati
        </h2>
        <EventSponsorTable eventId={event.id} sponsors={eventSponsors} />
        <EventSponsorCardList eventId={event.id} sponsors={eventSponsors} />
      </section>

      <EventSponsorForm
        link={editingSponsor ?? undefined}
        sponsors={sponsorOptions}
        action={
          editingSponsor
            ? updateEventSponsorAction.bind(
                null,
                event.id,
                editingSponsor.id,
              )
            : linkSponsorToEventAction.bind(null, event.id)
        }
        cancelHref={`/events/${event.id}`}
        submitLabel={editingSponsor ? "Salva collegamento" : "Collega sponsor"}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-normal">
          Contributi evento
        </h2>
        <EventContributionTable contributions={contributions} />
        <EventContributionCardList contributions={contributions} />
      </section>
    </div>
  );
}
