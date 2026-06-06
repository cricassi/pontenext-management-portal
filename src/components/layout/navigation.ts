import {
  BarChart3,
  Calendar,
  CreditCard,
  Home,
  Mail,
  Settings,
  ShieldCheck,
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
    enabled: false,
  },
  {
    label: "Iscrizioni",
    href: "/memberships",
    icon: CreditCard,
    enabled: false,
  },
  {
    label: "Scadenze",
    href: "/expirations",
    icon: Calendar,
    enabled: false,
  },
  {
    label: "Sponsor",
    href: "/sponsors",
    icon: ShieldCheck,
    enabled: false,
  },
  {
    label: "Eventi",
    href: "/events",
    icon: Calendar,
    enabled: false,
  },
  {
    label: "Email",
    href: "/email",
    icon: Mail,
    enabled: false,
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
    enabled: false,
  },
] as const;
