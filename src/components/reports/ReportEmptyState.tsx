import { EmptyState } from "@/components/ui/EmptyState";

type ReportEmptyStateProps = {
  reportLabel: string;
};

export function ReportEmptyState({ reportLabel }: ReportEmptyStateProps) {
  return (
    <EmptyState
      title="Nessun dato da mostrare"
      description={`Il report ${reportLabel} non contiene righe con i filtri correnti. Puoi comunque esportare un file valido con sole intestazioni.`}
    />
  );
}
