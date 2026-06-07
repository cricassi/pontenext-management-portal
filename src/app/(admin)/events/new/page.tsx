import { createEventAction } from "@/app/(admin)/events/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventForm } from "@/components/events/EventForm";
import { requireActiveAdmin } from "@/services/admin-auth.service";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireActiveAdmin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo evento"
        description="Inserisci i dati operativi dell'evento."
      />
      <EventForm action={createEventAction} submitLabel="Crea evento" />
    </div>
  );
}
