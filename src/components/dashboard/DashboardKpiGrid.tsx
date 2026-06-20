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
    <div className="grid min-w-0 max-w-full gap-4 overflow-x-clip md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = iconByKpiKey[kpi.key];

        return (
          <Link key={kpi.key} href={kpi.href} className="block min-w-0 max-w-full">
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardHeader className="min-w-0 flex-row items-start justify-between gap-3 pb-3">
                <CardTitle className="min-w-0 break-words text-sm leading-5">
                  {kpi.label}
                </CardTitle>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="break-words text-3xl font-semibold tracking-normal text-foreground">
                  {kpi.value}
                </p>
                <p className="mt-2 break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
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
