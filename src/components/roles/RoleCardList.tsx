import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { archiveRoleAction } from "@/app/(admin)/settings/roles/actions";
import { RoleBadge } from "@/components/roles/RoleBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Role } from "@/types/role";

type RoleCardListProps = {
  roles: Role[];
};

export function RoleCardList({ roles }: RoleCardListProps) {
  if (roles.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {roles.map((role) => (
        <article key={role.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <RoleBadge name={role.name} />
              {role.description ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {role.description}
                </p>
              ) : null}
            </div>
            {role.isDefault ? <Badge variant="muted">Base</Badge> : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Ordine</span>
            <span>{role.sortOrder}</span>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button asChild variant="outline">
              <Link href={`/settings/roles?edit=${role.id}`}>
                <Pencil aria-hidden="true" className="mr-2 size-4" />
                Modifica
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
        </article>
      ))}
    </div>
  );
}
