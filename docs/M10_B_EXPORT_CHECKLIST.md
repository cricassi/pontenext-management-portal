# M10-B - Complete Excel Export

Data: 2026-09-19. Base: `main` dopo merge PR #47, `ec99307655841a921cd9668c5f43f5257ce32fc1`.
Branch: `codex/m10-b-complete-excel-export`. Progetto: PonteNext `uhxfpsamenjhyrfgwckw`.

## Perimetro

- [x] Solo export completo read-only; nessun upload/import.
- [x] Nessuna field visibility, `ui_field_visibility`, permission group o modifica ai form business.
- [x] Nessuna migration/RPC, modifica Supabase, dati live o configurazione Vercel.
- [x] Nessuna nuova dipendenza; riuso ZIP/XML XLSX M8 con percorso multi-foglio tipizzato.
- [x] Pagina `/settings/data-import-export`; endpoint POST `/settings/data-import-export/export`.
- [x] Collegamento in Impostazioni per super_admin; nessuna modifica alla navigazione business.

## Autorizzazione

- [x] Pagina: `requireActiveAdmin` e ruolo `super_admin`, prima del rendering export.
- [x] Endpoint/service: `requireFullExportAdmin` richiama `requireActiveAdmin`,
  verifica il ruolo prima delle letture business; ricontrollo al termine.
- [x] Client Supabase server di sessione, anon key + cookie utente; nessuna service role.
- [x] RLS sempre rispettata; nessun accesso diretto con privilegi elevati.
- [x] Endpoint same-origin, solo POST, `private, no-store`, `nosniff` e attachment XLSX.
- [x] Errori sanitizzati; redirect framework preservati; nessun log di righe/workbook.
- [x] Controllo project ref; altri progetti rifiutati prima delle query business.

Le letture Auth/admin della guard precedono qualsiasi query di export. Il limite
super_admin riguarda questa funzione, non cambia i diritti CRUD/RLS degli admin
ordinari. Nessuna modifica alle policy esistenti.

## Workbook e manifest

- [x] Filename `pontenext-full-export-YYYY-MM-DD-HHmm.xlsx` (UTC).
- [x] Formato `pontenext-full-export-v1`.
- [x] Ordine: README, METADATA, members, roles, member_roles, membership_plans,
  memberships, payments, sponsors, sponsor_contributions, events, event_sponsors,
  email_templates, email_campaigns, email_campaign_recipients.
- [x] Manifest esplicito tabelle/colonne/tipi in `src/config/data-export.ts`;
  nessun SELECT *, nessun campo futuro esportato automaticamente.
- [x] Archiviati/inattivi inclusi; `archived_at` dove presente nello schema.
  `email_campaign_recipients` non possiede questa colonna nel database live.
- [x] UUID/FK originali, header tecnici stabili, ordinamento record per `id`.
- [x] Date ISO, timestamp ISO con microsecondi, importi numerici e booleani nativi.
- [x] Null = cella assente; stringa vuota = `\E`; backslash iniziale letterale raddoppiato.
- [x] Esclusi Auth, admin_users, token/hash opt-out, segreti e configurazioni.
- [x] Riferimenti `created_by`/`sent_by` esterni ad admin_users dichiarati in README/METADATA.
- [x] METADATA: formato, orari, versione package.json, baseline migration,
  project ref, nome applicazione e conteggi dei 15 fogli (senza intestazione).
- [x] README: limiti, differenza da backup, esclusione Auth, conservazione sicura,
  incompatibilita' con il futuro import nuovi soci.
- [x] Testi sempre `inlineStr`; prefissi `= + - @`, anche dopo whitespace,
  con `quotePrefix`, senza alterare il testo. Nessuna formula, macro o link attivo.
- [x] Escape OOXML per CR e sequenze `_xHHHH_`; caratteri XML non rappresentabili
  e celle oltre 32.767 caratteri bloccano il file, senza troncamenti.
- [x] Buffer in memoria; nessun filesystem, Storage, allegato PR o workbook in Git.

## Consistenza e limiti

- [x] Pagine da 250, conteggio esatto, lettura fino all'ultimo record anche con
  cap server inferiore; nessuna query per singolo record (no N+1).
- [x] Due letture complete, confronto SHA-256 di valori normalizzati e conteggi;
  minimo 26 query business, costo per pagina e non per relazione.
- [x] Conteggi variabili, pagine mancanti, ID duplicati/fuori ordine e differenze
  fra letture bloccano l'intero export.
- [x] Limiti: 10.000 record complessivi, 10 MiB normalizzati, 3 MiB XLSX,
  timeout lettura/generazione 25 secondi. Nessun file parziale.
- [x] UI/README/METADATA dichiarano `non_transactional_double_read` e richiedono
  finestra senza scritture concorrenti.

**Non e' uno snapshot transazionale**. Il vincolo dell'implementazione vieta la
RPC/migration ipotizzata nella prima versione del piano. Due letture uguali non
escludono ogni anomalia concorrente; per backup consistente usare dump PostgreSQL.
`schema_migration_version` e' la baseline del manifest verificata in questa fase,
`20260607195558_010_email`, non introspezione privilegiata durante il download.

## Verifiche

