import {
  BarChart3,
  Calendar,
  CreditCard,
  Handshake,
  Home,
  Mail,
  Settings,
  Users,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
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
    icon: CreditCard,
    enabled: true,
  },
  {
    label: "Scadenze",
    href: "/expirations",
    icon: Calendar,
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
    icon: Calendar,
    enabled: true,
  },
  {
    label: "Email",
    href: "/email",
    icon: Mail,
    enabled: true,
  },
  {
    label: "Report",
    href: "/reports",
    icon: BarChart3,
    enabled: false,
  },
  {
    label: "Impostazioni",
    href: "/settings",
    icon: Settings,
    enabled: true,
  },
] as const;
