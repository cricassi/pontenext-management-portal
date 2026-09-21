import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { Member } from "@/types/member";
import type { MemberVisibility } from "@/utils/member-visibility";
import { formatDate } from "@/utils/date";

type MemberDetailProps = {
  member: Member;
  visibility: MemberVisibility;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || "-"}</dd>
    </div>
  );
}

export function MemberDetail({ member, visibility }: MemberDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Dati anagrafici</CardTitle>
          <MemberStatusBadge status={member.status} />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Nome" value={member.firstName} />
          <DetailItem label="Cognome" value={member.lastName} />
          {visibility.email !== false && <DetailItem label="Email" value={member.email} />}
          {visibility.phone !== false && <DetailItem label="Telefono" value={member.phone} />}
          {visibility.birthDate !== false && <DetailItem label="Data nascita" value={formatDate(member.birthDate)} />}
          {visibility.fiscalCode !== false && <DetailItem label="Codice fiscale" value={member.fiscalCode} />}
          {visibility.profession !== false && <DetailItem label="Professione" value={member.profession} />}
          {visibility.address !== false && <DetailItem label="Indirizzo" value={member.address} />}
          {visibility.city !== false && <DetailItem label="Citta" value={member.city} />}
          {visibility.postalCode !== false && <DetailItem label="CAP" value={member.postalCode} />}
          {visibility.province !== false && <DetailItem label="Provincia" value={member.province} />}
          <DetailItem label="Paese" value={member.country} />
        </dl>
        {visibility.notes !== false && member.notes ? (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">Note</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {member.notes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
