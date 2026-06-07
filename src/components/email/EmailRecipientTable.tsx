import { EmailStatusBadge } from "@/components/email/EmailStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EmailRecipient } from "@/types/email";
import { formatDateTime } from "@/utils/date";

type EmailRecipientTableProps = {
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

export function EmailRecipientTable({ recipients }: EmailRecipientTableProps) {
  if (recipients.length === 0) {
    return (
      <EmptyState
        title="Nessun destinatario"
        description="Genera lo snapshot destinatari prima di confermare l'invio."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Destinatario</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 font-medium">Invio</th>
            <th className="px-4 py-3 font-medium">Errore</th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((recipient) => (
            <tr key={recipient.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <p className="font-medium">
                  {recipient.recipientName ?? recipient.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {recipient.email}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {recipientTypeLabel(recipient.recipientType)}
              </td>
              <td className="px-4 py-3">
                <EmailStatusBadge status={recipient.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {recipient.sentAt ? formatDateTime(recipient.sentAt) : "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {recipient.errorMessage ?? recipient.skipReason ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
