# M8 - Reports & Export Review Report

Data: 2026-06-09

PR: #33 - M8 - Reports & Export

Branch: `codex/m8-reports-export`

Head verificato: `2152913c34c0bdc9e1e0068f671efe2d1a10679f`

Progetto Supabase: `PonteNext`

Project ref: `uhxfpsamenjhyrfgwckw`

## Esito

Review tecnica finale completata con esito positivo.

La PR rispetta lo scope M8:

- introduce `/reports`;
- introduce `/reports/export`;
- genera export CSV;
- genera export XLSX;
- non introduce PDF;
- non crea nuove tabelle;
- non crea migration;
- non introduce dashboard avanzata;
- non introduce invii email automatici;
- non introduce contabilita', fatturazione, IVA o prima nota.

Decisione finale: merge si.

## Controlli scope M8

File modificati verificati:

- `src/app/(admin)/reports/page.tsx`;
- `src/app/(admin)/reports/export/route.ts`;
- `src/services/reports.service.ts`;
- `src/services/report-export.service.ts`;
- `src/services/report-filters.service.ts`;
- `src/types/report.ts`;
- `src/utils/csv.ts`;
- `src/utils/xlsx.ts`;
- componenti UI in `src/components/reports`;
- voce navigazione in `src/components/layout/navigation.ts`;
- documentazione M8.

Non risultano modifiche a `package.json`, `package-lock.json` o migration operative.

## Sicurezza

Esito: OK.

- `/reports` chiama `requireActiveAdmin()` prima della preview e dei fetch report.
- `/reports/export` in `POST` chiama `requireActiveAdmin()` prima di leggere `request.formData()` e prima di generare file.
- `/reports/export` in `GET` chiama `requireActiveAdmin()` prima di rispondere `405`.
- Le query report usano il Supabase server client autenticato.
- Non risulta uso di service role nel service layer report/export.
- Gli export non scrivono file su disco, database o storage.
- Gli header download includono `Cache-Control: no-store`.
- `.env.local` non e' tracciato.
- `.env.example` contiene solo nomi variabili vuoti.
- Non risultano API key reali committate.

## Export

Esito: OK.

CSV:

- `Content-Type`: `text/csv; charset=utf-8`;
- BOM UTF-8 presente;
- intestazioni sempre presenti;
- valori quotati ed escaped;
- newline normalizzati;
- mitigazione CSV/formula injection per valori che iniziano con `=`, `+`, `-`, `@`, tab o carriage return.

XLSX:

- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
- generazione server-side in memoria;
- nessuna formula generata;
- celle prodotte come testo inline;
- nessun file persistito.

Filename:

- descrittivi;
- includono tipo report e timestamp;
- non includono dati personali.

## Dati coperti

Esito: OK.

Sono presenti report/export per:

- soci;
- iscrizioni;
- quote/pagamenti non contabili;
- scadenze;
- sponsor;
- contributi sponsor;
- eventi;
- campagne email.

Le campagne email esportano metadati e conteggi destinatari, senza body completo, segreti provider o invio email.

## Privacy

Esito: OK con raccomandazioni non bloccanti.

- La UI mostra un avviso privacy prima degli export.
- Gli export non includono chiavi API o variabili ambiente.
- I record sorgente archiviati sono esclusi di default e includibili solo con `includeArchived`.
- I report non introducono dati contabili/fiscali.

## UI

Esito: OK.

- Anteprima desktop con tabella responsive e `overflow-x-auto`.
- Anteprima mobile con card/lista.
- Empty state presente.
- Filtri usabili da form server-rendered.
- Azioni export CSV/XLSX chiare.
- Nessun pulsante PDF.

## Supabase read-only

Validazione live eseguita in sola lettura.

Risultati:

- progetto `PonteNext` attivo e healthy;
- migration live presenti fino a `010_email`;
- nessuna migration M8 applicata;
- nessuna tabella `reports`, `report_definitions`, `report_exports` o `audit_logs`;
- RLS attiva su tutte le tabelle applicative pubbliche M0-M7;
- nessuna policy `DELETE` rilevata.

Query/strumenti usati:

- `get_project`;
- `list_migrations`;
- `list_tables`;
- `execute_sql` solo con `SELECT`.

Nota: una prima query read-only ha fallito per nome colonna errato (`row_security`), poi e' stata corretta usando `pg_class.relrowsecurity`. Nessuna modifica database e' stata eseguita.

## Verifiche locali

### npm run lint

Esito: OK.

```text
eslint --max-warnings=0 src middleware.ts next.config.mjs tailwind.config.ts postcss.config.js
```

### npx tsc --noEmit

Esito: OK.

### npm run build

Esito: OK fuori sandbox.

Nel sandbox la build compila, poi fallisce con il limite ambientale gia' noto:

```text
Error: spawn EPERM
```

La build e' stata rieseguita fuori sandbox con esito positivo. L'output conferma la presenza delle route:

```text
/reports
/reports/export
```

## Browser / route check

Esito: OK per protezione route.

Dev server avviato temporaneamente fuori sandbox con `Start-Job`, senza usare `Start-Process`:

```text
npm run dev -- --hostname 127.0.0.1 --port 3023
```

Risultati:

```text
/reports senza sessione -> 307 /login
/reports/export POST senza sessione -> 303 /login
```

Il dev server temporaneo e' stato fermato al termine del controllo.

Nota: in questa sessione non era esposto un tool browser MCP dedicato; il controllo visuale e' stato quindi completato come dev-server + HTTP route check su localhost, integrato da analisi statica dei guard.

## Problemi bloccanti

Nessuno.

## Problemi non bloccanti

1. Il limite hard di export a `5_000` righe e' presente nel service layer, ma non e' esplicitamente mostrato come warning in UI.

   Impatto: basso nella fase M8 iniziale, soprattutto con database live vuoto. Se i dati cresceranno, un admin potrebbe non accorgersi che l'export e' limitato.

2. La semantica `includeArchived` e' applicata in modo chiaro al record sorgente del report. Alcuni report includono campi di entita' correlate, quindi in futuro conviene rendere ancora piu' esplicito come trattare casi limite di righe attive collegate a parent archiviati.

   Impatto: basso. Non e' stato rilevato un bypass RLS o un'esposizione fuori route protetta.

## Raccomandazioni

- Mostrare in UI un warning quando il totale report raggiunge il limite massimo esportabile.
- Documentare o rafforzare, in una milestone futura, la regola sui record correlati archiviati.
- Valutare test automatici mirati per CSV escaping, XLSX senza formule e guard `/reports/export`.

## Decisione finale

Merge si.

La PR #33 puo' essere approvata e mergiata: non sono stati trovati problemi bloccanti, le verifiche richieste sono passate e Supabase e' stato validato in sola lettura senza modifiche.
