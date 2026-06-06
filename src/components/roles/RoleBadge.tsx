import { Badge } from "@/components/ui/Badge";

type RoleBadgeProps = {
  name: string;
};

export function RoleBadge({ name }: RoleBadgeProps) {
  return <Badge variant="outline">{name}</Badge>;
}
