import { PageHeader } from "@/components/layout/PageHeader";
import { EmailTemplateCardList } from "@/components/email/EmailTemplateCardList";
import { EmailTemplateForm } from "@/components/email/EmailTemplateForm";
import { EmailTemplatePreview } from "@/components/email/EmailTemplatePreview";
import { EmailTemplateTable } from "@/components/email/EmailTemplateTable";
import {
  createEmailTemplateAction,
  updateEmailTemplateAction,
} from "@/app/(admin)/email/actions";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  getEmailTemplateById,
  getEmailTemplates,
} from "@/services/email-templates.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type EmailTemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmailTemplatesPage({
  searchParams,
}: EmailTemplatesPageProps) {
  await requireActiveAdmin();
  const params = (await searchParams) ?? {};
  const editId = readSearchParam(params, "edit");
  const [templates, editingTemplate] = await Promise.all([
    getEmailTemplates(),
    editId && isUuid(editId) ? getEmailTemplateById(editId) : null,
  ]);
  const action = editingTemplate
    ? updateEmailTemplateAction.bind(null, editingTemplate.id)
    : createEmailTemplateAction;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Template email"
        description="Modelli riutilizzabili per campagne verso soci e sponsor."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-4">
          <EmailTemplateTable templates={templates} />
          <EmailTemplateCardList templates={templates} />
        </div>

        <div className="flex flex-col gap-4">
          <EmailTemplateForm
            template={editingTemplate}
            action={action}
            submitLabel={editingTemplate ? "Aggiorna template" : "Crea template"}
          />
          <EmailTemplatePreview template={editingTemplate} />
        </div>
      </div>
    </div>
  );
}