| Verifica | Esito / evidenza |
| --- | --- |
| `npm run lint` | PASS, zero warning |
| `npx tsc --noEmit` | PASS, eseguito con `--no-install` usando compiler locale |
| `npm run build` | PASS; entrambe le nuove route dinamiche presenti |
| Test automatici | 16/16 PASS, comando sotto |
| Lettore XLSX indipendente | openpyxl + ZIP CRC in memoria: 15 fogli, header, tutte le celle sintetiche, tipi e conteggi |
| Supabase | Solo SELECT metadati/elenco migration; 13 tabelle business + admin_users, RLS attiva, zero policy DELETE |
| Migration | Live `001`-`010`, ultima `20260607195558 / 010_email`; nessuna M10 |
| Schema/manifest | Confronto information_schema: colonne e numeric(10,2)/timestamp/booleani coerenti; hash opt-out escluso |
| Browser pagina protetta | `http://127.0.0.1:3011/settings/data-import-export` senza sessione -> `/login?next=%2Fsettings%2Fdata-import-export` |
| HTTP protetto | Pagina GET, endpoint GET/POST anonimi: 307 verso login, nessun attachment |
| UI mobile/desktop | Fixture SSR isolata del componente reale e CSS build, senza DB: 375x667 e 1440x900, zero elementi oltre bordo; screenshot ispezionati |
| Smoke test autenticato | PASS comunicato dall'utente il 2026-09-19 sulla Vercel Preview PR #48: login super_admin, accesso pagina, download e apertura in Excel desktop |

```bash
node --require ./tests/register-typescript.cjs ./tests/data-export.test.ts
```

Il runner usa TypeScript gia' installato e `node:test`, transpila in memoria e non
esegue query di rete. Auth e client Supabase sono simulati solo nei test, mai
nel codice applicativo. Casi: manifest, tipi, null/vuoto, archiviati, paginazione,
cambi concorrenti, limiti, cancellazione, formula injection, compatibilita' M8,
admin/anon respinti, inactive/archived/Auth-only tramite guard simulata, progetto
errato, same-origin, GET negato, errori sanitizzati e redirect preservati.

Prima build in sandbox: compilazione riuscita, poi `Error: spawn EPERM` nel worker
TypeScript. Riesecuzione autorizzata di `npm run build`: PASS. Avvio locale usato:
`node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011`.
Nessun Start-Process o modifica a script/deploy per aggirare il limite.

Nel browser locale era presente una sessione pregressa non valida: il middleware
ha segnalato `refresh_token_not_found` e ha reindirizzato al login. Nessun valore
di token letto o stampato, nessun dato business mostrato. I controlli HTTP anonimi
sono stati eseguiti separatamente senza cookie. Non e' una regressione export.

Verifica indipendente: openpyxl legge il buffer tramite BytesIO;
`openpyxl.utils.escape.unescape` decodifica gli escape OOXML negli inline string.
Durante la verifica automatizzata Codex, nessun workbook reale scaricato, scritto
su disco, stampato o allegato. Il test manuale dell'utente e' documentato sotto.
Riferimenti: [Microsoft ST_Xstring](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/bd0aa042-434a-4ca7-b25f-4e1fd25a954d),
[openpyxl escape](https://openpyxl.readthedocs.io/en/stable/api/openpyxl.utils.escape.html).

## Smoke test autenticato sulla preview PR #48

Esito: **PASS**, comunicato dall'utente il 2026-09-19. Ambiente: Vercel Preview
della PR #48. Evidenza: conferma operativa dell'utente, non una nuova esecuzione
Codex. Commit applicativo della PR al momento della conferma:
`888a1b1e31ebe8dacd08694e16c9d06820ae29cd`; URL/hash del deploy non comunicati
separatamente. Nessun workbook acquisito per questo aggiornamento documentale.

- [x] Login super_admin riuscito.
- [x] Pagina `/settings/data-import-export` accessibile.
- [x] Download XLSX riuscito.
- [x] Workbook aperto con Excel desktop senza errori.
- [x] 15 fogli presenti, inclusi README e METADATA.
- [x] Conteggi coerenti e record campione verificati dall'utente.
- [x] Nessun foglio Auth/admin_users; nessun segreto rilevato dall'utente.
- [x] Nessuna modifica al database durante l'export, come confermato dall'utente.
- [x] Workbook non committato, non allegato alla PR e non caricato su servizi esterni.

Confermato il percorso positivo autenticato in preview. La comunicazione non
attesta prove manuali dedicate degli stati pending/errore, condizioni limite o
scritture concorrenti; non vengono dichiarate superate ulteriori prove manuali.
Restano valide le verifiche automatiche e le limitazioni di consistenza sopra.

## Limiti delle verifiche e gate post-merge

- [x] Smoke test manuale autenticato in preview: download e apertura in Excel
  desktop, eseguito e confermato dall'utente.
- [ ] Verifica post-merge prima di avviare M10-A1.

Per gli export successivi resta necessaria l'azione esplicita dell'operatore,
in finestra senza scritture e con conservazione protetta. Excel non e' un backup
PostgreSQL e lo smoke test non dimostra consistenza transazionale.

Il controllo visuale Codex riguarda la fixture SSR, non l'intero shell Safari
con sessione reale. Il percorso autenticato in preview e' stato invece verificato
dall'utente come sopra. Nessuno status o ruolo di amministratori reali e' stato
modificato da Codex per i test. Limiti di volume e compatibilita' con altre versioni
Excel richiedono rivalutazione se lo schema cresce.

Aggiornamento smoke test esclusivamente documentale: `git diff --check` superato;
lint/typecheck/build non rieseguiti, codice applicativo invariato rispetto alle
verifiche riportate sopra. Nessun nuovo export eseguito da Codex.

Nessuna implementazione M10-A1, M10-A2 o M10-C avviata.
