export const PAYMENT_METHOD = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  POS: "pos",
  OTHER: "other",
} as const;

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
  OVERPAID: "overpaid",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export type Payment = {
  id: string;
  membershipId: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type PaymentFormValues = {
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
};
