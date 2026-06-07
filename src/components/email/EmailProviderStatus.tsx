import { MailCheck, MailWarning } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { EmailProviderStatus as EmailProviderStatusType } from "@/types/email";

type EmailProviderStatusProps = {
  status: EmailProviderStatusType;
};

export function EmailProviderStatus({ status }: EmailProviderStatusProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        {status.isConfigured ? (
          <MailCheck
            aria-hidden="true"
            className="mt-0.5 size-5 text-emerald-600"
          />
        ) : (
          <MailWarning
            aria-hidden="true"
            className="mt-0.5 size-5 text-amber-600"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-normal">
              Provider Resend
            </h2>
            <Badge variant={status.isConfigured ? "success" : "warning"}>
              {status.isConfigured ? "Configurato" : "Da configurare"}
            </Badge>
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">API key</dt>
              <dd>{status.hasApiKey ? "Presente" : "Mancante"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mittente</dt>
              <dd className="break-all">{status.fromAddress ?? "Mancante"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
