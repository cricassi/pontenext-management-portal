import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { EventFilters as EventFiltersType } from "@/types/event";

type EventFiltersProps = {
  filters: EventFiltersType;
};

export function EventFilters({ filters }: EventFiltersProps) {
  return (
    <form className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_190px_auto]">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="q"
          placeholder="Cerca evento"
          defaultValue={filters.query ?? ""}
          className="pl-9"
        />
      </div>

      <select
        name="status"
        defaultValue={filters.status ?? "all"}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Filtra per stato evento"
      >
        <option value="all">Tutti gli stati</option>
        <option value="planned">Pianificati</option>
        <option value="confirmed">Confermati</option>
        <option value="completed">Conclusi</option>
        <option value="cancelled">Annullati</option>
      </select>

      <Button type="submit">Filtra</Button>
    </form>
  );
}
