import Link from "next/link";
import { MembershipStatusBadge } from "@/components/memberships/MembershipStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import type { Membership } from "@/types/membership";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type MembershipCardListProps = {
  memberships: Membership[];
};

export function MembershipCardList({ memberships }: MembershipCardListProps) {
  if (memberships.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {memberships.map((membership) => (
        <article key={membership.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {membership.memberName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {membership.membershipPlanName ?? "Iscrizione personalizzata"}
              </p>
            </div>
            <MembershipStatusBadge status={membership.status} />
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Periodo</dt>
              <dd className="text-right">
                {formatDate(membership.startDate)} - {formatDate(membership.endDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Quota prevista</dt>
              <dd className="text-right">
                {formatCurrency(membership.expectedFee)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pagato</dt>
              <dd className="text-right">
                {formatCurrency(membership.paidAmount)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between gap-3">
            <PaymentStatusBadge status={membership.paymentStatus} />
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/memberships/${membership.id}`}>Apri</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/memberships/new?memberId=${membership.memberId}`}>
                  Rinnova
                </Link>
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
