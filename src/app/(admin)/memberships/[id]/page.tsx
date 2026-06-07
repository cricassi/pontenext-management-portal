import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MembershipDetail } from "@/components/memberships/MembershipDetail";
import { PaymentCardList } from "@/components/payments/PaymentCardList";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { Button } from "@/components/ui/Button";
import {
  archiveMembershipAction,
  createPaymentAction,
} from "@/app/(admin)/memberships/actions";
import { getMembershipById } from "@/services/memberships.service";
import { getPaymentsByMembershipId } from "@/services/payments.service";
import { MEMBERSHIP_STATUS } from "@/types/membership";
import { isUuid } from "@/utils/id";
import { buildMembershipRenewalHref } from "@/utils/membership-links";

export const dynamic = "force-dynamic";

type MembershipPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MembershipPage({ params }: MembershipPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const membership = await getMembershipById(id);

  if (!membership) {
    notFound();
  }

  const payments = await getPaymentsByMembershipId(membership.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={membership.memberName}
        description="Dettaglio iscrizione e pagamenti collegati."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link
                href={buildMembershipRenewalHref(
                  membership.memberId,
                  membership.status === MEMBERSHIP_STATUS.CANCELLED
                    ? undefined
                    : membership.id,
                )}
              >
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Rinnova
              </Link>
            </Button>
            <form
              action={archiveMembershipAction.bind(
                null,
                membership.memberId,
                membership.id,
              )}
            >
              <Button type="submit" variant="outline">
                <Archive aria-hidden="true" className="mr-2 size-4" />
                Archivia
              </Button>
            </form>
          </div>
        }
      />

      <MembershipDetail membership={membership} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-normal">Pagamenti</h2>
        <PaymentTable membershipId={membership.id} payments={payments} />
        <PaymentCardList membershipId={membership.id} payments={payments} />
      </section>

      <PaymentForm action={createPaymentAction.bind(null, membership.id)} />
    </div>
  );
}
