import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorCardList } from "@/components/sponsors/SponsorCardList";
import { SponsorFilters } from "@/components/sponsors/SponsorFilters";
import { SponsorTable } from "@/components/sponsors/SponsorTable";
import { Button } from "@/components/ui/Button";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getSponsors } from "@/services/sponsors.service";
import type { SponsorFilters as SponsorFiltersType } from "@/types/sponsor";

export const dynamic = "force-dynamic";

type SponsorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getFilters(
  params: Record<string, string | string[] | undefined>,
): SponsorFiltersType {
  const status = readSearchParam(params, "status");

  return {
    query: readSearchParam(params, "q")?.trim() || undefined,
    status:
      status === "active" || status === "inactive" || status === "archived"
        ? status
        : "all",
  };
}

export default async function SponsorsPage({ searchParams }: SponsorsPageProps) {
  await requireActiveAdmin();
  const params = (await searchParams) ?? {};
  const filters = getFilters(params);
  const sponsors = await getSponsors(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sponsor"
        description="Anagrafica sponsor e contributi ricevuti."
        action={
          <Button asChild>
            <Link href="/sponsors/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Nuovo sponsor
            </Link>
          </Button>
        }
      />

      <SponsorFilters filters={filters} />
      <SponsorTable sponsors={sponsors} />
      <SponsorCardList sponsors={sponsors} />
    </div>
  );
}
