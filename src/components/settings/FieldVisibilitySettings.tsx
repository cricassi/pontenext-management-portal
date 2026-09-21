"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, LockKeyhole, RotateCcw, Save, Search, ShieldCheck } from "lucide-react";
import { resetFieldVisibilityAction, saveFieldVisibilityAction } from "@/app/(admin)/settings/field-visibility/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { ResolvedVisibilityField, ResolvedVisibilityScreen, VisibilityActionResult, VisibilitySnapshot } from "@/types/field-visibility";

function valuesFor(screen: ResolvedVisibilityScreen) {
  return Object.fromEntries(screen.fields.filter((field) => field.configurable).map((field) => [field.fieldKey, field.isVisible]));
}

export function FieldVisibilitySettings({ snapshot, canConfigure }: { snapshot: VisibilitySnapshot; canConfigure: boolean }) {
  const router = useRouter();
  const [screenKey, setScreenKey] = useState(snapshot.screens[0].screenKey);
  const selected = snapshot.screens.find((screen) => screen.screenKey === screenKey) ?? snapshot.screens[0];
  const [values, setValues] = useState(() => valuesFor(selected));
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VisibilityActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const baseline = valuesFor(selected);
  const dirty = Object.keys(baseline).some((key) => values[key] !== baseline[key]);
  const editable = canConfigure && selected.integrated && !snapshot.warning;
  const modules = [...new Set(snapshot.screens.map((screen) => screen.module))];
  const search = query.trim().toLocaleLowerCase("it");
  const matching = selected.fields.filter((field) => `${field.label} ${field.fieldKey} ${field.description}`.toLocaleLowerCase("it").includes(search));

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const beforeNavigate = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("a[href]")) return;
      if (!window.confirm("Ci sono modifiche non salvate. Vuoi abbandonarle?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeNavigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeNavigate, true);
    };
  }, [dirty]);

  function selectScreen(nextKey: string) {
    if (pending || (dirty && !window.confirm("Abbandonare le modifiche non salvate?"))) return;
    const next = snapshot.screens.find((screen) => screen.screenKey === nextKey);
    if (!next) return;
    setScreenKey(nextKey);
    setValues(valuesFor(next));
    setQuery("");
    setResult(null);
  }

  function submit(reset: boolean) {
    if (!editable || pending) return;
    if (!window.confirm(reset ? `Ripristinare i valori predefiniti di ${selected.label}? Nessun dato viene cancellato.` : `Salvare la configurazione globale di ${selected.label} per tutti gli amministratori?`)) return;
    startTransition(async () => {
      try {
        const response = reset ? await resetFieldVisibilityAction(screenKey) : await saveFieldVisibilityAction({ screenKey, values });
        setResult(response);
        if (response.ok) {
          if (reset) setValues(Object.fromEntries(selected.fields.filter((field) => field.configurable).map((field) => [field.fieldKey, field.defaultVisible])));
          router.refresh();
        }
      } catch {
        setResult({ ok: false, message: "Impossibile confermare l'esito. Ricarica e verifica la configurazione prima di riprovare." });
      }
    });
  }

  function visibilityControl(field: ResolvedVisibilityField, suffix: string) {
    const id = `${screenKey}-${field.fieldKey}-${suffix}`;
    const checked = field.configurable ? values[field.fieldKey] ?? field.isVisible : true;
    return (
      <label htmlFor={id} className="flex min-h-11 items-center gap-3">
        <input id={id} type="checkbox" role="switch" checked={checked}
          aria-label={`${field.label}: visibile`} aria-describedby={`${id}-reason`}
          disabled={!editable || !field.configurable || pending}
          onChange={(event) => setValues({ ...values, [field.fieldKey]: event.target.checked })}
          className="size-5 shrink-0 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed" />
        <span className="text-sm">{checked ? "Visibile" : "Nascosto"}</span>
        <span id={`${id}-reason`} className="sr-only">{!field.configurable ? field.description : !selected.integrated ? "Applicazione non ancora attiva" : !canConfigure ? "Solo super_admin" : ""}</span>
      </label>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-start gap-3 border-y bg-white px-4 py-4 text-sm leading-6">
        <ShieldCheck aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-medium">Questa configurazione è globale per tutti gli amministratori</p>
          <p className="text-muted-foreground">La visibilità non modifica i permessi, i dati salvati o gli export.</p>
          {!canConfigure && <p className="mt-2">Consultazione consentita. Le modifiche sono riservate ai super_admin.</p>}
        </div>
      </div>
      {snapshot.warning && (
        <p role="alert" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          {snapshot.warning === "unavailable" ? "Configurazione salvata non disponibile. Sono mostrati i valori predefiniti; nessuna modifica è consentita." : "Alcuni override non sono validi. Per quei campi sono mostrati i valori predefiniti; il salvataggio è bloccato."}
        </p>
      )}
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="visibility-module">Modulo</Label>
          <select id="visibility-module" value={selected.module} disabled={pending}
            onChange={(event) => selectScreen(snapshot.screens.find((screen) => screen.module === event.target.value)!.screenKey)}
            className="min-h-11 w-full min-w-0 rounded-md border border-input bg-white px-3 text-base focus-visible:outline-primary">
            {modules.map((module) => <option key={module}>{module}</option>)}
          </select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="visibility-screen">Schermata</Label>
          <select id="visibility-screen" value={screenKey} disabled={pending} onChange={(event) => selectScreen(event.target.value)}
            className="min-h-11 w-full min-w-0 rounded-md border border-input bg-white px-3 text-base focus-visible:outline-primary">
            {snapshot.screens.filter((screen) => screen.module === selected.module).map((screen) => <option key={screen.screenKey} value={screen.screenKey}>{screen.label}</option>)}
          </select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="visibility-search">Cerca campo</Label>
          <div className="relative min-w-0">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input id="visibility-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 pl-9 text-base" />
          </div>
        </div>
      </div>
      <section aria-labelledby="visibility-heading" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="visibility-heading" className="text-lg font-semibold">{selected.label}</h2>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{selected.screenKey}</p>
          </div>
          <Badge variant={selected.integrated ? "success" : "muted"}>{selected.integrated ? "Attiva" : "Non ancora attiva"}</Badge>
        </div>
        {!selected.integrated && <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"><LockKeyhole aria-hidden="true" className="mt-1 size-4 shrink-0" />Attivazione prevista in M10-A2. Le schermate operative restano invariate.</p>}
        {!selected.fields.some((field) => field.configurable) && <p className="border-y py-4 text-sm">Nessun campo facoltativo configurabile in questa schermata. I campi richiesti dal flusso rimangono visibili.</p>}
        {!matching.length ? <p role="status" className="border-y py-6 text-sm text-muted-foreground">Nessun campo corrisponde alla ricerca.</p> : (
          <>
            <div className="hidden min-w-0 md:block">
              <table className="w-full table-fixed border-y text-left text-sm">
                <thead className="border-b bg-muted/40"><tr><th className="w-[45%] px-4 py-3 font-medium">Campo</th><th className="w-[18%] px-3 py-3 font-medium">Regola</th><th className="w-[18%] px-3 py-3 font-medium">Origine</th><th className="px-3 py-3 font-medium">Visibilità</th></tr></thead>
                <tbody>{matching.map((field) => <tr key={field.fieldKey} className="border-b bg-white align-top last:border-0">
                  <td className="px-4 py-4"><span className="font-medium">{field.label}</span><p className="mt-1 text-xs leading-5 text-muted-foreground">{field.description}</p></td>
                  <td className="px-3 py-4">{field.isRequired ? "Obbligatorio" : field.configurable ? "Facoltativo" : "Workflow"}</td>
                  <td className="px-3 py-4"><span>{field.hasOverride ? "Override" : "Predefinito"}</span><p className="mt-1 text-xs text-muted-foreground">Default: visibile</p></td>
                  <td className="px-3 py-2">{visibilityControl(field, "desktop")}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <ul className="grid min-w-0 gap-3 md:hidden">{matching.map((field) => <li key={field.fieldKey} className="min-w-0 rounded-lg border bg-white p-4">
              <h3 className="text-sm font-semibold">{field.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{field.isRequired ? "Obbligatorio" : field.configurable ? "Facoltativo" : "Workflow"} · {field.hasOverride ? "Override" : "Predefinito"}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{field.description}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">{visibilityControl(field, "mobile")}<span className="text-xs text-muted-foreground">Default: visibile</span></div>
            </li>)}</ul>
          </>
        )}
        {selected.updatedAt && <p className="text-xs text-muted-foreground">Ultimo salvataggio: <time dateTime={selected.updatedAt}>{new Date(selected.updatedAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" })}</time> (ora italiana)</p>}
      </section>
      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
        <Button type="button" disabled={!editable || !dirty || pending} onClick={() => submit(false)} className="min-h-11 w-full sm:w-auto"><Save aria-hidden="true" className="mr-2 size-4 shrink-0" />{pending ? "Attendi..." : "Salva schermata"}</Button>
        <Button type="button" variant="outline" disabled={!editable || pending || !selected.fields.some((field) => field.hasOverride)} onClick={() => submit(true)} className="min-h-11 w-full sm:w-auto"><RotateCcw aria-hidden="true" className="mr-2 size-4 shrink-0" />Ripristina predefiniti</Button>
        {dirty && <span role="status" className="text-sm text-amber-800">Modifiche non salvate</span>}
        {!dirty && <span className="flex items-center gap-2 text-sm text-muted-foreground"><Eye aria-hidden="true" className="size-4 shrink-0" />{matching.length} campi in elenco</span>}
      </div>
      {result && <p role={result.ok ? "status" : "alert"} className={`border-l-4 p-4 text-sm ${result.ok ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-red-600 bg-red-50 text-red-950"}`}>{result.message}</p>}
    </div>
  );
}
