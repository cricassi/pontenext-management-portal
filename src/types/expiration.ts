import type { MembershipStatus } from "@/types/membership";
import type { PaymentStatus } from "@/types/payment";

export const EXPIRATION_FILTERS = {
  EXPIRED: "expired",
  WITHIN_30: "30",
  WITHIN_60: "60",
  WITHIN_90: "90",
} as const;

export type ExpirationFilter =
  (typeof EXPIRATION_FILTERS)[keyof typeof EXPIRATION_FILTERS];

export type ExpirationStatus =
  | "expired"
  | "within_30"
  | "within_60"
  | "within_90"
  | "future";

export type ExpirationFilters = {
  filter: ExpirationFilter;
  query?: string;
};

export type ExpirationItem = {
  membershipId: string;
  memberId: string;
  memberName: string;
  memberEmail: string | null;
  membershipPlanId: string | null;
  membershipPlanName: string | null;
  startDate: string;
  endDate: string;
  expectedFee: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  membershipStatus: MembershipStatus;
  daysUntilExpiration: number;
  expirationStatus: ExpirationStatus;
};

export type ExpirationSummary = {
  expiredCount: number;
  within30Count: number;
  within60Count: number;
  within90Count: number;
};

export type QuickRenewalDefaults = {
  sourceMembershipId: string;
  memberId: string;
  memberName: string;
  previousEndDate: string;
  membershipPlanId: string | undefined;
  startDate: string;
  endDate: string;
  minimumFee: number;
  expectedFee: number;
};
