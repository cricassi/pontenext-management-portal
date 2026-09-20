"use client";

import { useRef, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DataExportButton() {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  async function download() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setCompleted(false);
    try {
      const response = await fetch("/settings/data-import-export/export", {
        method: "POST", credentials: "same-origin", cache: "no-store",
      });
      if (response.redirected) {
        setError("Sessione scaduta. Accedi di nuovo prima di esportare.");
        return;
      }
      if (!response.ok) {
        const payload: unknown = await response.json();
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error : "Esportazione non disponibile. Riprova tra poco.";
        setError(message);
        return;
      }
      const filename = response.headers.get("content-disposition")?.match(/filename="(pontenext-full-export-\d{4}-\d{2}-\d{2}-\d{4}\.xlsx)"/)?.[1];
      if (!filename || response.headers.get("content-type") !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        throw new Error("Unexpected export response");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setCompleted(true);
    } catch {
      setError("Esportazione non completata. Verifica la connessione e riprova.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-3">
      <Button type="button" onClick={download} disabled={pending} aria-busy={pending}
        className="h-auto min-h-11 w-full gap-2 whitespace-normal text-left sm:w-auto">
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
          : <Download aria-hidden="true" className="size-4 shrink-0" />}
        <span>{pending ? "Preparazione Excel..." : "Esporta tutti i dati in Excel"}</span>
      </Button>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {pending ? "Lettura e verifica dei dati in corso." : completed ? "Download avviato. Conserva il file in un luogo sicuro." : ""}
      </p>
      {error ? <p role="alert" className="break-words text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
