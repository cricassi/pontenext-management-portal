import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MembershipCardList } from "@/components/memberships/MembershipCardList";
import { MembershipFilters } from "@/components/memberships/MembershipFilters";
import { MembershipTable } from "@/components/memberships/MembershipTable";
import { Button } from "@/components/ui/Button";
import { getMemberships } from "@/services/memberships.service";
import type { MembershipFilters as MembershipFiltersType } from "@/types/membership";

export const dynamic = "force-dynamic";

type MembershipsPageProps = {
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
): MembershipFiltersType {
  const status = readSearchParam(params, "status");
  const paymentStatus = readSearchParam(params, "paymentStatus");

  return {
    query: readSearchParam(params, "q")?.trim() || undefined,
    status:
      status === "active" || status === "expired" || status === "cancelled"
        ? status
        : "all",
    paymentStatus:
      paymentStatus === "unpaid" ||
      paymentStatus === "partial" ||
      paymentStatus === "paid" ||
      paymentStatus === "overpaid"
        ? paymentStatus
        : "all",
  };
}

export default async function MembershipsPage({
  searchParams,
}: MembershipsPageProps) {
  const params = (await searchParams) ?? {};
  const filters = getFilters(params);
  const memberships = await getMemberships(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Iscrizioni"
        description="Storico iscrizioni, rinnovi e pagamenti non contabili."
        action={
          <Button asChild>
            <Link href="/memberships/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Nuova iscrizione
            </Link>
          </Button>
        }
      />

      <MembershipFilters filters={filters} />
      <MembershipTable memberships={memberships} />
      <MembershipCardList memberships={memberships} />
    </div>
  );
}
