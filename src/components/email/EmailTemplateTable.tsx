import Link from "next/link";
import { Archive, CopyPlus } from "lucide-react";
import { archiveEmailTemplateAction } from "@/app/(admin)/email/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EmailTemplate } from "@/types/email";
import { formatDate } from "@/utils/date";

type EmailTemplateTableProps = {
  templates: EmailTemplate[];
};

function audienceLabel(audience: EmailTemplate["audience"]) {
  if (audience === "members") {
    return "Soci";
  }

  if (audience === "sponsors") {
    return "Sponsor";
  }

  return "Soci e sponsor";
}

export function EmailTemplateTable({ templates }: EmailTemplateTableProps) {
  if (templates.length === 0) {
    return (
      <EmptyState
        title="Nessun template email"
        description="Crea il primo template per riutilizzare oggetto e corpo nelle campagne."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Template</th>
            <th className="px-4 py-3 font-medium">Pubblico</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 font-medium">Aggiornato</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <p className="font-medium">{template.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {template.subject}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {audienceLabel(template.audience)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={template.isActive ? "success" : "muted"}>
                  {template.isActive ? "Attivo" : "Non attivo"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(template.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/email/campaigns?template=${template.id}`}>
                      <CopyPlus aria-hidden="true" className="mr-2 size-4" />
                      Usa
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/email/templates?edit=${template.id}`}>
                      Modifica
                    </Link>
                  </Button>
                  <form
                    action={archiveEmailTemplateAction.bind(null, template.id)}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia ${template.name}`}
                    >
                      <Archive aria-hidden="true" className="size-4" />
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
