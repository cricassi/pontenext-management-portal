import Link from "next/link";
import { Archive, CopyPlus } from "lucide-react";
import { archiveEmailTemplateAction } from "@/app/(admin)/email/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { EmailTemplate } from "@/types/email";

type EmailTemplateCardListProps = {
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

export function EmailTemplateCardList({
  templates,
}: EmailTemplateCardListProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {templates.map((template) => (
        <article key={template.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {template.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {template.subject}
              </p>
            </div>
            <Badge variant={template.isActive ? "success" : "muted"}>
              {template.isActive ? "Attivo" : "Non attivo"}
            </Badge>
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pubblico</dt>
              <dd className="text-right">{audienceLabel(template.audience)}</dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
            <Button asChild variant="outline">
              <Link href={`/email/campaigns?template=${template.id}`}>
                <CopyPlus aria-hidden="true" className="mr-2 size-4" />
                Usa
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/email/templates?edit=${template.id}`}>
                Modifica
              </Link>
            </Button>
            <form action={archiveEmailTemplateAction.bind(null, template.id)}>
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
        </article>
      ))}
    </div>
  );
}
