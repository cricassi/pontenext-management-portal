import type { ExpirationFilter, ExpirationStatus } from "@/types/expiration";

export function getExpirationFilterLabel(filter: ExpirationFilter) {
  switch (filter) {
    case "expired":
      return "Scaduti";
    case "30":
      return "Entro 30 giorni";
    case "60":
      return "Entro 60 giorni";
    case "90":
      return "Entro 90 giorni";
  }
}

export function getExpirationStatusLabel(status: ExpirationStatus) {
  switch (status) {
    case "expired":
      return "Scaduta";
    case "within_30":
      return "Entro 30 giorni";
    case "within_60":
      return "Entro 60 giorni";
    case "within_90":
      return "Entro 90 giorni";
    case "future":
      return "Non in scadenza";
  }
}

export function getDaysUntilExpirationLabel(daysUntilExpiration: number) {
  if (daysUntilExpiration < 0) {
    const days = Math.abs(daysUntilExpiration);
    return days === 1 ? "Scaduta da 1 giorno" : `Scaduta da ${days} giorni`;
  }

  if (daysUntilExpiration === 0) {
    return "Scade oggi";
  }

  return daysUntilExpiration === 1
    ? "Scade tra 1 giorno"
    : `Scade tra ${daysUntilExpiration} giorni`;
}
