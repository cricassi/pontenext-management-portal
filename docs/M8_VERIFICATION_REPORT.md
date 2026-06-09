# M8 - Reports & Export Post-Merge Verification

Data: 2026-06-09

Stato: PR #33 mergiata su `main`

Merge commit verificato: `5c7902bc7a07b98a07a01eb002b764920483dedf`

Branch report: `codex/m8-post-merge-verification`

Progetto Supabase: `PonteNext`

Project ref: `uhxfpsamenjhyrfgwckw`

## Esito

Verifica post-merge M8 completata con esito positivo.

Il repository `main` aggiornato contiene l'implementazione M8 Reports & Export
e Supabase live non presenta modifiche di schema M8.

Non sono stati modificati codice applicativo, migration o database durante
questa verifica.

## Verifiche richieste

| Punto | Esito | Evidenza |
| --- | --- | --- |
| Route `/reports` | OK | Presente `src/app/(admin)/reports/page.tsx` |
| Route `/reports/export` | OK | Presente `src/app/(admin)/reports/export/route.ts` |
| Route protette | OK | `requireActiveAdmin()` chiamato prima di preview/export |
| Export CSV | OK | `src/utils/csv.ts`, `Content-Type: text/csv; charset=utf-8` |
| Export XLSX | OK | `src/utils/xlsx.ts`, content type XLSX corretto |
| Filtri report | OK | `src/services/report-filters.service.ts` e `ReportFilterPanel.tsx` |
| Preview report | OK | `getReportPreview()` e `ReportsOverview.tsx` |
| Nessun PDF | OK | Nessuna route o utility PDF; export limitato a CSV/XLSX |
| Nessuna nuova tabella | OK | Supabase read-only: nessuna tabella report/export |
| Nessuna migration M8 | OK | Migration live ferme a `010_email`; repo senza migration M8 |
| Nessuna dashboard avanzata | OK | M8 aggiunge solo voce navigazione Report e route `/reports` |
| Nessuna email automatica | OK | Nessuna chiamata Resend o invio email nei report/export |
| Nessuna logica contabile | OK | Nessuna fatturazione, IVA, prima nota o contabilita' introdotta |
| `npm run lint` | OK | Eseguito con successo |
| `npx tsc --noEmit` | OK | Eseguito con successo |
| `npm run build` | OK | Passato fuori sandbox; output include `/reports` e `/reports/export` |
| Supabase read-only | OK | Solo `get_project`, `list_migrations`, `list_tables`, `SELECT` |

## Route

File presenti su `main` aggiornato:

- `src/app/(admin)/reports/page.tsx`
- `src/app/(admin)/reports/export/route.ts`

La build Next.js conferma entrambe le route:

```text
/reports
/reports/export
```

## Route protette

Analisi statica:

- `/reports` chiama `await requireActiveAdmin()` prima di leggere i filtri,
  calcolare la preview o interrogare il service layer.
- `/reports/export` in `POST` chiama `await requireActiveAdmin()` prima di
  `request.formData()` e prima di `exportReport()`.
- `/reports/export` in `GET` chiama `await requireActiveAdmin()` prima di
  rispondere `405`.

Dev server check locale fuori sandbox con `Start-Job`, senza `Start-Process`:

```text
npm run dev -- --hostname 127.0.0.1 --port 3025
```

Risultati senza sessione:

```text
/reports -> 307 /login
/reports/export GET -> 307 /login
/reports/export POST -> 303 /login
```

Il dev server temporaneo e' stato fermato al termine del controllo.

## Export

CSV:

- generato server-side;
- BOM UTF-8 presente;
- valori quotati ed escaped;
- mitigazione CSV/formula injection;
- content type `text/csv; charset=utf-8`.

XLSX:

- generato server-side in memoria;
- celle testuali inline;
- nessuna formula generata;
- content type
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

Download:

- filename descrittivo tramite `buildReportFilename()`;
- header `Cache-Control: no-store`;
- nessun file scritto su disco, database o storage.

## Filtri e preview

Filtri presenti:

- tipo report;
- ricerca testuale;
- stato;
- stato associativo;
- stato pagamento;
- metodo pagamento;
- tipo contributo;
- segmento email;
- finestra scadenza;
- range date;
- `includeArchived`.

Preview presente:

- `getReportPreview()` usa lo stesso service layer di export;
- `ReportsOverview.tsx` mostra anteprima e azioni export;
- `ReportPreviewTable.tsx` gestisce desktop;
- `ReportPreviewCardList.tsx` gestisce mobile;
- `ReportEmptyState.tsx` gestisce report vuoti.

## Scope negativo

Verificato:

- nessun PDF;
- nessuna nuova tabella;
- nessuna migration M8;
- nessuna dashboard avanzata;
- nessun invio email automatico;
- nessuna area soci;
- nessuna logica contabile;
- nessuna fatturazione;
- nessuna IVA;
- nessuna prima nota.

## Supabase read-only

Validazione eseguita sul progetto `PonteNext` (`uhxfpsamenjhyrfgwckw`) solo in
lettura.

Stato progetto:

- `ACTIVE_HEALTHY`;
- regione `eu-central-1`;
- Postgres `17.6.1.127`.

Migration live:

- `001_extensions`
- `002_admin_users`
- `003_harden_admin_functions`
- `004_members_roles`
- `005_membership_plans`
- `006_memberships_payments`
- `007_sponsors`
- `008_events`
- `009_sponsor_contributions`
- `010_email`

Non risultano migration M8 applicate.

Tabelle public presenti:

- `admin_users`
- `members`
- `roles`
- `member_roles`
- `membership_plans`
- `memberships`
- `payments`
- `sponsors`
- `sponsor_contributions`
- `events`
- `event_sponsors`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`

RLS risulta attiva su tutte le tabelle applicative elencate.

Query read-only di controllo:

- nessuna tabella `reports`;
- nessuna tabella `report_definitions`;
- nessuna tabella `report_exports`;
- nessuna tabella con nome contenente `report`;
- nessuna policy `DELETE`.

## Verifiche locali

### `npm run lint`

Esito: OK.

```text
eslint --max-warnings=0 src middleware.ts next.config.mjs tailwind.config.ts postcss.config.js
```

### `npx tsc --noEmit`

Esito: OK.

### `npm run build`

Esito: OK fuori sandbox.

Nel sandbox la build compila, poi fallisce per il limite ambientale gia' noto:

```text
Error: spawn EPERM
```

La build e' stata rieseguita fuori sandbox con esito positivo.

## Note

- `next-env.d.ts` e' stato toccato dalla build solo per normalizzazione line
  ending ed e' stato ripristinato.
- La PR di questa verifica deve restare solo documentale e includere solo
  `docs/M8_VERIFICATION_REPORT.md`.
- M9 non e' stato avviato.
