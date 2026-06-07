import { Badge } from "@/components/ui/Badge";
import { SPONSOR_STATUS, type SponsorStatus } from "@/types/sponsor";

type SponsorStatusBadgeProps = {
  status: SponsorStatus;
};

const labels: Record<SponsorStatus, string> = {
  [SPONSOR_STATUS.ACTIVE]: "Attivo",
  [SPONSOR_STATUS.INACTIVE]: "Inattivo",
  [SPONSOR_STATUS.ARCHIVED]: "Archiviato",
};

export function SponsorStatusBadge({ status }: SponsorStatusBadgeProps) {
  const variant =
    status === SPONSOR_STATUS.ACTIVE
      ? "success"
      : status === SPONSOR_STATUS.INACTIVE
        ? "warning"
        : "muted";

  return <Badge variant={variant}>{labels[status]}</Badge>;
}
