import { MemberForm } from "@/components/members/MemberForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { createMemberAction } from "@/app/(admin)/members/actions";

export const dynamic = "force-dynamic";

export default function NewMemberPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo socio"
        description="Inserisci i dati anagrafici del socio."
      />
      <MemberForm action={createMemberAction} submitLabel="Crea socio" />
    </div>
  );
}
