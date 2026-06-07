import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SponsorFilters as SponsorFiltersType } from "@/types/sponsor";

type SponsorFiltersProps = {
  filters: SponsorFiltersType;
};

export function SponsorFilters({ filters }: SponsorFiltersProps) {
  return (
    <form className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px_auto]">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="q"
          placeholder="Cerca sponsor"
          defaultValue={filters.query ?? ""}
          className="pl-9"
        />
      </div>

      <select
        name="status"
        defaultValue={filters.status ?? "all"}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Filtra per stato sponsor"
      >
        <option value="all">Tutti gli stati</option>
        <option value="active">Attivi</option>
        <option value="inactive">Inattivi</option>
        <option value="archived">Archiviati</option>
      </select>

      <Button type="submit">Filtra</Button>
    </form>
  );
}
