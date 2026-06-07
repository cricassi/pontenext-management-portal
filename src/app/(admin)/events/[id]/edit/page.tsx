import { notFound } from "next/navigation";
import { updateEventAction } from "@/app/(admin)/events/actions";
import { EventForm } from "@/components/events/EventForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getEventById } from "@/services/events.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type EditEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  await requireActiveAdmin();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Modifica evento" description={event.name} />
      <EventForm
        event={event}
        action={updateEventAction.bind(null, event.id)}
        submitLabel="Salva modifiche"
      />
    </div>
  );
}
