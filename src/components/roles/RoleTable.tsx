import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveRoleAction } from "@/app/(admin)/settings/roles/actions";
import { RoleBadge } from "@/components/roles/RoleBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Role } from "@/types/role";

type RoleTableProps = {
  roles: Role[];
};

export function RoleTable({ roles }: RoleTableProps) {
  if (roles.length === 0) {
    return (
      <EmptyState
        title="Nessun ruolo presente"
        description="Crea il primo ruolo associativo."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Ruolo</th>
            <th className="px-4 py-3 font-medium">Descrizione</th>
            <th className="px-4 py-3 font-medium">Ordine</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge name={role.name} />
                  {role.isDefault ? <Badge variant="muted">Base</Badge> : null}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {role.description ?? "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {role.sortOrder}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="icon">
                    <Link
                      href={`/settings/roles?edit=${role.id}`}
                      aria-label={`Modifica ruolo ${role.name}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                  <form action={archiveRoleAction.bind(null, role.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia ruolo ${role.name}`}
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
