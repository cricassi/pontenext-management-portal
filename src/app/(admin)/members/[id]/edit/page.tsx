import { notFound } from "next/navigation";
import { updateMemberAction } from "@/app/(admin)/members/actions";
import { MemberForm } from "@/components/members/MemberForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { getMemberById } from "@/services/members.service";
import { isUuid } from "@/utils/id";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getFieldVisibility } from "@/services/field-visibility.service";
import { memberFormView, memberVisibility } from "@/utils/member-visibility";
import { MemberVisibilityWarning } from "@/components/members/MemberVisibilityWarning";

export const dynamic = "force-dynamic";

type EditMemberPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  await requireActiveAdmin();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const snapshot = await getFieldVisibility(["members.edit"]);
  const visibility = memberVisibility(snapshot.screens[0]);
  const member = await getMemberById(id);

  if (!member) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Modifica socio"
        description={`${member.firstName} ${member.lastName}`}
      />
      <MemberForm
        member={memberFormView(member, visibility)}
        visibility={visibility}
        unavailable={!!snapshot.warning}
        action={updateMemberAction.bind(null, member.id)}
        submitLabel="Salva modifiche"
      />
      <MemberVisibilityWarning warning={snapshot.warning} />
    </div>
  );
}
