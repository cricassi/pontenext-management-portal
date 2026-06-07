import Link from "next/link";
import { DashboardActionItems } from "@/components/dashboard/DashboardActionItems";
import { DashboardKpiGrid } from "@/components/dashboard/DashboardKpiGrid";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { RecentRenewals } from "@/components/dashboard/RecentRenewals";
import { UpcomingExpirations } from "@/components/dashboard/UpcomingExpirations";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getDashboardPageData } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardPageData();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Vista operativa su soci, scadenze, rinnovi e quote da seguire con i dati disponibili dopo M3."
        action={
          <Button asChild>
            <Link href="/members/new">Nuovo socio</Link>
          </Button>
        }
      />

      <DashboardKpiGrid kpis={data.kpis} />

      <DashboardSection
        title="Azioni rapide"
        description="Accessi diretti ai flussi amministrativi gia' disponibili."
      >
        <QuickActionsPanel actions={data.quickActions} />
      </DashboardSection>

      <DashboardSection
        title="Da gestire subito"
        description="Scadenze, rinnovi e quote aperte che richiedono attenzione operativa."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/expirations">Apri scadenze</Link>
          </Button>
        }
      >
        <DashboardActionItems items={data.actionItems} />
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Prossime scadenze"
          description="Ultime membership rinnovabili in scadenza entro 30 giorni."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/expirations?window=30">Vedi tutte</Link>
            </Button>
          }
        >
          <UpcomingExpirations expirations={data.upcomingExpirations} />
        </DashboardSection>

        <DashboardSection
          title="Ultimi rinnovi"
          description="Nuove membership create negli ultimi 30 giorni dopo una membership precedente."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/memberships">Apri iscrizioni</Link>
            </Button>
          }
        >
          <RecentRenewals renewals={data.recentRenewals} />
        </DashboardSection>
      </div>
    </div>
  );
}
