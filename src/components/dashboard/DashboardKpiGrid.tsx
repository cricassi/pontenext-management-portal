import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  RefreshCw,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { DashboardKpi, DashboardKpiKey } from "@/types/dashboard";

type DashboardKpiGridProps = {
  kpis: DashboardKpi[];
};

const iconByKpiKey: Record<DashboardKpiKey, LucideIcon> = {
  active_members: UserCheck,
  expiring_30: CalendarClock,
  expired_memberships: AlertTriangle,
  incomplete_fees: CreditCard,
  new_members_30: UserPlus,
  renewals_30: RefreshCw,
};

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = iconByKpiKey[kpi.key];

        return (
          <Link key={kpi.key} href={kpi.href} className="block">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
                <CardTitle className="text-sm leading-5">{kpi.label}</CardTitle>
                <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-normal">
                  {kpi.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
