import { Badge } from "@/components/ui/Badge";
import type { ExpirationStatus } from "@/types/expiration";
import { getExpirationStatusLabel } from "@/utils/expiration";

type ExpirationStatusBadgeProps = {
  status: ExpirationStatus;
};

export function ExpirationStatusBadge({ status }: ExpirationStatusBadgeProps) {
  const variant =
    status === "expired"
      ? "warning"
      : status === "future"
        ? "muted"
        : "outline";

  return (
    <Badge variant={variant}>{getExpirationStatusLabel(status)}</Badge>
  );
}
