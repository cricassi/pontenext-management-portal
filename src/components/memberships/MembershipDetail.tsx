import Link from "next/link";
import { cancelMembershipAction } from "@/app/(admin)/memberships/actions";
import { MembershipStatusBadge } from "@/components/memberships/MembershipStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { Membership } from "@/types/membership";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type MembershipDetailProps = {
  membership: Membership;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || "-"}</dd>
    </div>
  );
}

export function MembershipDetail({ membership }: MembershipDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Dettaglio iscrizione</CardTitle>
          <div className="flex flex-wrap gap-2">
            <MembershipStatusBadge status={membership.status} />
            <PaymentStatusBadge status={membership.paymentStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Socio"
            value={
              <Link
                href={`/members/${membership.memberId}`}
                className="font-medium hover:underline"
              >
                {membership.memberName}
              </Link>
            }
          />
          <DetailItem
            label="Piano"
            value={membership.membershipPlanName ?? "Personalizzata"}
          />
          <DetailItem label="Inizio" value={formatDate(membership.startDate)} />
          <DetailItem label="Fine" value={formatDate(membership.endDate)} />
          <DetailItem
            label="Quota minima"
            value={formatCurrency(membership.minimumFee)}
          />
          <DetailItem
            label="Quota prevista"
            value={formatCurrency(membership.expectedFee)}
          />
          <DetailItem
            label="Pagato"
            value={formatCurrency(membership.paidAmount)}
          />
        </dl>

        {membership.notes ? (
          <div className="border-t pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">Note</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {membership.notes}
            </p>
          </div>
        ) : null}

        {membership.status !== "cancelled" ? (
          <form
            action={cancelMembershipAction.bind(
              null,
              membership.memberId,
              membership.id,
            )}
          >
            <Button type="submit" variant="outline">
              Annulla iscrizione
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
