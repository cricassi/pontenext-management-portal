import { Badge } from "@/components/ui/Badge";
import type { MembershipStatus } from "@/types/membership";
import {
  getMembershipStatusLabel,
  getMembershipStatusVariant,
} from "@/utils/status";

type MembershipStatusBadgeProps = {
  status: MembershipStatus;
};

export function MembershipStatusBadge({ status }: MembershipStatusBadgeProps) {
  return (
    <Badge variant={getMembershipStatusVariant(status)}>
      {getMembershipStatusLabel(status)}
    </Badge>
  );
}
