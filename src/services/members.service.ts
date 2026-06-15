import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  MEMBER_SORT_OPTIONS,
  MEMBER_STATUS,
  type Member,
  type MemberFilters,
  type MemberFormValues,
  type MemberListItem,
  type MemberRoleAssignment,
  type MemberSortOption,
  type MemberStatus,
} from "@/types/member";
import { readOptionalString, readRequiredString } from "@/utils/form";

type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  country: string;
  birth_date: string | null;
  fiscal_code: string | null;
  profession: string | null;
  notes: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type MemberRoleRow = {
  id: string;
  member_id: string;
  role_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  archived_at: string | null;
  roles: {
    id: string;
    name: string;
    sort_order: number;
    archived_at: string | null;
  } | null;
};

type MemberValidationResult =
  | { ok: true; values: MemberFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const memberSelect =
  "id, first_name, last_name, email, phone, address, city, postal_code, province, country, birth_date, fiscal_code, profession, notes, status, created_at, updated_at, archived_at";

const memberCollator = new Intl.Collator("it", {
  numeric: true,
  sensitivity: "base",
});

const memberStatusSortOrder: Record<MemberStatus, number> = {
  active: 0,
  inactive: 1,
  archived: 2,
};

function mapMember(row: MemberRow): Member {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    province: row.province,
    country: row.country,
    birthDate: row.birth_date,
    fiscalCode: row.fiscal_code,
    profession: row.profession,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapMemberRole(row: MemberRoleRow): MemberRoleAssignment | null {
  if (!row.roles) {
    return null;
  }

  return {
    id: row.id,
    memberId: row.member_id,
    roleId: row.role_id,
    roleName: row.roles.name,
    roleSortOrder: row.roles.sort_order,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    archivedAt: row.archived_at,
  };
}

function normalizeDateInput(value: string | null) {
  return value && value.length > 0 ? value : null;
}

function isMemberStatus(value: string): value is MemberStatus {
  return Object.values(MEMBER_STATUS).includes(value as MemberStatus);
}

function isAssignmentActive(assignment: MemberRoleAssignment) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    !assignment.archivedAt &&
    assignment.startDate <= today &&
    (!assignment.endDate || assignment.endDate >= today)
  );
}

function getPrimaryRoleName(assignments: MemberRoleAssignment[]) {
  const activeRoles = assignments.filter(isAssignmentActive);

  if (activeRoles.length === 0) {
    return null;
  }

  const [primaryRole] = activeRoles.toSorted((first, second) => {
    if (first.roleSortOrder !== second.roleSortOrder) {
      return first.roleSortOrder - second.roleSortOrder;
    }

    return first.roleName.localeCompare(second.roleName, "it");
  });

  return primaryRole.roleName;
}

function memberMatchesQuery(member: Member, query: string) {
  const normalizedQuery = query.toLowerCase();
  const searchable = [
    member.firstName,
    member.lastName,
    member.email,
    member.phone,
    member.city,
    member.fiscalCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

function compareText(first: string | null, second: string | null) {
  return memberCollator.compare(first ?? "", second ?? "");
}

function compareMemberName(first: MemberListItem, second: MemberListItem) {
  const lastNameComparison = compareText(first.lastName, second.lastName);

  if (lastNameComparison !== 0) {
    return lastNameComparison;
  }

  const firstNameComparison = compareText(first.firstName, second.firstName);

  if (firstNameComparison !== 0) {
    return firstNameComparison;
  }

  return first.createdAt.localeCompare(second.createdAt);
}

function sortMembers(
  members: MemberListItem[],
  sort: MemberSortOption = MEMBER_SORT_OPTIONS.NAME_ASC,
) {
  return members.toSorted((first, second) => {
    switch (sort) {
      case MEMBER_SORT_OPTIONS.NAME_DESC:
        return compareMemberName(second, first);
      case MEMBER_SORT_OPTIONS.CREATED_DESC:
        return (
          second.createdAt.localeCompare(first.createdAt) ||
          compareMemberName(first, second)
        );
      case MEMBER_SORT_OPTIONS.CREATED_ASC:
        return (
          first.createdAt.localeCompare(second.createdAt) ||
          compareMemberName(first, second)
        );
      case MEMBER_SORT_OPTIONS.STATUS_ASC:
        return (
          memberStatusSortOrder[first.status] -
            memberStatusSortOrder[second.status] ||
          compareMemberName(first, second)
        );
      case MEMBER_SORT_OPTIONS.CITY_ASC:
        return (
          compareText(first.city, second.city) ||
          compareMemberName(first, second)
        );
      case MEMBER_SORT_OPTIONS.NAME_ASC:
      default:
        return compareMemberName(first, second);
    }
  });
}

export function validateMemberFormData(
  formData: FormData,
): MemberValidationResult {
  const firstName = readRequiredString(formData, "firstName");
  const lastName = readRequiredString(formData, "lastName");
  const email = readOptionalString(formData, "email")?.toLowerCase() ?? null;
  const phone = readOptionalString(formData, "phone");
  const address = readOptionalString(formData, "address");
  const city = readOptionalString(formData, "city");
  const postalCode = readOptionalString(formData, "postalCode");
  const province = readOptionalString(formData, "province")?.toUpperCase() ?? null;
  const country = readRequiredString(formData, "country") || "Italia";
  const birthDate = normalizeDateInput(readOptionalString(formData, "birthDate"));
  const fiscalCode =
    readOptionalString(formData, "fiscalCode")?.toUpperCase() ?? null;
  const profession = readOptionalString(formData, "profession");
  const notes = readOptionalString(formData, "notes");
  const status = readRequiredString(formData, "status");
  const errors: Record<string, string> = {};

  if (!firstName) {
    errors.firstName = "Inserisci il nome.";
  }

  if (!lastName) {
    errors.lastName = "Inserisci il cognome.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Inserisci un indirizzo email valido.";
  }

  if (province && province.length !== 2) {
    errors.province = "Usa la sigla provincia di 2 caratteri.";
  }

  if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) {
    errors.birthDate = "La data di nascita non puo' essere futura.";
  }

  if (!isMemberStatus(status)) {
    errors.status = "Seleziona uno stato anagrafico valido.";
  }

  if (Object.keys(errors).length > 0 || !isMemberStatus(status)) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati del socio.",
    };
  }

  return {
    ok: true,
    values: {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      province,
      country,
      birthDate,
      fiscalCode,
      profession,
      notes,
      status,
    },
  };
}

