import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveMemberAction } from "@/app/(admin)/members/actions";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MemberListItem } from "@/types/member";

type MemberTableProps = {
  members: MemberListItem[];
};

export function MemberTable({ members }: MemberTableProps) {
  if (members.length === 0) {
    return (
      <EmptyState
        title="Nessun socio presente"
        description="Crea il primo socio per iniziare a gestire l'anagrafica."
        actionHref="/members/new"
        actionLabel="Nuovo socio"
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Telefono</th>
            <th className="px-4 py-3 font-medium">Ruolo principale</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/members/${member.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {member.firstName} {member.lastName}
                </Link>
                {member.city ? (
                  <p className="text-xs text-muted-foreground">{member.city}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {member.email ?? "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {member.phone ?? "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {member.primaryRoleName ?? "-"}
              </td>
              <td className="px-4 py-3">
                <MemberStatusBadge status={member.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/members/${member.id}`}>Apri</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/members/${member.id}/edit`}>Modifica</Link>
                  </Button>
                  <form action={archiveMemberAction.bind(null, member.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia ${member.firstName} ${member.lastName}`}
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
