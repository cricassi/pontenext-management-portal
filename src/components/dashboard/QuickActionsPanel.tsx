import Link from "next/link";
import { CreditCard, RefreshCw, UserPlus, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DashboardQuickAction } from "@/types/dashboard";

type QuickActionsPanelProps = {
  actions: DashboardQuickAction[];
};

const iconByActionLabel: Record<string, LucideIcon> = {
  "Nuovo socio": UserPlus,
  "Nuova membership": CreditCard,
  "Rinnovo rapido": RefreshCw,
};

export function QuickActionsPanel({ actions }: QuickActionsPanelProps) {
  return (
    <div className="grid min-w-0 max-w-full gap-3 overflow-x-hidden md:grid-cols-3">
      {actions.map((action) => {
        const Icon = iconByActionLabel[action.label] ?? UserPlus;

        return (
          <Link key={action.href} href={action.href} className="block min-w-0 max-w-full">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardHeader className="min-w-0 flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="min-w-0 break-words text-sm">
                  {action.label}
                </CardTitle>
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
