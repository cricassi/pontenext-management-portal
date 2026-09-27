import Link from "next/link";
import { CalendarPlus, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildInitialMembershipHref } from "@/utils/membership-links";

export function NewMemberMembershipPrompt({ memberId }: { memberId: string }) {
  return (
    <section
      aria-labelledby="new-member-membership-title"
      className="min-w-0 border-y border-border bg-background py-5"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-800" role="status">
        <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
        Socio creato correttamente.
      </p>
      <h2 id="new-member-membership-title" className="mt-3 text-lg font-semibold">
        Vuoi creare anche l&apos;iscrizione annuale?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Decorrenza da oggi, scadenza tra un anno. Nessun pagamento automatico.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="min-h-11">
          <Link href={buildInitialMembershipHref(memberId)} replace>
            <CalendarPlus aria-hidden="true" className="mr-2 size-4 shrink-0" />
            Crea iscrizione
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href={`/members/${memberId}`} replace>Non ora</Link>
        </Button>
      </div>
    </section>
  );
}
