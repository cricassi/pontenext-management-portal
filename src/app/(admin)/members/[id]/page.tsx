import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Pencil } from "lucide-react";
import { archiveMemberAction } from "@/app/(admin)/members/actions";
import { MemberDetail } from "@/components/members/MemberDetail";
import { MemberRolesPanel } from "@/components/members/MemberRolesPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getMemberRoleAssignments } from "@/services/member-roles.service";
import { getMemberById } from "@/services/members.service";
import { getAssignableRoles } from "@/services/roles.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type MemberPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberPage({ params }: MemberPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const member = await getMemberById(id);

  if (!member) {
    notFound();
  }

  const [assignments, roles] = await Promise.all([
    getMemberRoleAssignments(id),
    getAssignableRoles(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${member.firstName} ${member.lastName}`}
        description="Scheda anagrafica e ruoli associativi."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/members/${member.id}/edit`}>
                <Pencil aria-hidden="true" className="mr-2 size-4" />
                Modifica
              </Link>
            </Button>
            <form action={archiveMemberAction.bind(null, member.id)}>
              <Button type="submit" variant="outline">
                <Archive aria-hidden="true" className="mr-2 size-4" />
                Archivia
              </Button>
            </form>
          </div>
        }
      />

      <MemberDetail member={member} />
      <MemberRolesPanel memberId={member.id} assignments={assignments} roles={roles} />
    </div>
  );
}
