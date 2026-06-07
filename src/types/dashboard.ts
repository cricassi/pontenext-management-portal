import type { ExpirationStatus } from "@/types/expiration";
import type { MembershipStatus } from "@/types/membership";
import type { PaymentStatus } from "@/types/payment";

export type DashboardKpiKey =
  | "active_members"
  | "expiring_30"
  | "expired_memberships"
  | "incomplete_fees"
  | "new_members_30"
  | "renewals_30";

export type DashboardKpi = {
  key: DashboardKpiKey;
  label: string;
  value: number;
  description: string;
  href: string;
};

export type DashboardActionKind =
  | "expired_membership"
  | "expiring_membership"
  | "incomplete_fee";

export type DashboardActionItem = {
  id: string;
  kind: DashboardActionKind;
  priority: number;
  memberId: string;
  memberName: string;
  memberEmail: string | null;
  membershipId: string;
  membershipPlanName: string | null;
  endDate: string;
  expectedFee: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  membershipStatus: MembershipStatus;
  daysUntilExpiration: number;
  expirationStatus: ExpirationStatus;
  href: string;
  actionHref: string;
  actionLabel: string;
};

export type DashboardExpirationItem = {
  membershipId: string;
  memberId: string;
  memberName: string;
  membershipPlanName: string | null;
  endDate: string;
  daysUntilExpiration: number;
  expirationStatus: ExpirationStatus;
  paymentStatus: PaymentStatus;
  href: string;
  renewalHref: string;
};

export type DashboardRenewalItem = {
  membershipId: string;
  memberId: string;
  memberName: string;
  membershipPlanName: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  expectedFee: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  href: string;
};

export type DashboardQuickAction = {
  label: string;
  description: string;
  href: string;
};

export type DashboardPageData = {
  kpis: DashboardKpi[];
  actionItems: DashboardActionItem[];
  upcomingExpirations: DashboardExpirationItem[];
  recentRenewals: DashboardRenewalItem[];
  quickActions: DashboardQuickAction[];
};
