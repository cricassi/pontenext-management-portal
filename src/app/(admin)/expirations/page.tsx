import { PageHeader } from "@/components/layout/PageHeader";
import { ExpirationCardList } from "@/components/expirations/ExpirationCardList";
import { ExpirationFilters } from "@/components/expirations/ExpirationFilters";
import { ExpirationSummary } from "@/components/expirations/ExpirationSummary";
import { ExpirationTable } from "@/components/expirations/ExpirationTable";
import { getExpirationsPageData } from "@/services/expirations.service";
import {
  EXPIRATION_FILTERS,
  type ExpirationFilter,
} from "@/types/expiration";

export const dynamic = "force-dynamic";

type ExpirationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function isExpirationFilter(value: string | undefined): value is ExpirationFilter {
  return Object.values(EXPIRATION_FILTERS).includes(value as ExpirationFilter);
}

function getExpirationFilter(
  params: Record<string, string | string[] | undefined>,
): ExpirationFilter {
  const filterParam = readSearchParam(params, "filter");
  const windowParam = readSearchParam(params, "window");

  if (isExpirationFilter(filterParam)) {
    return filterParam;
  }

  if (isExpirationFilter(windowParam)) {
    return windowParam;
  }

  return EXPIRATION_FILTERS.EXPIRED;
}

export default async function ExpirationsPage({
  searchParams,
}: ExpirationsPageProps) {
  const params = (await searchParams) ?? {};
  const filters = {
    filter: getExpirationFilter(params),
    query: readSearchParam(params, "q")?.trim(),
  };
  const { expirations, summary } = await getExpirationsPageData(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scadenze"
        description="Iscrizioni scadute o in scadenza, calcolate dall'ultima membership rinnovabile di ogni socio."
      />

      <ExpirationSummary summary={summary} />
      <ExpirationFilters filters={filters} />
      <ExpirationTable expirations={expirations} />
      <ExpirationCardList expirations={expirations} />
    </div>
  );
}
