import Link from "next/link";
import { Plus } from "lucide-react";
import { MemberCardList } from "@/components/members/MemberCardList";
import { MemberFilters } from "@/components/members/MemberFilters";
import { MemberTable } from "@/components/members/MemberTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getMembers } from "@/services/members.service";
import { getAssignableRoles } from "@/services/roles.service";
import {
  MEMBER_SORT_OPTIONS,
  type MemberFilters as MemberFiltersType,
  type MemberSortOption,
} from "@/types/member";

export const dynamic = "force-dynamic";

type MembersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function isMemberSortOption(value: string | undefined): value is MemberSortOption {
  return Object.values(MEMBER_SORT_OPTIONS).includes(value as MemberSortOption);
}

function getFilters(
  params: Record<string, string | string[] | undefined>,
): MemberFiltersType {
  const status = readSearchParam(params, "status");
  const roleId = readSearchParam(params, "roleId");
  const sort = readSearchParam(params, "sort");

  return {
    query: readSearchParam(params, "q")?.trim() || undefined,
    status:
      status === "active" || status === "inactive" || status === "archived"
        ? status
        : "all",
    roleId: roleId && roleId !== "all" ? roleId : "all",
    sort: isMemberSortOption(sort) ? sort : MEMBER_SORT_OPTIONS.NAME_ASC,
  };
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = (await searchParams) ?? {};
  const filters = getFilters(params);
  const [roles, members] = await Promise.all([
    getAssignableRoles(),
    getMembers(filters),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Soci"
        description="Anagrafica soci e ruoli associativi."
        action={
          <Button asChild>
            <Link href="/members/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Nuovo socio
            </Link>
          </Button>
        }
      />

      <MemberFilters filters={filters} roles={roles} />
      <MemberTable members={members} />
      <MemberCardList members={members} />
    </div>
  );
}
