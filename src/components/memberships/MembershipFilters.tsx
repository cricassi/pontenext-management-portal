import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { MembershipFilters as MembershipFiltersType } from "@/types/membership";

type MembershipFiltersProps = {
  filters: MembershipFiltersType;
};

export function MembershipFilters({ filters }: MembershipFiltersProps) {
  return (
    <form className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px_180px_auto]">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="q"
          placeholder="Cerca socio o piano"
          defaultValue={filters.query ?? ""}
          className="pl-9"
        />
      </div>

      <select
        name="status"
        defaultValue={filters.status ?? "all"}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Filtra per stato iscrizione"
      >
        <option value="all">Tutte</option>
        <option value="active">Attive</option>
        <option value="expired">Scadute</option>
        <option value="cancelled">Annullate</option>
      </select>

      <select
        name="paymentStatus"
        defaultValue={filters.paymentStatus ?? "all"}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Filtra per stato pagamento"
      >
        <option value="all">Tutti i pagamenti</option>
        <option value="unpaid">Non pagate</option>
        <option value="partial">Parziali</option>
        <option value="paid">Pagate</option>
        <option value="overpaid">Eccedenti</option>
      </select>

      <Button type="submit">Filtra</Button>
    </form>
  );
}