export async function getMembers(filters: MemberFilters = {}) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("members")
    .select(memberSelect)
    .is("archived_at", null)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.returns<MemberRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i soci.");
  }

  let members = data.map(mapMember);

  if (filters.query) {
    members = members.filter((member) =>
      memberMatchesQuery(member, filters.query ?? ""),
    );
  }

  const rolesByMemberId = await getRoleAssignmentsByMemberIds(
    members.map((member) => member.id),
  );

  const items: MemberListItem[] = members.map((member) => {
    const activeRoles = (rolesByMemberId.get(member.id) ?? []).filter(
      isAssignmentActive,
    );

    return {
      ...member,
      activeRoles,
      primaryRoleName: getPrimaryRoleName(activeRoles),
    };
  });

  const filteredItems =
    filters.roleId && filters.roleId !== "all"
      ? items.filter((member) =>
          member.activeRoles.some((role) => role.roleId === filters.roleId),
        )
      : items;

  return sortMembers(filteredItems, filters.sort);
}

export async function getMemberById(memberId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("members")
    .select(memberSelect)
    .eq("id", memberId)
    .is("archived_at", null)
    .maybeSingle<MemberRow>();

  if (error) {
    throw new Error("Impossibile caricare il socio.");
  }

  return data ? mapMember(data) : null;
}

export async function createMember(values: MemberFormValues) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("members")
    .insert(mapMemberValues(values))
    .select(memberSelect)
    .single<MemberRow>();

  if (error) {
    throw new Error("Impossibile creare il socio.");
  }

  return mapMember(data);
}

export async function updateMember(
  memberId: string,
  values: MemberFormValues,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("members")
    .update(mapMemberValues(values))
    .eq("id", memberId)
    .is("archived_at", null)
    .select(memberSelect)
    .single<MemberRow>();

  if (error) {
    throw new Error("Impossibile aggiornare il socio.");
  }

  return mapMember(data);
}

export async function archiveMember(memberId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("members")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare il socio.");
  }
}

export async function getRoleAssignmentsByMemberIds(memberIds: string[]) {
  const assignmentsByMemberId = new Map<string, MemberRoleAssignment[]>();

  if (memberIds.length === 0) {
    return assignmentsByMemberId;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("member_roles")
    .select(
      "id, member_id, role_id, start_date, end_date, notes, archived_at, roles(id, name, sort_order, archived_at)",
    )
    .in("member_id", memberIds)
    .is("archived_at", null)
    .returns<MemberRoleRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i ruoli dei soci.");
  }

  for (const row of data) {
    const assignment = mapMemberRole(row);

    if (!assignment) {
      continue;
    }

    const assignments = assignmentsByMemberId.get(assignment.memberId) ?? [];
    assignments.push(assignment);
    assignmentsByMemberId.set(assignment.memberId, assignments);
  }

  return assignmentsByMemberId;
}

function mapMemberValues(values: MemberFormValues) {
  return {
    first_name: values.firstName,
    last_name: values.lastName,
    email: values.email,
    phone: values.phone,
    address: values.address,
    city: values.city,
    postal_code: values.postalCode,
    province: values.province,
    country: values.country,
    birth_date: values.birthDate,
    fiscal_code: values.fiscalCode,
    profession: values.profession,
    notes: values.notes,
    status: values.status,
  };
}
