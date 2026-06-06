import { Badge } from "@/components/ui/Badge";

type MembershipPlanStatusBadgeProps = {
  isActive: boolean;
};

export function MembershipPlanStatusBadge({
  isActive,
}: MembershipPlanStatusBadgeProps) {
  return (
    <Badge variant={isActive ? "success" : "muted"}>
      {isActive ? "Attivo" : "Non attivo"}
    </Badge>
  );
}
