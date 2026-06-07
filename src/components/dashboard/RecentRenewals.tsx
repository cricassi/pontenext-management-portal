import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import type { DashboardRenewalItem } from "@/types/dashboard";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type RecentRenewalsProps = {
  renewals: DashboardRenewalItem[];
};

export function RecentRenewals({ renewals }: RecentRenewalsProps) {
  if (renewals.length === 0) {
    return (
      <EmptyState
        title="Nessun rinnovo negli ultimi 30 giorni"
        description="I rinnovi compariranno quando una nuova membership storica segue una membership precedente dello stesso socio."
        actionHref="/memberships"
        actionLabel="Apri iscrizioni"
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
              <th className="px-4 py-3 font-medium">Periodo</th>
              <th className="px-4 py-3 font-medium">Quota</th>
              <th className="px-4 py-3 font-medium">Creato il</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 text-right font-medium">Azione</th>
            </tr>
          </thead>
          <tbody>
            {renewals.map((renewal) => (
              <tr key={renewal.membershipId} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/members/${renewal.memberId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {renewal.memberName}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {renewal.membershipPlanName ?? "Iscrizione personalizzata"}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(renewal.startDate)} - {formatDate(renewal.endDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCurrency(renewal.paidAmount)} /{" "}
                  {formatCurrency(renewal.expectedFee)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(renewal.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={renewal.paymentStatus} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={renewal.href}>Apri</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {renewals.map((renewal) => (
          <article key={renewal.membershipId} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-normal">
                  {renewal.memberName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {renewal.membershipPlanName ?? "Iscrizione personalizzata"}
                </p>
              </div>
              <PaymentStatusBadge status={renewal.paymentStatus} />
            </div>

            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Periodo</dt>
                <dd className="text-right">
                  {formatDate(renewal.startDate)} - {formatDate(renewal.endDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Quota</dt>
                <dd className="text-right">
                  {formatCurrency(renewal.paidAmount)} /{" "}
                  {formatCurrency(renewal.expectedFee)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Creato il</dt>
                <dd className="text-right">{formatDate(renewal.createdAt)}</dd>
              </div>
            </dl>

            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href={renewal.href}>Apri</Link>
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
