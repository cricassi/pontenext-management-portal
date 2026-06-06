import { Badge } from "@/components/ui/Badge";
import type { MemberStatus } from "@/types/member";
import {
  getMemberStatusLabel,
  getMemberStatusVariant,
} from "@/utils/status";

type MemberStatusBadgeProps = {
  status: MemberStatus;
};

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  return (
    <Badge variant={getMemberStatusVariant(status)}>
      {getMemberStatusLabel(status)}
    </Badge>
  );
}
