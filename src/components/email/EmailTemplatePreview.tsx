import { Badge } from "@/components/ui/Badge";
import type { EmailTemplate } from "@/types/email";
import {
  getUnknownTemplateVariables,
  renderEmailText,
} from "@/utils/email";

type EmailTemplatePreviewProps = {
  template?: Pick<EmailTemplate, "subject" | "body"> | null;
  subject?: string;
  body?: string;
};

export function EmailTemplatePreview({
  template,
  subject,
  body,
}: EmailTemplatePreviewProps) {
  const previewSubject = subject ?? template?.subject ?? "Oggetto campagna";
  const previewBody = body ?? template?.body ?? "";
  const unknownVariables = getUnknownTemplateVariables(
    `${previewSubject}\n${previewBody}`,
  );

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-normal">Anteprima</h3>
        <Badge variant={unknownVariables.length > 0 ? "warning" : "muted"}>
          {unknownVariables.length > 0 ? "Variabili da verificare" : "Testo"}
        </Badge>
      </div>
      <p className="mt-3 text-sm font-medium">
        {renderEmailText(previewSubject, {
          campaignSubject: previewSubject,
          recipientName: "Mario Rossi",
        })}
      </p>
      <div className="mt-3 whitespace-pre-wrap rounded-md border bg-background p-3 text-sm leading-6">
        {renderEmailText(previewBody, {
          campaignSubject: previewSubject,
          recipientName: "Mario Rossi",
        }) || "Nessun contenuto."}
      </div>
      {unknownVariables.length > 0 ? (
        <p className="mt-3 text-sm text-amber-700">
          Variabili non riconosciute: {unknownVariables.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
