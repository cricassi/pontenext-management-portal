import Link from "next/link";
import { MembershipStatusBadge } from "@/components/memberships/MembershipStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Membership } from "@/types/membership";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type MembershipHistoryPanelProps = {
  memberId: string;
  memberships: Membership[];
};

export function MembershipHistoryPanel({
  memberId,
  memberships,
}: MembershipHistoryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Iscrizioni</CardTitle>
            <CardDescription>
              Storico iscrizioni e rinnovi del socio.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/memberships/new?memberId=${memberId}`}>
              Nuova iscrizione
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {memberships.length > 0 ? (
          <div className="grid gap-3">
            {memberships.map((membership) => (
              <article
                key={membership.id}
                className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <MembershipStatusBadge status={membership.status} />
                    <PaymentStatusBadge status={membership.paymentStatus} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-medium text-foreground">Piano</dt>
                      <dd>{membership.membershipPlanName ?? "Personalizzata"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Periodo</dt>
                      <dd>
                        {formatDate(membership.startDate)} -{" "}
                        {formatDate(membership.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Quota</dt>
                      <dd>{formatCurrency(membership.expectedFee)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Pagato</dt>
                      <dd>{formatCurrency(membership.paidAmount)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex gap-2 lg:justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/memberships/${membership.id}`}>Apri</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/memberships/new?memberId=${memberId}`}>
                      Rinnova
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nessuna iscrizione"
            description="Crea la prima iscrizione per questo socio."
            actionHref={`/memberships/new?memberId=${memberId}`}
            actionLabel="Nuova iscrizione"
          />
        )}
      </CardContent>
    </Card>
  );
}
