import type { PaymentStatus } from "@/types/payment";

export const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;

export type MembershipStatus =
  (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

export type MembershipPlan = {
  id: string;
  name: string;
  description: string | null;
  minimumFee: number;
  defaultDurationMonths: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type MembershipPlanFormValues = {
  name: string;
  description: string | null;
  minimumFee: number;
  defaultDurationMonths: number;
  isActive: boolean;
  sortOrder: number;
};

export type Membership = {
  id: string;
  memberId: string;
  memberName: string;
  membershipPlanId: string | null;
  membershipPlanName: string | null;
  startDate: string;
  endDate: string;
  minimumFee: number;
  expectedFee: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: MembershipStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type MembershipFormValues = {
  memberId: string;
  membershipPlanId: string | null;
  startDate: string;
  endDate: string;
  minimumFee: number;
  expectedFee: number;
  notes: string | null;
};

export type MembershipFilters = {
  query?: string;
  status?: MembershipStatus | "all";
  paymentStatus?: PaymentStatus | "all";
};
