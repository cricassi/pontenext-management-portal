import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { Event } from "@/types/event";
import { formatDateTimeRange } from "@/utils/date";

type EventDetailProps = {
  event: Event;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || "-"}</dd>
    </div>
  );
}

export function EventDetail({ event }: EventDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Dati evento</CardTitle>
          <EventStatusBadge status={event.status} />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Nome" value={event.name} />
          <DetailItem
            label="Quando"
            value={formatDateTimeRange(event.startDatetime, event.endDatetime)}
          />
          <DetailItem label="Luogo" value={event.location} />
        </dl>

        {event.description ? (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Descrizione
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {event.description}
            </p>
          </div>
        ) : null}

        {event.notes ? (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">Note</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {event.notes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
