import type { MemberStatus } from "@/types/member";

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
