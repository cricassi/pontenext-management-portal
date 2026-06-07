import { getActiveMembershipPlans } from "@/services/membership-plans.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import { MEMBER_STATUS, type MemberStatus } from "@/types/member";
import {
  MEMBERSHIP_STATUS,
  type MembershipStatus,
} from "@/types/membership";
import type {
  ExpirationFilter,
  ExpirationFilters,
  ExpirationItem,
  ExpirationStatus,
  ExpirationSummary,
  QuickRenewalDefaults,
} from "@/types/expiration";
import type { PaymentStatus } from "@/types/payment";
import {
  addDaysToDateInputValue,
  addMonthsToDateInputValue,
  getTodayDateInputValue,
} from "@/utils/date";

const MS_PER_DAY = 86_400_000;

type ExpirationMembershipRow = {
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
    minimum_fee: number | string;
    default_duration_months: number;
    is_active: boolean;
    archived_at: string | null;
  } | null;
};

const expirationMembershipSelect =
  "id, member_id, membership_plan_id, start_date, end_date, expected_fee, paid_amount, payment_status, status, archived_at, created_at, members(id, first_name, last_name, email, status, archived_at), membership_plans(id, name, minimum_fee, default_duration_months, is_active, archived_at)";

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

function isRenewableRow(row: ExpirationMembershipRow) {
  return (
    row.archived_at === null &&
    row.status !== MEMBERSHIP_STATUS.CANCELLED &&
    row.members !== null &&
    row.members.archived_at === null &&
    row.members.status !== MEMBER_STATUS.ARCHIVED
  );
}

function mapExpirationItem(row: ExpirationMembershipRow): ExpirationItem {
  const daysUntilExpiration = getDaysUntilExpiration(row.end_date);

  return {
    membershipId: row.id,
    memberId: row.member_id,
    memberName: row.members
      ? `${row.members.first_name} ${row.members.last_name}`
      : "Socio non disponibile",
    memberEmail: row.members?.email ?? null,
    membershipPlanId: row.membership_plan_id,
    membershipPlanName: row.membership_plans?.name ?? null,
    startDate: row.start_date,
    endDate: row.end_date,
    expectedFee: toNumber(row.expected_fee),
    paidAmount: toNumber(row.paid_amount),
    paymentStatus: row.payment_status,
    membershipStatus: getEffectiveMembershipStatus(row.status, row.end_date),
    daysUntilExpiration,
    expirationStatus: getExpirationStatus(daysUntilExpiration),
  };
}

function itemMatchesQuery(item: ExpirationItem, query: string) {
  const normalizedQuery = query.toLowerCase();
  const searchable = [
    item.memberName,
    item.memberEmail,
    item.membershipPlanName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

function itemMatchesFilter(item: ExpirationItem, filter: ExpirationFilter) {
  if (filter === "expired") {
    return item.daysUntilExpiration < 0;
  }

  const windowDays = Number.parseInt(filter, 10);

  return (
    Number.isInteger(windowDays) &&
    item.daysUntilExpiration >= 0 &&
    item.daysUntilExpiration <= windowDays
  );
}

function sortByNearestExpiration(items: ExpirationItem[]) {
  return items.toSorted((left, right) => {
    if (left.endDate === right.endDate) {
      return left.memberName.localeCompare(right.memberName, "it");
    }

    return left.endDate.localeCompare(right.endDate);
  });
}

function buildExpirationSummary(items: ExpirationItem[]): ExpirationSummary {
  return {
    expiredCount: items.filter((item) => item.daysUntilExpiration < 0).length,
    within30Count: items.filter(
      (item) => item.daysUntilExpiration >= 0 && item.daysUntilExpiration <= 30,
    ).length,
    within60Count: items.filter(
      (item) => item.daysUntilExpiration >= 0 && item.daysUntilExpiration <= 60,
    ).length,
    within90Count: items.filter(
      (item) => item.daysUntilExpiration >= 0 && item.daysUntilExpiration <= 90,
    ).length,
  };
}

async function getLatestRenewableMembershipRows() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(expirationMembershipSelect)
    .is("archived_at", null)
    .neq("status", MEMBERSHIP_STATUS.CANCELLED)
    .order("member_id", { ascending: true })
    .order("end_date", { ascending: false })
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ExpirationMembershipRow[]>();

  if (error) {
    throw new Error("Impossibile caricare le scadenze.");
  }

  const latestByMember = new Map<string, ExpirationMembershipRow>();

  for (const row of data) {
    if (isRenewableRow(row) && !latestByMember.has(row.member_id)) {
      latestByMember.set(row.member_id, row);
    }
  }

  return Array.from(latestByMember.values());
}

async function getLatestRenewableMembershipRowByMemberId(memberId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(expirationMembershipSelect)
    .eq("member_id", memberId)
    .is("archived_at", null)
    .neq("status", MEMBERSHIP_STATUS.CANCELLED)
    .order("end_date", { ascending: false })
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExpirationMembershipRow>();

  if (error) {
    throw new Error("Impossibile caricare la scadenza del socio.");
  }

  return data && isRenewableRow(data) ? data : null;
}

export async function getExpirationsPageData(filters: ExpirationFilters) {
  const items = sortByNearestExpiration(
    (await getLatestRenewableMembershipRows()).map(mapExpirationItem),
  );
  const summary = buildExpirationSummary(items);
  let expirations = items.filter((item) =>
    itemMatchesFilter(item, filters.filter),
  );

  if (filters.query) {
    expirations = expirations.filter((item) =>
      itemMatchesQuery(item, filters.query ?? ""),
    );
  }

  return {
    expirations,
    summary,
  };
}

export async function getMemberExpiration(memberId: string) {
  const row = await getLatestRenewableMembershipRowByMemberId(memberId);

  return row ? mapExpirationItem(row) : null;
}

export async function getQuickRenewalDefaults(
  sourceMembershipId: string,
): Promise<QuickRenewalDefaults | null> {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(expirationMembershipSelect)
    .eq("id", sourceMembershipId)
    .is("archived_at", null)
    .neq("status", MEMBERSHIP_STATUS.CANCELLED)
    .maybeSingle<ExpirationMembershipRow>();

  if (error) {
    throw new Error("Impossibile preparare il rinnovo rapido.");
  }

  if (!data || !isRenewableRow(data)) {
    return null;
  }

  const activePlans = await getActiveMembershipPlans();
  const sourcePlan =
    data.membership_plans &&
    data.membership_plans.is_active &&
    data.membership_plans.archived_at === null
      ? activePlans.find((plan) => plan.id === data.membership_plans?.id)
      : undefined;
  const defaultPlan = sourcePlan ?? activePlans[0];
  const startDate = addDaysToDateInputValue(data.end_date, 1);
  const durationMonths = defaultPlan?.defaultDurationMonths ?? 12;
  const minimumFee = defaultPlan?.minimumFee ?? 0;

  return {
    sourceMembershipId,
    memberId: data.member_id,
    memberName: data.members
      ? `${data.members.first_name} ${data.members.last_name}`
      : "Socio non disponibile",
    previousEndDate: data.end_date,
    membershipPlanId: defaultPlan?.id,
    startDate,
    endDate: addMonthsToDateInputValue(startDate, durationMonths),
    minimumFee,
    expectedFee: minimumFee,
  };
}
