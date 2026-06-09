import { EmailStatusBadge } from "@/components/email/EmailStatusBadge";
import type { EmailRecipient } from "@/types/email";

type EmailRecipientCardListProps = {
  recipients: EmailRecipient[];
};

function recipientTypeLabel(type: EmailRecipient["recipientType"]) {
  const labels = {
    member: "Socio",
    sponsor: "Sponsor",
    custom: "Custom",
  };

  return labels[type];
}

export function EmailRecipientCardList({
  recipients,
}: EmailRecipientCardListProps) {
  if (recipients.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {recipients.map((recipient) => (
        <article key={recipient.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-normal">
                {recipient.recipientName ?? recipient.email}
              </h3>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {recipient.email}
              </p>
            </div>
            <EmailStatusBadge status={recipient.status} />
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="text-right">
                {recipientTypeLabel(recipient.recipientType)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Errore</dt>
              <dd className="text-right">
                {recipient.errorMessage ?? recipient.skipReason ?? "-"}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
