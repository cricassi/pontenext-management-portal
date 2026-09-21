import Link from "next/link";
import { CreditCard, FileSpreadsheet, SlidersHorizontal, Tags } from "lucide-react";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { admin } = await requireActiveAdmin();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Impostazioni"
        description="Configurazioni disponibili per il portale."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visibilità dei campi</CardTitle>
            <CardDescription>Catalogo delle preferenze globali. Attivazione dei moduli prevista in M10-A2.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/settings/field-visibility">
                <SlidersHorizontal aria-hidden="true" className="mr-2 size-4" />
                Apri catalogo campi
              </Link>
            </Button>
          </CardContent>
        </Card>
        {admin.role === "super_admin" ? (
          <Card>
            <CardHeader>
              <CardTitle>Esportazione dati</CardTitle>
              <CardDescription>File Excel completo dei dati applicativi, inclusi gli archiviati.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/settings/data-import-export">
                  <FileSpreadsheet aria-hidden="true" className="mr-2 size-4" />
                  Apri esportazione
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Ruoli associativi</CardTitle>
            <CardDescription>
              Gestisci i ruoli assegnabili ai soci.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings/roles">
                <Tags aria-hidden="true" className="mr-2 size-4" />
                Apri ruoli
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Piani iscrizione</CardTitle>
            <CardDescription>
              Configura quote minime e durate predefinite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings/membership-plans">
                <CreditCard aria-hidden="true" className="mr-2 size-4" />
                Apri piani
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
