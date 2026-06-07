import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { MembershipForm } from "@/components/memberships/MembershipForm";
import {
  createMembershipAction,
  renewMembershipAction,
} from "@/app/(admin)/memberships/actions";
import { getQuickRenewalDefaults } from "@/services/expirations.service";
import { getMembers } from "@/services/members.service";
import { getActiveMembershipPlans } from "@/services/membership-plans.service";
import { getNextMembershipStartDate } from "@/services/memberships.service";
import {
  addMonthsToDateInputValue,
  formatDate,
  getTodayDateInputValue,
} from "@/utils/date";
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
  const modeParam = readSearchParam(params, "mode");
  const renewFromParam = readSearchParam(params, "renewFrom");
  const isQuickRenewal = modeParam === "quick";

  if (isQuickRenewal && (!renewFromParam || !isUuid(renewFromParam))) {
    notFound();
  }

  const quickRenewalDefaults =
    isQuickRenewal && renewFromParam
      ? await getQuickRenewalDefaults(renewFromParam)
      : null;

  if (isQuickRenewal && !quickRenewalDefaults) {
    notFound();
  }

  if (
    quickRenewalDefaults &&
    memberIdParam &&
    memberIdParam !== quickRenewalDefaults.memberId
  ) {
    notFound();
  }

  const selectedMemberId =
    quickRenewalDefaults?.memberId ??
    (memberIdParam && isUuid(memberIdParam) ? memberIdParam : undefined);
  const [members, plans, renewalStartDate] = await Promise.all([
    getMembers(),
    getActiveMembershipPlans(),
    selectedMemberId && !quickRenewalDefaults
      ? getNextMembershipStartDate(selectedMemberId)
      : Promise.resolve(
          quickRenewalDefaults?.startDate ?? getTodayDateInputValue(),
        ),
  ]);
  const selectedMember = selectedMemberId
    ? members.find((member) => member.id === selectedMemberId)
    : undefined;

  if (selectedMemberId && !selectedMember) {
    notFound();
  }

  const defaultPlan = quickRenewalDefaults?.membershipPlanId
    ? (plans.find((plan) => plan.id === quickRenewalDefaults.membershipPlanId) ??
      plans[0])
    : plans[0];
  const startDate = renewalStartDate;
  const endDate =
    quickRenewalDefaults?.endDate ??
    addMonthsToDateInputValue(startDate, defaultPlan?.defaultDurationMonths ?? 12);
  const defaultFee = quickRenewalDefaults?.minimumFee ?? defaultPlan?.minimumFee ?? 0;
  const expectedFee =
    quickRenewalDefaults?.expectedFee ?? defaultPlan?.minimumFee ?? 0;
  const isRenewal = Boolean(selectedMember);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          quickRenewalDefaults
            ? "Rinnovo rapido"
            : selectedMember
              ? "Rinnovo iscrizione"
              : "Nuova iscrizione"
        }
        description={
          quickRenewalDefaults
            ? `${quickRenewalDefaults.memberName}: nuova iscrizione dal ${formatDate(startDate)} dopo la scadenza del ${formatDate(quickRenewalDefaults.previousEndDate)}.`
            : selectedMember
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
          expectedFee,
        }}
        action={isRenewal ? renewMembershipAction : createMembershipAction}
        submitLabel={
          quickRenewalDefaults
            ? "Registra rinnovo rapido"
            : isRenewal
              ? "Registra rinnovo"
              : "Crea iscrizione"
        }
        cancelHref={quickRenewalDefaults ? "/expirations" : "/memberships"}
        context={
          quickRenewalDefaults
            ? {
                title: "Rinnovo rapido",
                description: `Origine: iscrizione conclusa il ${formatDate(quickRenewalDefaults.previousEndDate)}.`,
                sourceHref: `/memberships/${quickRenewalDefaults.sourceMembershipId}`,
                sourceLabel: "Apri iscrizione precedente",
              }
            : undefined
        }
      />
    </div>
  );
}
