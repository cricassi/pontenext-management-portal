import Link from "next/link";
import { AlertTriangle, CalendarClock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { ExpirationFilter, ExpirationSummary as Summary } from "@/types/expiration";
import { getExpirationFilterLabel } from "@/utils/expiration";

type SummaryItem = {
  filter: ExpirationFilter;
  count: number;
  href: string;
};

type ExpirationSummaryProps = {
  summary: Summary;
};

export function ExpirationSummary({ summary }: ExpirationSummaryProps) {
  const items: SummaryItem[] = [
    {
      filter: "expired",
      count: summary.expiredCount,
      href: "/expirations?filter=expired",
    },
    {
      filter: "30",
      count: summary.within30Count,
      href: "/expirations?window=30",
    },
    {
      filter: "60",
      count: summary.within60Count,
      href: "/expirations?window=60",
    },
    {
      filter: "90",
      count: summary.within90Count,
      href: "/expirations?window=90",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.filter === "expired" ? AlertTriangle : CalendarClock;

        return (
          <Link key={item.filter} href={item.href} className="block">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="text-sm">
                  {getExpirationFilterLabel(item.filter)}
                </CardTitle>
                <Icon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-normal">
                  {item.count}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
