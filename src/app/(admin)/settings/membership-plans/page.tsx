import { PageHeader } from "@/components/layout/PageHeader";
import { MembershipPlanCardList } from "@/components/memberships/MembershipPlanCardList";
import { MembershipPlanForm } from "@/components/memberships/MembershipPlanForm";
import { MembershipPlanTable } from "@/components/memberships/MembershipPlanTable";
import {
  createMembershipPlanAction,
  updateMembershipPlanAction,
} from "@/app/(admin)/settings/membership-plans/actions";
import {
  getMembershipPlanById,
  getMembershipPlans,
} from "@/services/membership-plans.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type MembershipPlansPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MembershipPlansPage({
  searchParams,
}: MembershipPlansPageProps) {
  const params = (await searchParams) ?? {};
  const editPlanId = readSearchParam(params, "edit");
  const editablePlanId = editPlanId && isUuid(editPlanId) ? editPlanId : null;
  const [plans, editPlan] = await Promise.all([
    getMembershipPlans(),
    editablePlanId ? getMembershipPlanById(editablePlanId) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Piani iscrizione"
        description="Quote minime e durate default per nuove iscrizioni."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <MembershipPlanTable plans={plans} />
          <MembershipPlanCardList plans={plans} />
        </div>
        <MembershipPlanForm
          plan={editPlan ?? undefined}
          action={
            editPlan
              ? updateMembershipPlanAction.bind(null, editPlan.id)
              : createMembershipPlanAction
          }
          submitLabel={editPlan ? "Salva piano" : "Crea piano"}
        />
      </div>
    </div>
  );
}
