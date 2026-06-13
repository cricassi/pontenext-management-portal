import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MEMBER_SORT_OPTIONS,
  type MemberFilters as MemberFiltersType,
} from "@/types/member";
import type { Role } from "@/types/role";

type MemberFiltersProps = {
  filters: MemberFiltersType;
  roles: Role[];
};

export function MemberFilters({ filters, roles }: MemberFiltersProps) {
  return (
    <form className="grid min-w-0 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_160px_200px_180px_auto]">
      <div className="relative min-w-0">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="q"
          placeholder="Cerca socio"
          defaultValue={filters.query ?? ""}
          className="min-w-0 pl-9"
        />
      </div>

      <select
        name="status"
        defaultValue={filters.status ?? "all"}
        className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Filtra per stato anagrafico"
      >
        <option value="all">Tutti gli stati</option>
        <option value="active">Attivi</option>
        <option value="inactive">Inattivi</option>
        <option value="archived">Archiviati</option>
      </select>

      <select
        name="roleId"
        defaultValue={filters.roleId ?? "all"}
        className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Filtra per ruolo"
      >
        <option value="all">Tutti i ruoli</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>

      <select
        name="sort"
        defaultValue={filters.sort ?? MEMBER_SORT_OPTIONS.NAME_ASC}
        className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Ordina elenco soci"
      >
        <option value={MEMBER_SORT_OPTIONS.NAME_ASC}>Nome A-Z</option>
        <option value={MEMBER_SORT_OPTIONS.NAME_DESC}>Nome Z-A</option>
        <option value={MEMBER_SORT_OPTIONS.CREATED_DESC}>Recenti prima</option>
        <option value={MEMBER_SORT_OPTIONS.CREATED_ASC}>Meno recenti</option>
        <option value={MEMBER_SORT_OPTIONS.STATUS_ASC}>
          Stato anagrafico
        </option>
        <option value={MEMBER_SORT_OPTIONS.CITY_ASC}>Citta A-Z</option>
      </select>

      <Button type="submit" className="w-full lg:w-auto">
        Filtra
      </Button>
    </form>
  );
}
