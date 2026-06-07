import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { ExpirationStatusBadge } from "@/components/expirations/ExpirationStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import type { ExpirationItem } from "@/types/expiration";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { getDaysUntilExpirationLabel } from "@/utils/expiration";
import { buildMembershipRenewalHref } from "@/utils/membership-links";

type ExpirationCardListProps = {
  expirations: ExpirationItem[];
};

export function ExpirationCardList({ expirations }: ExpirationCardListProps) {
  if (expirations.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {expirations.map((expiration) => (
        <article
          key={expiration.membershipId}
          className="rounded-lg border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {expiration.memberName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {expiration.membershipPlanName ?? "Iscrizione personalizzata"}
              </p>
            </div>
            <ExpirationStatusBadge status={expiration.expirationStatus} />
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Scadenza</dt>
              <dd className="text-right">
                <span className="block">{formatDate(expiration.endDate)}</span>
                <span className="text-xs text-muted-foreground">
                  {getDaysUntilExpirationLabel(expiration.daysUntilExpiration)}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Quota</dt>
              <dd className="text-right">
                {formatCurrency(expiration.expectedFee)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pagato</dt>
              <dd className="text-right">
                {formatCurrency(expiration.paidAmount)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-col gap-3">
            <PaymentStatusBadge status={expiration.paymentStatus} />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href={`/memberships/${expiration.membershipId}`}>Apri</Link>
              </Button>
              <Button asChild size="sm">
                <Link
                  href={buildMembershipRenewalHref(
                    expiration.memberId,
                    expiration.membershipId,
                  )}
                >
                  <RefreshCw aria-hidden="true" className="mr-2 size-4" />
                  Rinnovo rapido
                </Link>
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
