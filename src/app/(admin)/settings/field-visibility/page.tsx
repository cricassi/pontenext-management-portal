import { PageHeader } from "@/components/layout/PageHeader";
import { FieldVisibilitySettings } from "@/components/settings/FieldVisibilitySettings";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getFieldVisibility } from "@/services/field-visibility.service";

export const dynamic = "force-dynamic";

export default async function FieldVisibilityPage() {
  const { admin } = await requireActiveAdmin();
  const snapshot = await getFieldVisibility();
  return (
    <div className="flex w-full min-w-0 flex-col gap-6 [overflow-wrap:anywhere]">
      <PageHeader title="Visibilità dei campi" description="Configurazione globale" />
      <FieldVisibilitySettings snapshot={snapshot} canConfigure={admin.role === "super_admin"} />
    </div>
  );
}
