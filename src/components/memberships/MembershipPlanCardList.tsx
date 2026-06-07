import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveMembershipPlanAction } from "@/app/(admin)/settings/membership-plans/actions";
import { MembershipPlanStatusBadge } from "@/components/memberships/MembershipPlanStatusBadge";
import { Button } from "@/components/ui/Button";
import type { MembershipPlan } from "@/types/membership";
import { formatCurrency } from "@/utils/currency";

type MembershipPlanCardListProps = {
  plans: MembershipPlan[];
};

export function MembershipPlanCardList({ plans }: MembershipPlanCardListProps) {
  if (plans.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {plans.map((plan) => (
        <article key={plan.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-normal">
                {plan.name}
              </h2>
              {plan.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
              ) : null}
            </div>
            <MembershipPlanStatusBadge isActive={plan.isActive} />
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Quota minima</dt>
              <dd className="text-right">{formatCurrency(plan.minimumFee)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Durata</dt>
              <dd className="text-right">{plan.defaultDurationMonths} mesi</dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button asChild variant="outline">
              <Link href={`/settings/membership-plans?edit=${plan.id}`}>
                <Pencil aria-hidden="true" className="mr-2 size-4" />
                Modifica
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
        </article>
      ))}
    </div>
  );
}
