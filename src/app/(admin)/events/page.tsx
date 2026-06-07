import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventCardList } from "@/components/events/EventCardList";
import { EventFilters } from "@/components/events/EventFilters";
import { EventTable } from "@/components/events/EventTable";
import { Button } from "@/components/ui/Button";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getEvents } from "@/services/events.service";
import type { EventFilters as EventFiltersType } from "@/types/event";

export const dynamic = "force-dynamic";

type EventsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getFilters(
  params: Record<string, string | string[] | undefined>,
): EventFiltersType {
  const status = readSearchParam(params, "status");

  return {
    query: readSearchParam(params, "q")?.trim() || undefined,
    status:
      status === "planned" ||
      status === "confirmed" ||
      status === "completed" ||
      status === "cancelled"
        ? status
        : "all",
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  await requireActiveAdmin();
  const params = (await searchParams) ?? {};
  const filters = getFilters(params);
  const events = await getEvents(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Eventi"
        description="Gestione eventi e sponsor collegati."
        action={
          <Button asChild>
            <Link href="/events/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Nuovo evento
            </Link>
          </Button>
        }
      />

      <EventFilters filters={filters} />
      <EventTable events={events} />
      <EventCardList events={events} />
    </div>
  );
}
