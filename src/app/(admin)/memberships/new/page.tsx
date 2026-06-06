import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { MembershipForm } from "@/components/memberships/MembershipForm";
import {
  createMembershipAction,
  renewMembershipAction,
} from "@/app/(admin)/memberships/actions";
import { getMembers } from "@/services/members.service";
import { getActiveMembershipPlans } from "@/services/membership-plans.service";
import { getNextMembershipStartDate } from "@/services/memberships.service";
import { addMonthsToDateInputValue, getTodayDateInputValue } from "@/utils/date";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type NewMembershipPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewMembershipPage({
  searchParams,
}: NewMembershipPageProps) {
  const params = (await searchParams) ?? {};
  const memberIdParam = readSearchParam(params, "memberId");
  const selectedMemberId =
    memberIdParam && isUuid(memberIdParam) ? memberIdParam : undefined;
  const [members, plans, renewalStartDate] = await Promise.all([
    getMembers(),
    getActiveMembershipPlans(),
    selectedMemberId
      ? getNextMembershipStartDate(selectedMemberId)
      : Promise.resolve(getTodayDateInputValue()),
  ]);
  const selectedMember = selectedMemberId
    ? members.find((member) => member.id === selectedMemberId)
    : undefined;

  if (selectedMemberId && !selectedMember) {
    notFound();
  }

  const defaultPlan = plans[0];
  const startDate = renewalStartDate;
  const endDate = addMonthsToDateInputValue(
    startDate,
    defaultPlan?.defaultDurationMonths ?? 12,
  );
  const defaultFee = defaultPlan?.minimumFee ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={selectedMember ? "Rinnovo iscrizione" : "Nuova iscrizione"}
        description={
          selectedMember
            ? `${selectedMember.firstName} ${selectedMember.lastName}: il rinnovo crea una nuova iscrizione storica.`
            : "Registra una nuova iscrizione collegata a un socio."
        }
      />

      <MembershipForm
        members={members}
        plans={plans}
        defaults={{
          memberId: selectedMemberId,
          membershipPlanId: defaultPlan?.id,
          startDate,
          endDate,
          minimumFee: defaultFee,
          expectedFee: defaultFee,
        }}
        action={selectedMember ? renewMembershipAction : createMembershipAction}
        submitLabel={selectedMember ? "Registra rinnovo" : "Crea iscrizione"}
      />
    </div>
  );
}
