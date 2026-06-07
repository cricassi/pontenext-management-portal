import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { ExpirationStatusBadge } from "@/components/expirations/ExpirationStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ExpirationItem } from "@/types/expiration";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { getDaysUntilExpirationLabel } from "@/utils/expiration";
import { buildMembershipRenewalHref } from "@/utils/membership-links";

type ExpirationTableProps = {
  expirations: ExpirationItem[];
};

export function ExpirationTable({ expirations }: ExpirationTableProps) {
  if (expirations.length === 0) {
    return (
      <EmptyState
        title="Nessuna scadenza trovata"
        description="Non ci sono iscrizioni nel filtro selezionato."
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
            <th className="px-4 py-3 font-medium">Scadenza</th>
            <th className="px-4 py-3 font-medium">Quota</th>
            <th className="px-4 py-3 font-medium">Pagato</th>
            <th className="px-4 py-3 font-medium">Stati</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {expirations.map((expiration) => (
            <tr key={expiration.membershipId} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/members/${expiration.memberId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {expiration.memberName}
                </Link>
                {expiration.memberEmail ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {expiration.memberEmail}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {expiration.membershipPlanName ?? "Personalizzata"}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">
                  {formatDate(expiration.endDate)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getDaysUntilExpirationLabel(expiration.daysUntilExpiration)}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatCurrency(expiration.expectedFee)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatCurrency(expiration.paidAmount)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                  <ExpirationStatusBadge status={expiration.expirationStatus} />
                  <PaymentStatusBadge status={expiration.paymentStatus} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/memberships/${expiration.membershipId}`}>
                      Apri
                    </Link>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
