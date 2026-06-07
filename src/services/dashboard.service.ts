import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import { MEMBER_STATUS, type MemberStatus } from "@/types/member";
import {
  MEMBERSHIP_STATUS,
  type MembershipStatus,
} from "@/types/membership";
import type {
  DashboardActionItem,
  DashboardExpirationItem,
  DashboardKpi,
  DashboardPageData,
  DashboardQuickAction,
  DashboardRenewalItem,
} from "@/types/dashboard";
import type { ExpirationStatus } from "@/types/expiration";
import { PAYMENT_STATUS, type PaymentStatus } from "@/types/payment";
import {
  addDaysToDateInputValue,
  getTodayDateInputValue,
} from "@/utils/date";
import { buildMembershipRenewalHref } from "@/utils/membership-links";

const DASHBOARD_LIST_LIMIT = 5;
const MS_PER_DAY = 86_400_000;

type DashboardMembershipRow = {
  id: string;
  member_id: string;
  membership_plan_id: string | null;
  start_date: string;
  end_date: string;
  expected_fee: number | string;
  paid_amount: number | string;
  payment_status: PaymentStatus;
  status: MembershipStatus;
  archived_at: string | null;
  created_at: string;
  members: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    status: MemberStatus;
    archived_at: string | null;
  } | null;
  membership_plans: {
    id: string;
    name: string;
    archived_at: string | null;
  } | null;
};

type DashboardMembershipItem = {
  membershipId: string;
  memberId: string;
  memberName: string;
  memberEmail: string | null;
  membershipPlanName: string | null;
  startDate: string;
  endDate: string;
  expectedFee: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  membershipStatus: MembershipStatus;
  daysUntilExpiration: number;
  expirationStatus: ExpirationStatus;
  createdAt: string;
};

