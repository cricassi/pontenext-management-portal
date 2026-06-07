import { notFound } from "next/navigation";
import { updateSponsorAction } from "@/app/(admin)/sponsors/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorForm } from "@/components/sponsors/SponsorForm";
import { getSponsorById } from "@/services/sponsors.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type EditSponsorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSponsorPage({
  params,
}: EditSponsorPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const sponsor = await getSponsorById(id);

  if (!sponsor) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Modifica sponsor" description={sponsor.companyName} />
      <SponsorForm
        sponsor={sponsor}
        action={updateSponsorAction.bind(null, sponsor.id)}
        submitLabel="Salva modifiche"
      />
    </div>
  );
}
