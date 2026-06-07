import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ExpirationFilters as ExpirationFiltersType } from "@/types/expiration";

type ExpirationFiltersProps = {
  filters: ExpirationFiltersType;
};

export function ExpirationFilters({ filters }: ExpirationFiltersProps) {
  return (
    <form className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px_auto]">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="q"
          placeholder="Cerca socio, email o piano"
          defaultValue={filters.query ?? ""}
          className="pl-9"
        />
      </div>

      <select
        name="filter"
        defaultValue={filters.filter}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Filtra per scadenza"
      >
        <option value="expired">Scaduti</option>
        <option value="30">Entro 30 giorni</option>
        <option value="60">Entro 60 giorni</option>
        <option value="90">Entro 90 giorni</option>
      </select>

      <Button type="submit">Filtra</Button>
    </form>
  );
}
