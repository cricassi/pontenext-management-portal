import { PageHeader } from "@/components/layout/PageHeader";
import { RoleCardList } from "@/components/roles/RoleCardList";
import { RoleForm } from "@/components/roles/RoleForm";
import { RoleTable } from "@/components/roles/RoleTable";
import {
  createRoleAction,
  updateRoleAction,
} from "@/app/(admin)/settings/roles/actions";
import { getRoleById, getRoles } from "@/services/roles.service";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type RolesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const params = (await searchParams) ?? {};
  const editRoleId = readSearchParam(params, "edit");
  const editableRoleId = editRoleId && isUuid(editRoleId) ? editRoleId : null;
  const [roles, editRole] = await Promise.all([
    getRoles(),
    editableRoleId ? getRoleById(editableRoleId) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ruoli"
        description="Ruoli associativi assegnabili ai soci."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <RoleTable roles={roles} />
          <RoleCardList roles={roles} />
        </div>
        <RoleForm
          role={editRole ?? undefined}
          action={
            editRole
              ? updateRoleAction.bind(null, editRole.id)
              : createRoleAction
          }
          submitLabel={editRole ? "Salva ruolo" : "Crea ruolo"}
        />
      </div>
    </div>
  );
}
