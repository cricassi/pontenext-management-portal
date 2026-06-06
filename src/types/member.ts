export const MEMBER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
} as const;

export type MemberStatus =
  (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  province: string | null;
  country: string;
  birthDate: string | null;
  fiscalCode: string | null;
  profession: string | null;
  notes: string | null;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type MemberFormValues = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  province: string | null;
  country: string;
  birthDate: string | null;
  fiscalCode: string | null;
  profession: string | null;
  notes: string | null;
  status: MemberStatus;
};

export type MemberRoleAssignment = {
  id: string;
  memberId: string;
  roleId: string;
  roleName: string;
  roleSortOrder: number;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  archivedAt: string | null;
};

export type MemberListItem = Member & {
  activeRoles: MemberRoleAssignment[];
  primaryRoleName: string | null;
};

export type MemberFilters = {
  query?: string;
  status?: MemberStatus | "all";
  roleId?: string | "all";
};
