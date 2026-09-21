import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveMemberAction } from "@/app/(admin)/members/actions";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { Button } from "@/components/ui/Button";
import type { MemberListItem } from "@/types/member";
import type { MemberVisibility } from "@/utils/member-visibility";

type MemberCardListProps = {
  members: MemberListItem[];
  visibility: MemberVisibility;
};

export function MemberCardList({ members, visibility }: MemberCardListProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {members.map((member) => (
        <article key={member.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {member.firstName} {member.lastName}
              </h2>
              {visibility.email !== false && <p className="mt-1 break-words text-sm text-muted-foreground">
                {member.email ?? "Email non presente"}
              </p>}
            </div>
            <MemberStatusBadge status={member.status} />
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            {visibility.phone !== false && <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Telefono</dt>
              <dd className="text-right">{member.phone ?? "-"}</dd>
            </div>}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ruolo</dt>
              <dd className="text-right">{member.primaryRoleName ?? "-"}</dd>
            </div>
            {visibility.city !== false && <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Citta</dt>
              <dd className="text-right">{member.city ?? "-"}</dd>
            </div>}
          </dl>

          <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
            <Button asChild variant="outline">
              <Link href={`/members/${member.id}`}>Apri</Link>
            </Button>
            <Button asChild variant="outline">
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
        </article>
      ))}
    </div>
  );
}
