import { Badge } from "@/components/ui/Badge";
import type { PaymentMethod } from "@/types/payment";
import { getPaymentMethodLabel } from "@/utils/status";

type PaymentMethodBadgeProps = {
  method: PaymentMethod;
};

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  return <Badge variant="outline">{getPaymentMethodLabel(method)}</Badge>;
}
