import { SponsorStatusBadge } from "@/components/sponsors/SponsorStatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { Sponsor } from "@/types/sponsor";

type SponsorDetailProps = {
  sponsor: Sponsor;
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

export function SponsorDetail({ sponsor }: SponsorDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Anagrafica sponsor</CardTitle>
          <SponsorStatusBadge status={sponsor.status} />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Ragione sociale" value={sponsor.companyName} />
          <DetailItem label="Referente" value={sponsor.contactName} />
          <DetailItem label="Email" value={sponsor.email} />
          <DetailItem label="Telefono" value={sponsor.phone} />
          <DetailItem
            label="Sito web"
            value={
              sponsor.website ? (
                <a
                  href={sponsor.website}
                  className="hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  {sponsor.website}
                </a>
              ) : null
            }
          />
          <DetailItem label="Indirizzo" value={sponsor.address} />
          <DetailItem label="Citta" value={sponsor.city} />
          <DetailItem label="Partita IVA" value={sponsor.vatNumber} />
          <DetailItem label="Codice fiscale" value={sponsor.fiscalCode} />
        </dl>
        {sponsor.notes ? (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">Note</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {sponsor.notes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
