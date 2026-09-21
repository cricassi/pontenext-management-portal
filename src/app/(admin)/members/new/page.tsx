import { MemberForm } from "@/components/members/MemberForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { createMemberAction } from "@/app/(admin)/members/actions";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getFieldVisibility } from "@/services/field-visibility.service";
import { memberVisibility } from "@/utils/member-visibility";
import { MemberVisibilityWarning } from "@/components/members/MemberVisibilityWarning";

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  await requireActiveAdmin();
  const snapshot = await getFieldVisibility(["members.create"]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo socio"
        description="Inserisci i dati anagrafici del socio."
      />
      <MemberVisibilityWarning warning={snapshot.warning} />
      <MemberForm action={createMemberAction} submitLabel="Crea socio" visibility={memberVisibility(snapshot.screens[0])} unavailable={!!snapshot.warning} />
    </div>
  );
}
