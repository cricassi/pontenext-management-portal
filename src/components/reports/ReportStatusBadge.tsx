import { Badge } from "@/components/ui/Badge";

type ReportStatusBadgeProps = {
  label: string;
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "muted";
};

export function ReportStatusBadge({
  label,
  variant = "secondary",
}: ReportStatusBadgeProps) {
  return <Badge variant={variant}>{label}</Badge>;
}
