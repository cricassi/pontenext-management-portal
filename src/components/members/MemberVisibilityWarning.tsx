export function MemberVisibilityWarning({ warning }: { warning: string | null }) {
  if (!warning) return null;
  return <p role="alert" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">Configurazione dei campi non disponibile. Sono mostrati i valori predefiniti; il salvataggio resta bloccato finche&apos; la configurazione non torna disponibile.</p>;
}
