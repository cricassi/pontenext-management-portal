import { Archive, CalendarCheck } from "lucide-react";
import {
  archiveMemberRoleAssignmentAction,
  assignRoleToMemberAction,
  endMemberRoleAssignmentAction,
} from "@/app/(admin)/members/actions";
import { AssignRoleForm } from "@/components/members/AssignRoleForm";
import { RoleBadge } from "@/components/roles/RoleBadge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MemberRoleAssignment } from "@/types/member";
import type { Role } from "@/types/role";
import { formatDate } from "@/utils/date";

type MemberRolesPanelProps = {
  memberId: string;
  assignments: MemberRoleAssignment[];
  roles: Role[];
};

export function MemberRolesPanel({
  memberId,
  assignments,
  roles,
}: MemberRolesPanelProps) {
  const assignAction = assignRoleToMemberAction.bind(null, memberId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ruoli</CardTitle>
        <CardDescription>
          Ruoli associativi assegnati al socio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {assignments.length > 0 ? (
          <div className="grid gap-3">
            {assignments.map((assignment) => (
              <article
                key={assignment.id}
                className="grid gap-3 rounded-md border p-4 lg:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <RoleBadge name={assignment.roleName} />
                  <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-foreground">Inizio</dt>
                      <dd>{formatDate(assignment.startDate)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Fine</dt>
                      <dd>{formatDate(assignment.endDate)}</dd>
                    </div>
                  </dl>
                  {assignment.notes ? (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {assignment.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2 lg:justify-end">
                  {!assignment.endDate ? (
                    <form
                      action={endMemberRoleAssignmentAction.bind(
                        null,
                        memberId,
                        assignment.id,
                      )}
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        aria-label={`Termina ruolo ${assignment.roleName}`}
                      >
                        <CalendarCheck aria-hidden="true" className="size-4" />
                      </Button>
                    </form>
                  ) : null}
                  <form
                    action={archiveMemberRoleAssignmentAction.bind(
                      null,
                      memberId,
                      assignment.id,
                    )}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia ruolo ${assignment.roleName}`}
                    >
                      <Archive aria-hidden="true" className="size-4" />
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nessun ruolo assegnato"
            description="Assegna un ruolo associativo al socio."
          />
        )}

        <div className="rounded-md border bg-muted/20 p-4">
          <AssignRoleForm roles={roles} action={assignAction} />
        </div>
      </CardContent>
    </Card>
  );
}
