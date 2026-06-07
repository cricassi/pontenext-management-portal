import { createSponsorAction } from "@/app/(admin)/sponsors/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorForm } from "@/components/sponsors/SponsorForm";
import { requireActiveAdmin } from "@/services/admin-auth.service";

export const dynamic = "force-dynamic";

export default async function NewSponsorPage() {
  await requireActiveAdmin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo sponsor"
        description="Inserisci i dati anagrafici dello sponsor."
      />
      <SponsorForm action={createSponsorAction} submitLabel="Crea sponsor" />
    </div>
  );
}
