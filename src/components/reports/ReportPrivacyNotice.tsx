import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export function ReportPrivacyNotice() {
  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col gap-3 p-4 text-sm md:flex-row md:items-start">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-medium text-foreground">
            Gli export contengono dati personali e operativi.
          </p>
          <p className="break-words leading-6 text-muted-foreground">
            I file sono generati solo per admin autenticati, non vengono salvati
            nel database o nello storage e non includono PDF, chiavi API,
            fatturazione, IVA o prima nota.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
