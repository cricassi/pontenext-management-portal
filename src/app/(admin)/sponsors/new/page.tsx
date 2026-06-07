import { createSponsorAction } from "@/app/(admin)/sponsors/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorForm } from "@/components/sponsors/SponsorForm";

export const dynamic = "force-dynamic";

export default function NewSponsorPage() {
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
