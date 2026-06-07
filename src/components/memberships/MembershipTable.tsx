import Link from "next/link";
import { MembershipStatusBadge } from "@/components/memberships/MembershipStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Membership } from "@/types/membership";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type MembershipTableProps = {
  memberships: Membership[];
};

export function MembershipTable({ memberships }: MembershipTableProps) {
  if (memberships.length === 0) {
    return (
      <EmptyState
        title="Nessuna iscrizione presente"
        description="Crea la prima iscrizione o rinnova un socio esistente."
        actionHref="/memberships/new"
        actionLabel="Nuova iscrizione"
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Socio</th>
            <th className="px-4 py-3 font-medium">Piano</th>
            <th className="px-4 py-3 font-medium">Periodo</th>
            <th className="px-4 py-3 font-medium">Quota</th>
            <th className="px-4 py-3 font-medium">Pagato</th>
            <th className="px-4 py-3 font-medium">Stati</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {memberships.map((membership) => (
            <tr key={membership.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/members/${membership.memberId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {membership.memberName}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {membership.membershipPlanName ?? "Personalizzata"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(membership.startDate)} - {formatDate(membership.endDate)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatCurrency(membership.expectedFee)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatCurrency(membership.paidAmount)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                  <MembershipStatusBadge status={membership.status} />
                  <PaymentStatusBadge status={membership.paymentStatus} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/memberships/${membership.id}`}>Apri</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/memberships/new?memberId=${membership.memberId}`}>
                      Rinnova
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
