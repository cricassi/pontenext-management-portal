import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExpirationStatusBadge } from "@/components/expirations/ExpirationStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import type { DashboardExpirationItem } from "@/types/dashboard";
import { formatDate } from "@/utils/date";
import { getDaysUntilExpirationLabel } from "@/utils/expiration";

type UpcomingExpirationsProps = {
  expirations: DashboardExpirationItem[];
};

export function UpcomingExpirations({ expirations }: UpcomingExpirationsProps) {
  if (expirations.length === 0) {
    return (
      <EmptyState
        title="Nessuna scadenza nei prossimi 30 giorni"
        description="Le scadenze operative compariranno quando esistono membership vicine alla fine periodo."
        actionHref="/expirations"
        actionLabel="Apri scadenze"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Socio</th>
              <th className="px-4 py-3 font-medium">Piano</th>
              <th className="px-4 py-3 font-medium">Scadenza</th>
              <th className="px-4 py-3 font-medium">Stati</th>
              <th className="px-4 py-3 text-right font-medium">Azione</th>
            </tr>
          </thead>
          <tbody>
            {expirations.map((expiration) => (
              <tr
                key={expiration.membershipId}
                className="border-b last:border-b-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/members/${expiration.memberId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {expiration.memberName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {expiration.membershipPlanName ?? "Personalizzata"}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">
                    {formatDate(expiration.endDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getDaysUntilExpirationLabel(
                      expiration.daysUntilExpiration,
                    )}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <ExpirationStatusBadge
                      status={expiration.expirationStatus}
                    />
                    <PaymentStatusBadge status={expiration.paymentStatus} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm">
                    <Link href={expiration.renewalHref}>Rinnovo rapido</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {expirations.map((expiration) => (
          <article
            key={expiration.membershipId}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-normal">
                  {expiration.memberName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {expiration.membershipPlanName ?? "Iscrizione personalizzata"}
                </p>
              </div>
              <ExpirationStatusBadge status={expiration.expirationStatus} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Scadenza</p>
                <p className="font-medium text-foreground">
                  {formatDate(expiration.endDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getDaysUntilExpirationLabel(
                    expiration.daysUntilExpiration,
                  )}
                </p>
              </div>
              <PaymentStatusBadge status={expiration.paymentStatus} />
            </div>

            <Button asChild size="sm" className="mt-4 w-full">
              <Link href={expiration.renewalHref}>Rinnovo rapido</Link>
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
