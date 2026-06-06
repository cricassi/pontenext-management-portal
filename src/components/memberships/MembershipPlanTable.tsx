import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveMembershipPlanAction } from "@/app/(admin)/settings/membership-plans/actions";
import { MembershipPlanStatusBadge } from "@/components/memberships/MembershipPlanStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MembershipPlan } from "@/types/membership";
import { formatCurrency } from "@/utils/currency";

type MembershipPlanTableProps = {
  plans: MembershipPlan[];
};

export function MembershipPlanTable({ plans }: MembershipPlanTableProps) {
  if (plans.length === 0) {
    return (
      <EmptyState
        title="Nessun piano iscrizione"
        description="Crea il primo piano per proporre quote e durate default."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Piano</th>
            <th className="px-4 py-3 font-medium">Quota minima</th>
            <th className="px-4 py-3 font-medium">Durata</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <p className="font-medium">{plan.name}</p>
                {plan.description ? (
                  <p className="text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatCurrency(plan.minimumFee)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {plan.defaultDurationMonths} mesi
              </td>
              <td className="px-4 py-3">
                <MembershipPlanStatusBadge isActive={plan.isActive} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="icon">
                    <Link
                      href={`/settings/membership-plans?edit=${plan.id}`}
                      aria-label={`Modifica piano ${plan.name}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                  <form action={archiveMembershipPlanAction.bind(null, plan.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia piano ${plan.name}`}
                    >
                      <Archive aria-hidden="true" className="size-4" />
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
