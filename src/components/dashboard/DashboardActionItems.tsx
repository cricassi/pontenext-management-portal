import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExpirationStatusBadge } from "@/components/expirations/ExpirationStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import type { DashboardActionItem } from "@/types/dashboard";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { getDaysUntilExpirationLabel } from "@/utils/expiration";

type DashboardActionItemsProps = {
  items: DashboardActionItem[];
};

function getActionKindLabel(kind: DashboardActionItem["kind"]) {
  switch (kind) {
    case "expired_membership":
      return "Scaduta";
    case "expiring_membership":
      return "In scadenza";
    case "incomplete_fee":
      return "Quota aperta";
  }
}

function getActionKindVariant(kind: DashboardActionItem["kind"]) {
  switch (kind) {
    case "expired_membership":
    case "incomplete_fee":
      return "default";
    case "expiring_membership":
      return "warning";
  }
}

export function DashboardActionItems({ items }: DashboardActionItemsProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nessun elemento urgente"
        description="Non ci sono scadenze o quote aperte da gestire subito."
        actionHref="/members"
        actionLabel="Vai ai soci"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm shadow-zinc-950/5 md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Socio</th>
              <th className="px-4 py-3 font-medium">Scadenza</th>
              <th className="px-4 py-3 font-medium">Quota</th>
              <th className="px-4 py-3 font-medium">Stati</th>
              <th className="px-4 py-3 text-right font-medium">Azione</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b transition-colors hover:bg-muted/30 last:border-b-0"
              >
                <td className="px-4 py-3">
                  <Badge variant={getActionKindVariant(item.kind)}>
                    {getActionKindLabel(item.kind)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/members/${item.memberId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.memberName}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.membershipPlanName ?? "Iscrizione personalizzata"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">
                    {formatDate(item.endDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getDaysUntilExpirationLabel(item.daysUntilExpiration)}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCurrency(item.paidAmount)} /{" "}
                  {formatCurrency(item.expectedFee)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <ExpirationStatusBadge status={item.expirationStatus} />
                    <PaymentStatusBadge status={item.paymentStatus} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm">
                    <Link href={item.actionHref}>{item.actionLabel}</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border bg-card p-4 shadow-sm shadow-zinc-950/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-normal">
                  {item.memberName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.membershipPlanName ?? "Iscrizione personalizzata"}
                </p>
              </div>
              <Badge variant={getActionKindVariant(item.kind)}>
                {getActionKindLabel(item.kind)}
              </Badge>
            </div>

            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Scadenza</dt>
                <dd className="text-right">
                  <span className="block">{formatDate(item.endDate)}</span>
                  <span className="text-xs text-muted-foreground">
                    {getDaysUntilExpirationLabel(item.daysUntilExpiration)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Quota</dt>
                <dd className="text-right">
                  {formatCurrency(item.paidAmount)} /{" "}
                  {formatCurrency(item.expectedFee)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <ExpirationStatusBadge status={item.expirationStatus} />
                <PaymentStatusBadge status={item.paymentStatus} />
              </div>
              <Button asChild size="sm">
                <Link href={item.actionHref}>{item.actionLabel}</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
