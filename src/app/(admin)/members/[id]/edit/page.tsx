import { notFound } from "next/navigation";
import { updateMemberAction } from "@/app/(admin)/members/actions";
import { MemberForm } from "@/components/members/MemberForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { getMemberById } from "@/services/members.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type EditMemberPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

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
        member={member}
        action={updateMemberAction.bind(null, member.id)}
        submitLabel="Salva modifiche"
      />
    </div>
  );
}
