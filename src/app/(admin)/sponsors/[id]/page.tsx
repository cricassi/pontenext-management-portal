import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Pencil } from "lucide-react";
import {
  archiveSponsorAction,
  createSponsorContributionAction,
  updateSponsorContributionAction,
} from "@/app/(admin)/sponsors/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorContributionCardList } from "@/components/sponsors/SponsorContributionCardList";
import { SponsorContributionForm } from "@/components/sponsors/SponsorContributionForm";
import { SponsorContributionTable } from "@/components/sponsors/SponsorContributionTable";
import { SponsorDetail } from "@/components/sponsors/SponsorDetail";
import { Button } from "@/components/ui/Button";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  getSponsorById,
  getSponsorContributionById,
  getSponsorContributions,
} from "@/services/sponsors.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type SponsorPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function SponsorPage({
  params,
  searchParams,
}: SponsorPageProps) {
  await requireActiveAdmin();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const sponsor = await getSponsorById(id);

  if (!sponsor) {
    notFound();
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const editContributionId = readSearchParam(
    resolvedSearchParams,
    "editContribution",
  );

  if (editContributionId && !isUuid(editContributionId)) {
    notFound();
  }

  const [contributions, editingContribution] = await Promise.all([
    getSponsorContributions(sponsor.id),
    editContributionId
      ? getSponsorContributionById(sponsor.id, editContributionId)
      : Promise.resolve(null),
  ]);

  if (editContributionId && !editingContribution) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={sponsor.companyName}
        description="Scheda sponsor e contributi collegati."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/sponsors/${sponsor.id}/edit`}>
                <Pencil aria-hidden="true" className="mr-2 size-4" />
                Modifica
              </Link>
            </Button>
            <form action={archiveSponsorAction.bind(null, sponsor.id)}>
              <Button type="submit" variant="outline">
                <Archive aria-hidden="true" className="mr-2 size-4" />
                Archivia
              </Button>
            </form>
          </div>
        }
      />

      <SponsorDetail sponsor={sponsor} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-normal">Contributi</h2>
        <SponsorContributionTable
          sponsorId={sponsor.id}
          contributions={contributions}
        />
        <SponsorContributionCardList
          sponsorId={sponsor.id}
          contributions={contributions}
        />
      </section>

      <SponsorContributionForm
        contribution={editingContribution ?? undefined}
        action={
          editingContribution
            ? updateSponsorContributionAction.bind(
                null,
                sponsor.id,
                editingContribution.id,
              )
            : createSponsorContributionAction.bind(null, sponsor.id)
        }
        cancelHref={`/sponsors/${sponsor.id}`}
        submitLabel={
          editingContribution ? "Salva contributo" : "Registra contributo"
        }
      />
    </div>
  );
}
