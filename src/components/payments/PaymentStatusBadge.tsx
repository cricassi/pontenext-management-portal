import { Badge } from "@/components/ui/Badge";
import type { PaymentStatus } from "@/types/payment";
import { getPaymentStatusLabel, getPaymentStatusVariant } from "@/utils/status";

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={getPaymentStatusVariant(status)}>
      {getPaymentStatusLabel(status)}
    </Badge>
  );
}
