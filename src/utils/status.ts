import type { MemberStatus } from "@/types/member";
import type { MembershipStatus } from "@/types/membership";
import type { PaymentMethod, PaymentStatus } from "@/types/payment";

export function getMemberStatusLabel(status: MemberStatus) {
  switch (status) {
    case "active":
      return "Attivo";
    case "inactive":
      return "Inattivo";
    case "archived":
      return "Archiviato";
  }
}

export function getMemberStatusVariant(status: MemberStatus) {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "archived":
      return "muted";
  }
}

export function getMembershipStatusLabel(status: MembershipStatus) {
  switch (status) {
    case "active":
      return "Attiva";
    case "expired":
      return "Scaduta";
    case "cancelled":
      return "Annullata";
  }
}

export function getMembershipStatusVariant(status: MembershipStatus) {
  switch (status) {
    case "active":
      return "success";
    case "expired":
      return "warning";
    case "cancelled":
      return "muted";
  }
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "unpaid":
      return "Non pagata";
    case "partial":
      return "Parziale";
    case "paid":
      return "Pagata";
    case "overpaid":
      return "Eccedente";
  }
}

export function getPaymentStatusVariant(status: PaymentStatus) {
  switch (status) {
    case "unpaid":
      return "warning";
    case "partial":
      return "outline";
    case "paid":
      return "success";
    case "overpaid":
      return "secondary";
  }
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "cash":
      return "Contanti";
    case "bank_transfer":
      return "Bonifico";
    case "pos":
      return "POS";
    case "other":
      return "Altro";
  }
}
