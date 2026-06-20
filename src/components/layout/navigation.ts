import {
  CalendarClock,
  CalendarDays,
  FileSpreadsheet,
  Handshake,
  IdCard,
  LayoutDashboard,
  Send,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Soci",
    href: "/members",
    icon: Users,
    enabled: true,
  },
  {
    label: "Iscrizioni",
    href: "/memberships",
    icon: IdCard,
    enabled: true,
  },
  {
    label: "Scadenze",
    href: "/expirations",
    icon: CalendarClock,
    enabled: true,
  },
  {
    label: "Sponsor",
    href: "/sponsors",
    icon: Handshake,
    enabled: true,
  },
  {
    label: "Eventi",
    href: "/events",
    icon: CalendarDays,
    enabled: true,
  },
  {
    label: "Email",
    href: "/email",
    icon: Send,
    enabled: true,
  },
  {
    label: "Report",
    href: "/reports",
    icon: FileSpreadsheet,
    enabled: true,
  },
  {
    label: "Impostazioni",
    href: "/settings",
    icon: SlidersHorizontal,
    enabled: true,
  },
] as const;

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
