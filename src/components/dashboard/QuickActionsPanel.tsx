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
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => {
        const Icon = iconByActionLabel[action.label] ?? UserPlus;

        return (
          <Link key={action.href} href={action.href} className="block">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="text-sm">{action.label}</CardTitle>
                <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
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
