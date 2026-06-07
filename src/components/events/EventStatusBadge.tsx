import { Badge } from "@/components/ui/Badge";
import { EVENT_STATUS, type EventStatus } from "@/types/event";

type EventStatusBadgeProps = {
  status: EventStatus;
};

const labels: Record<EventStatus, string> = {
  [EVENT_STATUS.PLANNED]: "Pianificato",
  [EVENT_STATUS.CONFIRMED]: "Confermato",
  [EVENT_STATUS.COMPLETED]: "Concluso",
  [EVENT_STATUS.CANCELLED]: "Annullato",
};

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const variant =
    status === EVENT_STATUS.CONFIRMED
      ? "success"
      : status === EVENT_STATUS.PLANNED
        ? "warning"
        : status === EVENT_STATUS.COMPLETED
          ? "secondary"
          : "muted";

  return <Badge variant={variant}>{labels[status]}</Badge>;
}