const dashboardMembershipSelect =
  "id, member_id, membership_plan_id, start_date, end_date, expected_fee, paid_amount, payment_status, status, archived_at, created_at, members(id, first_name, last_name, email, status, archived_at), membership_plans(id, name, archived_at)";

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function dateInputToUtcTime(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function getDaysUntilExpiration(endDate: string) {
  return Math.round(
    (dateInputToUtcTime(endDate) - dateInputToUtcTime(getTodayDateInputValue())) /
      MS_PER_DAY,
  );
}

function getExpirationStatus(daysUntilExpiration: number): ExpirationStatus {
  if (daysUntilExpiration < 0) {
    return "expired";
  }

  if (daysUntilExpiration <= 30) {
    return "within_30";
  }

  if (daysUntilExpiration <= 60) {
    return "within_60";
  }

  if (daysUntilExpiration <= 90) {
    return "within_90";
  }

  return "future";
}

function getEffectiveMembershipStatus(
  status: MembershipStatus,
  endDate: string,
): MembershipStatus {
  if (status === MEMBERSHIP_STATUS.CANCELLED) {
    return MEMBERSHIP_STATUS.CANCELLED;
  }

  return endDate < getTodayDateInputValue()
    ? MEMBERSHIP_STATUS.EXPIRED
    : MEMBERSHIP_STATUS.ACTIVE;
}

function isOperationalMembershipRow(row: DashboardMembershipRow) {
  return (
    row.archived_at === null &&
    row.status !== MEMBERSHIP_STATUS.CANCELLED &&
    row.members !== null &&
    row.members.archived_at === null &&
    row.members.status !== MEMBER_STATUS.ARCHIVED
  );
}

function mapMembershipItem(row: DashboardMembershipRow): DashboardMembershipItem {
  const daysUntilExpiration = getDaysUntilExpiration(row.end_date);

  return {
    membershipId: row.id,
    memberId: row.member_id,
    memberName: row.members
      ? `${row.members.first_name} ${row.members.last_name}`
      : "Socio non disponibile",
    memberEmail: row.members?.email ?? null,
    membershipPlanName: row.membership_plans?.name ?? null,
    startDate: row.start_date,
    endDate: row.end_date,
    expectedFee: toNumber(row.expected_fee),
    paidAmount: toNumber(row.paid_amount),
    paymentStatus: row.payment_status,
    membershipStatus: getEffectiveMembershipStatus(row.status, row.end_date),
    daysUntilExpiration,
    expirationStatus: getExpirationStatus(daysUntilExpiration),
    createdAt: row.created_at,
  };
}

function sortByNearestExpiration<T extends { endDate: string; memberName: string }>(
  items: T[],
) {
  return items.toSorted((left, right) => {
    if (left.endDate === right.endDate) {
      return left.memberName.localeCompare(right.memberName, "it");
    }

    return left.endDate.localeCompare(right.endDate);
  });
}

function sortByNewestCreatedAt<T extends { createdAt: string; memberName: string }>(
  items: T[],
) {
  return items.toSorted((left, right) => {
    if (left.createdAt === right.createdAt) {
      return left.memberName.localeCompare(right.memberName, "it");
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getLatestMembershipsByMember(
  rows: DashboardMembershipRow[],
): DashboardMembershipItem[] {
  const latestByMember = new Map<string, DashboardMembershipRow>();

  for (const row of rows) {
    if (isOperationalMembershipRow(row) && !latestByMember.has(row.member_id)) {
      latestByMember.set(row.member_id, row);
    }
  }

  return Array.from(latestByMember.values()).map(mapMembershipItem);
}

async function getActiveMembersCount() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { count, error } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .is("archived_at", null)
    .eq("status", MEMBER_STATUS.ACTIVE);

  if (error) {
    throw new Error("Impossibile caricare i conteggi dashboard.");
  }

  return count ?? 0;
}

async function getNewMembersLast30Count(sinceDate: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { count, error } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .is("archived_at", null)
    .gte("created_at", sinceDate);

  if (error) {
    throw new Error("Impossibile caricare i conteggi dashboard.");
  }

  return count ?? 0;
}

async function getMembershipRows() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(dashboardMembershipSelect)
    .is("archived_at", null)
    .neq("status", MEMBERSHIP_STATUS.CANCELLED)
    .order("member_id", { ascending: true })
    .order("end_date", { ascending: false })
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<DashboardMembershipRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i dati dashboard.");
  }

  return data.filter(isOperationalMembershipRow);
}

function isIncompleteFee(item: DashboardMembershipItem) {
  return (
    item.paymentStatus === PAYMENT_STATUS.UNPAID ||
    item.paymentStatus === PAYMENT_STATUS.PARTIAL
  );
}

function isRecentRenewal(
  item: DashboardMembershipItem,
  allItems: DashboardMembershipItem[],
  sinceDate: string,
) {
  if (item.createdAt.slice(0, 10) < sinceDate) {
    return false;
  }

  return allItems.some(
    (other) =>
      other.memberId === item.memberId &&
      other.membershipId !== item.membershipId &&
      other.createdAt < item.createdAt,
  );
}

function toExpirationPreview(
  item: DashboardMembershipItem,
): DashboardExpirationItem {
  return {
    membershipId: item.membershipId,
    memberId: item.memberId,
    memberName: item.memberName,
    membershipPlanName: item.membershipPlanName,
    endDate: item.endDate,
    daysUntilExpiration: item.daysUntilExpiration,
    expirationStatus: item.expirationStatus,
    paymentStatus: item.paymentStatus,
    href: `/memberships/${item.membershipId}`,
    renewalHref: buildMembershipRenewalHref(item.memberId, item.membershipId),
  };
}

function toRenewalPreview(item: DashboardMembershipItem): DashboardRenewalItem {
  return {
    membershipId: item.membershipId,
    memberId: item.memberId,
    memberName: item.memberName,
    membershipPlanName: item.membershipPlanName,
    startDate: item.startDate,
    endDate: item.endDate,
    createdAt: item.createdAt,
    expectedFee: item.expectedFee,
    paidAmount: item.paidAmount,
    paymentStatus: item.paymentStatus,
    href: `/memberships/${item.membershipId}`,
  };
}

function buildActionItems(
  latestMemberships: DashboardMembershipItem[],
  allMemberships: DashboardMembershipItem[],
) {
  const itemsByMembershipId = new Map<string, DashboardActionItem>();

  for (const item of latestMemberships) {
    if (item.daysUntilExpiration < 0) {
      itemsByMembershipId.set(item.membershipId, {
        ...toActionItem(item, "expired_membership", 10),
        actionLabel: "Rinnovo rapido",
        actionHref: buildMembershipRenewalHref(item.memberId, item.membershipId),
      });
    }
  }

  for (const item of allMemberships.filter(isIncompleteFee)) {
    if (!itemsByMembershipId.has(item.membershipId)) {
      itemsByMembershipId.set(item.membershipId, {
        ...toActionItem(item, "incomplete_fee", 20),
        actionLabel: "Apri iscrizione",
        actionHref: `/memberships/${item.membershipId}`,
      });
    }
  }

  for (const item of latestMemberships) {
    if (
      item.daysUntilExpiration >= 0 &&
      item.daysUntilExpiration <= 30 &&
      !itemsByMembershipId.has(item.membershipId)
    ) {
      itemsByMembershipId.set(item.membershipId, {
        ...toActionItem(item, "expiring_membership", 30),
        actionLabel: "Rinnovo rapido",
        actionHref: buildMembershipRenewalHref(item.memberId, item.membershipId),
      });
    }
  }

  return Array.from(itemsByMembershipId.values())
    .toSorted((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.endDate.localeCompare(right.endDate);
    })
    .slice(0, DASHBOARD_LIST_LIMIT);
}

function toActionItem(
  item: DashboardMembershipItem,
  kind: DashboardActionItem["kind"],
  priority: number,
) {
  return {
    id: `${kind}-${item.membershipId}`,
    kind,
    priority,
    memberId: item.memberId,
    memberName: item.memberName,
    memberEmail: item.memberEmail,
    membershipId: item.membershipId,
    membershipPlanName: item.membershipPlanName,
    endDate: item.endDate,
    expectedFee: item.expectedFee,
    paidAmount: item.paidAmount,
    paymentStatus: item.paymentStatus,
    membershipStatus: item.membershipStatus,
    daysUntilExpiration: item.daysUntilExpiration,
    expirationStatus: item.expirationStatus,
    href: `/memberships/${item.membershipId}`,
    actionHref: `/memberships/${item.membershipId}`,
    actionLabel: "Apri",
  };
}

function buildKpis(params: {
  activeMembersCount: number;
  expiringWithin30Count: number;
  expiredMembershipsCount: number;
  incompleteFeesCount: number;
  newMembersLast30Count: number;
  renewalsLast30Count: number;
}): DashboardKpi[] {
  return [
    {
      key: "active_members",
      label: "Soci attivi",
      value: params.activeMembersCount,
      description: "Stato anagrafico active",
      href: "/members?status=active",
    },
    {
      key: "expiring_30",
      label: "Scadenze entro 30 giorni",
      value: params.expiringWithin30Count,
      description: "Ultima membership rinnovabile",
      href: "/expirations?window=30",
    },
    {
      key: "expired_memberships",
      label: "Membership scadute",
      value: params.expiredMembershipsCount,
      description: "Da rinnovare o verificare",
      href: "/expirations?filter=expired",
    },
    {
      key: "incomplete_fees",
      label: "Quote non saldate",
      value: params.incompleteFeesCount,
      description: "Stato pagamento non completo",
      href: "/memberships",
    },
    {
      key: "new_members_30",
      label: "Nuovi soci 30 giorni",
      value: params.newMembersLast30Count,
      description: "Anagrafiche create di recente",
      href: "/members",
    },
    {
      key: "renewals_30",
      label: "Rinnovi 30 giorni",
      value: params.renewalsLast30Count,
      description: "Nuove righe membership storiche",
      href: "/memberships",
    },
  ];
}

function buildQuickActions(): DashboardQuickAction[] {
  return [
    {
      label: "Nuovo socio",
      description: "Inserisci una nuova anagrafica.",
      href: "/members/new",
    },
    {
      label: "Nuova membership",
      description: "Registra una nuova iscrizione.",
      href: "/memberships/new",
    },
    {
      label: "Rinnovo rapido",
      description: "Apri le scadenze e rinnova una membership.",
      href: "/expirations",
    },
  ];
}

export async function getDashboardPageData(): Promise<DashboardPageData> {
  const sinceDate = addDaysToDateInputValue(getTodayDateInputValue(), -30);
  const [activeMembersCount, newMembersLast30Count, membershipRows] =
    await Promise.all([
      getActiveMembersCount(),
      getNewMembersLast30Count(sinceDate),
      getMembershipRows(),
    ]);

  const allMemberships = membershipRows.map(mapMembershipItem);
  const latestMemberships = getLatestMembershipsByMember(membershipRows);
  const expiringWithin30 = latestMemberships.filter(
    (item) => item.daysUntilExpiration >= 0 && item.daysUntilExpiration <= 30,
  );
  const expiredMemberships = latestMemberships.filter(
    (item) => item.daysUntilExpiration < 0,
  );
  const incompleteFees = allMemberships.filter(isIncompleteFee);
  const recentRenewals = allMemberships.filter((item) =>
    isRecentRenewal(item, allMemberships, sinceDate),
  );

  return {
    kpis: buildKpis({
      activeMembersCount,
      expiringWithin30Count: expiringWithin30.length,
      expiredMembershipsCount: expiredMemberships.length,
      incompleteFeesCount: incompleteFees.length,
      newMembersLast30Count,
      renewalsLast30Count: recentRenewals.length,
    }),
    actionItems: buildActionItems(latestMemberships, allMemberships),
    upcomingExpirations: sortByNearestExpiration(expiringWithin30)
      .slice(0, DASHBOARD_LIST_LIMIT)
      .map(toExpirationPreview),
    recentRenewals: sortByNewestCreatedAt(recentRenewals)
      .slice(0, DASHBOARD_LIST_LIMIT)
      .map(toRenewalPreview),
    quickActions: buildQuickActions(),
  };
}
