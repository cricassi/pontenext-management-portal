import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { ReportDefinition, ReportFilters } from "@/types/report";

type ReportFilterPanelProps = {
  definitions: ReportDefinition[];
  selectedDefinition: ReportDefinition;
  filters: ReportFilters;
};

function SelectField({
  id,
  name,
  label,
  value,
  options,
}: {
  id: string;
  name: string;
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        defaultValue={value ?? "all"}
        className="h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({
  id,
  name,
  label,
  value,
}: {
  id: string;
  name: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type="date" defaultValue={value ?? ""} />
    </div>
  );
}

export function ReportFilterPanel({
  definitions,
  selectedDefinition,
  filters,
}: ReportFilterPanelProps) {
  const config = selectedDefinition.filters;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Filtri report</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid min-w-0 gap-4 lg:grid-cols-4">
          <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
            <Label htmlFor="reportType">Report</Label>
            <select
              id="reportType"
              name="reportType"
              defaultValue={filters.reportType}
              className="h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {definitions.map((definition) => (
                <option key={definition.type} value={definition.type}>
                  {definition.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex min-w-0 flex-col gap-2 lg:col-span-2">
            <Label htmlFor="q">{config.queryLabel ?? "Cerca"}</Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="q"
                name="q"
                defaultValue={filters.query ?? ""}
                className="pl-9"
              />
            </div>
          </div>

          {config.statusOptions ? (
            <SelectField
              id="status"
              name="status"
              label={config.statusLabel ?? "Stato"}
              value={filters.status}
              options={config.statusOptions}
            />
          ) : null}

          {config.membershipStatusOptions ? (
            <SelectField
              id="membershipStatus"
              name="membershipStatus"
              label="Stato associativo"
              value={filters.membershipStatus}
              options={config.membershipStatusOptions}
            />
          ) : null}

          {config.paymentStatusOptions ? (
            <SelectField
              id="paymentStatus"
              name="paymentStatus"
              label="Stato pagamento"
              value={filters.paymentStatus}
              options={config.paymentStatusOptions}
            />
          ) : null}

          {config.paymentMethodOptions ? (
            <SelectField
              id="paymentMethod"
              name="paymentMethod"
              label="Metodo pagamento"
              value={filters.paymentMethod}
              options={config.paymentMethodOptions}
            />
          ) : null}

          {config.contributionTypeOptions ? (
            <SelectField
              id="contributionType"
              name="contributionType"
              label="Tipo contributo"
              value={filters.contributionType}
              options={config.contributionTypeOptions}
            />
          ) : null}

          {config.audienceTypeOptions ? (
            <SelectField
              id="audienceType"
              name="audienceType"
              label="Segmento"
              value={filters.audienceType}
              options={config.audienceTypeOptions}
            />
          ) : null}

          {config.expirationWindowOptions ? (
            <SelectField
              id="expirationWindow"
              name="expirationWindow"
              label="Finestra scadenza"
              value={filters.expirationWindow}
              options={config.expirationWindowOptions}
            />
          ) : null}

          {config.dateFromLabel ? (
            <DateField
              id="dateFrom"
              name="dateFrom"
              label={config.dateFromLabel}
              value={filters.dateFrom}
            />
          ) : null}

          {config.dateToLabel ? (
            <DateField
              id="dateTo"
              name="dateTo"
              label={config.dateToLabel}
              value={filters.dateTo}
            />
          ) : null}

          <div className="flex min-w-0 items-end">
            <label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md border bg-card px-3 text-sm">
              <input
                type="checkbox"
                name="includeArchived"
                defaultChecked={filters.includeArchived}
                className="size-4 rounded border-input"
              />
              <span className="truncate">Includi archiviati</span>
            </label>
          </div>

          <div className="flex min-w-0 items-end">
            <Button type="submit" className="w-full">
              Aggiorna anteprima
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
