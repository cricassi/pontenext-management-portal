import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { MembershipForm } from "@/components/memberships/MembershipForm";
import {
  createMembershipAction,
  createInitialMembershipAction,
  renewMembershipAction,
} from "@/app/(admin)/memberships/actions";
import { getQuickRenewalDefaults } from "@/services/expirations.service";
import { getMemberById, getMembers } from "@/services/members.service";
import { getActiveMembershipPlans } from "@/services/membership-plans.service";
import {
  getMembershipsByMemberId,
  getNextMembershipStartDate,
} from "@/services/memberships.service";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getInitialMembershipDefaults } from "@/utils/initial-membership";
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
  await requireActiveAdmin();
  const params = (await searchParams) ?? {};
  const memberIdParam = readSearchParam(params, "memberId");
  const modeParam = readSearchParam(params, "mode");
  const renewFromParam = readSearchParam(params, "renewFrom");
  const isQuickRenewal = modeParam === "quick";
  const isInitialMembership = modeParam === "initial";

  if (
    isInitialMembership &&
    (!memberIdParam || !isUuid(memberIdParam) || renewFromParam)
  ) {
    notFound();
  }

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
  const [members, plans, renewalStartDate, existingMemberships] = await Promise.all([
    isInitialMembership && selectedMemberId
      ? getMemberById(selectedMemberId).then((member) => (member ? [member] : []))
      : getMembers(),
    getActiveMembershipPlans(),
    selectedMemberId && !quickRenewalDefaults && !isInitialMembership
      ? getNextMembershipStartDate(selectedMemberId)
      : Promise.resolve(
          quickRenewalDefaults?.startDate ?? getTodayDateInputValue(),
        ),
    isInitialMembership && selectedMemberId
      ? getMembershipsByMemberId(selectedMemberId)
      : Promise.resolve([]),
  ]);
  const selectedMember = selectedMemberId
    ? members.find((member) => member.id === selectedMemberId)
    : undefined;

  if (selectedMemberId && !selectedMember) {
    notFound();
  }
  if (isInitialMembership && selectedMember?.status === "archived") {
    notFound();
  }
  if (isInitialMembership && existingMemberships.length > 0) {
    redirect(`/members/${selectedMemberId}`);
  }

  const initialDefaults = isInitialMembership
    ? getInitialMembershipDefaults(plans)
    : null;
  const defaultPlan = initialDefaults
    ? plans.find((plan) => plan.id === initialDefaults.membershipPlanId)
    : quickRenewalDefaults?.membershipPlanId
      ? (plans.find((plan) => plan.id === quickRenewalDefaults.membershipPlanId) ??
        plans[0])
      : plans[0];
  const startDate = initialDefaults?.startDate ?? renewalStartDate;
  const endDate =
    initialDefaults?.endDate ??
    quickRenewalDefaults?.endDate ??
    addMonthsToDateInputValue(startDate, defaultPlan?.defaultDurationMonths ?? 12);
  const defaultFee = quickRenewalDefaults?.minimumFee ?? defaultPlan?.minimumFee ?? 0;
  const expectedFee =
    quickRenewalDefaults?.expectedFee ?? defaultPlan?.minimumFee ?? 0;
  const isRenewal = Boolean(selectedMember) && !isInitialMembership;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          isInitialMembership
            ? "Prima iscrizione"
            : quickRenewalDefaults
              ? "Rinnovo rapido"
              : selectedMember
                ? "Rinnovo iscrizione"
                : "Nuova iscrizione"
        }
        description={
          isInitialMembership && selectedMember
            ? `${selectedMember.firstName} ${selectedMember.lastName}: nuova iscrizione.`
            : quickRenewalDefaults
              ? `${quickRenewalDefaults.memberName}: nuova iscrizione dal ${formatDate(startDate)} dopo la scadenza del ${formatDate(quickRenewalDefaults.previousEndDate)}.`
              : selectedMember
                ? `${selectedMember.firstName} ${selectedMember.lastName}: il rinnovo crea una nuova iscrizione storica.`
                : "Registra una nuova iscrizione collegata a un socio."
        }
      />

      <MembershipForm
        members={members.map(({ id, firstName, lastName }) => ({
          id,
          firstName,
          lastName,
        }))}
        plans={plans}
        initialMembership={isInitialMembership}
        defaults={{
          memberId: selectedMemberId,
          membershipPlanId: defaultPlan?.id,
          startDate,
          endDate,
          minimumFee: defaultFee,
          expectedFee,
        }}
        action={
          isInitialMembership && selectedMemberId
            ? createInitialMembershipAction.bind(null, selectedMemberId)
            : isRenewal
              ? renewMembershipAction
              : createMembershipAction
        }
        submitLabel={
          quickRenewalDefaults
            ? "Registra rinnovo rapido"
            : isRenewal
              ? "Registra rinnovo"
              : "Crea iscrizione"
        }
        cancelHref={
          isInitialMembership
            ? `/members/${selectedMemberId}`
            : quickRenewalDefaults ? "/expirations" : "/memberships"
        }
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
