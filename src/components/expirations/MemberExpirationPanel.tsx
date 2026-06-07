import Link from "next/link";
import { CalendarClock, RefreshCw } from "lucide-react";
import { ExpirationStatusBadge } from "@/components/expirations/ExpirationStatusBadge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ExpirationItem } from "@/types/expiration";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { getDaysUntilExpirationLabel } from "@/utils/expiration";
import { buildMembershipRenewalHref } from "@/utils/membership-links";

type MemberExpirationPanelProps = {
  memberId: string;
  expiration: ExpirationItem | null;
};

export function MemberExpirationPanel({
  memberId,
  expiration,
}: MemberExpirationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Scadenza iscrizione</CardTitle>
            <CardDescription>
              Ultima iscrizione rinnovabile del socio.
            </CardDescription>
          </div>
          {expiration ? (
            <ExpirationStatusBadge status={expiration.expirationStatus} />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {expiration ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Piano</p>
                <p className="mt-1 font-medium">
                  {expiration.membershipPlanName ?? "Personalizzata"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Scadenza</p>
                <p className="mt-1 font-medium">{formatDate(expiration.endDate)}</p>
                <p className="text-xs text-muted-foreground">
                  {getDaysUntilExpirationLabel(expiration.daysUntilExpiration)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Quota</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(expiration.expectedFee)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pagato</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(expiration.paidAmount)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:justify-center">
              <Button asChild variant="outline">
                <Link href={`/memberships/${expiration.membershipId}`}>
                  <CalendarClock aria-hidden="true" className="mr-2 size-4" />
                  Apri iscrizione
                </Link>
              </Button>
              <Button asChild>
                <Link
                  href={buildMembershipRenewalHref(
                    expiration.memberId,
                    expiration.membershipId,
                  )}
                >
                  <RefreshCw aria-hidden="true" className="mr-2 size-4" />
                  Rinnovo rapido
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Nessuna iscrizione rinnovabile"
            description="Crea la prima iscrizione per abilitare gestione scadenze e rinnovi."
            actionHref={buildMembershipRenewalHref(memberId)}
            actionLabel="Nuova iscrizione"
          />
        )}
      </CardContent>
    </Card>
  );
}
