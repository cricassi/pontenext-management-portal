import { Archive } from "lucide-react";
import { archivePaymentAction } from "@/app/(admin)/memberships/actions";
import { PaymentMethodBadge } from "@/components/payments/PaymentMethodBadge";
import { Button } from "@/components/ui/Button";
import type { Payment } from "@/types/payment";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type PaymentCardListProps = {
  membershipId: string;
  payments: Payment[];
};

export function PaymentCardList({
  membershipId,
  payments,
}: PaymentCardListProps) {
  if (payments.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {payments.map((payment) => (
        <article key={payment.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold tracking-normal">
                {formatCurrency(payment.amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(payment.paymentDate)}
              </p>
            </div>
            <PaymentMethodBadge method={payment.method} />
          </div>

          {payment.reference || payment.notes ? (
            <div className="mt-4 text-sm text-muted-foreground">
              {payment.reference ? <p>{payment.reference}</p> : null}
              {payment.notes ? (
                <p className="mt-1 whitespace-pre-wrap">{payment.notes}</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <form
              action={archivePaymentAction.bind(
                null,
                membershipId,
                payment.id,
              )}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label={`Archivia pagamento del ${formatDate(payment.paymentDate)}`}
              >
                <Archive aria-hidden="true" className="size-4" />
              </Button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
