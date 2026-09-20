import { redirect } from "next/navigation";
import { ShieldAlert, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataExportButton } from "@/components/settings/DataExportButton";
import { requireActiveAdmin } from "@/services/admin-auth.service";

export const dynamic = "force-dynamic";

export default async function DataImportExportPage() {
  const { admin } = await requireActiveAdmin();
  if (admin.role !== "super_admin") redirect("/settings");

  return (
    <div className="flex w-full min-w-0 max-w-4xl flex-col gap-6 [overflow-wrap:anywhere]">
      <PageHeader title="Esportazione dati" description="Dati applicativi in un unico file Excel, inclusi i record archiviati. Riservato ai super admin attivi." />
      <section aria-labelledby="backup-warning" className="flex gap-3 border-y border-border bg-white px-4 py-5 sm:px-6">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 space-y-2">
          <h2 id="backup-warning" className="text-base font-semibold">Excel non sostituisce un backup completo</h2>
          <p className="text-sm leading-6 text-muted-foreground">Questo file serve per portabilit&agrave; e consultazione. Per ripristinare il sistema occorrono un dump PostgreSQL/Supabase e una gestione separata di Auth e configurazioni.</p>
        </div>
      </section>
      <div className="grid min-w-0 gap-6 sm:grid-cols-2">
        <section aria-labelledby="included-data" className="min-w-0 space-y-3">
          <h2 id="included-data" className="text-base font-semibold">Dati inclusi</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Soci, ruoli e assegnazioni.</li>
            <li>Piani, iscrizioni e pagamenti non contabili.</li>
            <li>Sponsor, contributi, eventi e collegamenti.</li>
            <li>Template, campagne email e storico destinatari.</li>
            <li>UUID, relazioni, date e record archiviati.</li>
          </ul>
        </section>
        <section aria-labelledby="excluded-data" className="min-w-0 space-y-3">
          <h2 id="excluded-data" className="text-base font-semibold">Dati esclusi</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Utenti Supabase Auth e anagrafica amministratori.</li>
            <li>Password, sessioni, token e chiavi API.</li>
            <li>Schema, policy RLS e configurazioni riservate.</li>
            <li>Configurazioni hosting e provider email.</li>
          </ul>
        </section>
      </div>
      <section aria-labelledby="export-limits" className="space-y-4 border-t border-border pt-6">
        <h2 id="export-limits" className="flex items-center gap-2 text-base font-semibold"><FileSpreadsheet aria-hidden="true" className="size-5 shrink-0 text-primary" />File Excel completo</h2>
        <p className="text-sm leading-6 text-muted-foreground">15 fogli, fino a 10.000 record complessivi, 10 MiB di dati normalizzati e 3 MiB di file. Se un limite viene superato, il download viene bloccato: nessun file parziale.</p>
        <p className="text-sm leading-6 text-muted-foreground">Esporta quando non sono in corso modifiche. Due letture confrontate rilevano variazioni, ma non garantiscono uno snapshot transazionale. Il file contiene dati personali: conservalo con accesso limitato.</p>
        <p className="text-sm leading-6 text-muted-foreground">Questo workbook non sar&agrave; accettato dalla futura funzione di importazione nuovi soci. Nessun import &egrave; disponibile in questa fase.</p>
        <DataExportButton />
      </section>
    </div>
  );
}
