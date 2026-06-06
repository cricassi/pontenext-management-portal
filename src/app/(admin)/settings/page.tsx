import Link from "next/link";
import { Tags } from "lucide-react";
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

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Impostazioni"
        description="Configurazioni disponibili per il portale."
      />

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
    </div>
  );
}
