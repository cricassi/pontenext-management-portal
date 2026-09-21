# M10-B Complete Excel Export - Post-Merge Verification

Data: 2026-09-20. Verifiche concluse alle 04:31 UTC, 06:31 Europe/Rome.
Progetto Supabase: PonteNext `uhxfpsamenjhyrfgwckw`.
Ambiente applicativo: Vercel Production.

## 1. Esito complessivo

**PASS. Decisione finale: M10-B completata SI.**

Main contiene integralmente M10-B, la PR #48 risulta mergiata e il deployment
Production registrato da Vercel corrisponde al merge commit. Route protette,
test automatici, lint, typecheck, build e controlli Supabase read-only superati.
L'export reale dalla Production e l'apertura in Excel desktop sono confermati
dall'utente; il workbook non e' stato acquisito o esaminato da Codex.

**Problemi bloccanti: nessuno rilevato.** Restano le raccomandazioni non
bloccanti gia' accettate su timeout cooperativo e budget dei dati normalizzati.
Nessun fix richiesto ora; rivalutazione con crescita significativa del volume dati.

Questa PR aggiunge soltanto il presente report. Nessuna modifica di codice,
migration, schema/policy/dati Supabase o configurazione Vercel. Nessun workbook
reale scaricato, allegato o committato. Nessun invio email. M10-A1 e M10-C non avviate.

## 2. Repository e merge

| Controllo | Evidenza / esito |
| --- | --- |
| PR implementativa | [PR #48](https://github.com/cricassi/pontenext-management-portal/pull/48), stato MERGED |
| Merge | 2026-09-20 04:12:34 UTC |
| Main verificato locale/remoto | `6bc4c32f77db0479cdbfa0edd80018817fa38f5a` |
| HEAD finale PR #48 | `596c766b2ec2a0033bc9b321186423932b7acdf5` |
| Codice applicativo | Commit `888a1b1e31ebe8dacd08694e16c9d06820ae29cd`, incluso nel merge |
| Presenza merge | `git merge-base --is-ancestor 6bc4c32f77db0479cdbfa0edd80018817fa38f5a main`: exit 0 |
| Integrita' post-merge | Diff tra HEAD finale PR #48 e main su src, tests, database, docs e README vuoto |
| Working tree iniziale | Pulito, main allineato a origin/main |
| Scope B | Nuove route export, service, manifest, utility XLSX, pulsante, test e documentazione presenti |
| Nessuna field visibility/import | Nessun codice ui_field_visibility, field-visibility, members-import, members-template, permission group o formato import nuovi soci in src/tests/database |
| Nessuna migration B | Nessun diff database/Supabase rispetto alla base `ec99307`; journal live ancora 001-010 |
| Configurazioni e dipendenze | Nessun diff M10-B in package.json, lockfile, .env.example o vercel.json |

Branch di questa verifica: `codex/m10-b-post-merge-verification`, derivato dal
main sopra indicato. Le citazioni di A1/A2/C nei piani non sono implementazioni.
La route data-import-export contiene esclusivamente l'export, non upload,
parser o pulsanti di importazione, neppure disabilitati.

## 3. Deployment Production

**Esito: PASS, deployment completato e operativo.**

- Dominio verificato: [PonteNext Production](https://pontenext-management-portal.vercel.app).
- Deployment GitHub creato da `vercel[bot]`: `6548916405`.
- Ambiente: `Production`, non Preview.
- SHA: `6bc4c32f77db0479cdbfa0edd80018817fa38f5a`, identico al main verificato.
- Stato terminale pubblicato da Vercel: `success`.
- Descrizione: `Deployment has completed`.
- Data stato: 2026-09-20 04:13:17 UTC.
- URL univoco registrato:
  [Deployment Production](https://pontenext-management-portal-hsv1zwxu6-ponte-next-s-projects.vercel.app).

Evidenza ottenuta in sola lettura con GitHub API:
`repos/cricassi/pontenext-management-portal/deployments` e
`repos/cricassi/pontenext-management-portal/deployments/6548916405/statuses`.
Il controllo Ready/completamento usa lo stato terminale comunicato
dall'integrazione Vercel, corroborato dal dominio funzionante e dalla conferma
operativa dell'utente. Non e' stata interrogata l'API privata Vercel per il
campo letterale readyState, ne' modificata la configurazione del progetto.

Il deployment Production corrisponde al commit di main. Questo verifica la
provenienza del rilascio esaminato, non modifica o certifica impostazioni di
deploy future. Nessun redeploy/promote manuale eseguito.

L'URL univoco del deployment, aperto senza sessione Vercel, risponde 302 verso
SSO Vercel. Non e' stato aggirato il controllo o seguito il login. Il confronto
degli asset fra URL univoco e dominio non e' quindi disponibile: non e' una
differenza di build accertata. Il dominio Production pubblico risponde normalmente.

### Controllo HTTP diretto del dominio Production

Richieste senza cookie, Authorization o credenziali. Redirect automatici
disabilitati; risposte export non lette come file e nessun attachment ricevuto.

| Metodo | Route | Stato | Esito |
| --- | --- | --- | --- |
| GET | `/login` | 200 | Pagina HTML accessibile, nessun attachment |
| GET | `/settings/data-import-export` | 307 | `/login?next=%2Fsettings%2Fdata-import-export` |
| GET | `/settings/data-import-export/export` | 307 | `/login?next=%2Fsettings%2Fdata-import-export%2Fexport` |
| POST | `/settings/data-import-export/export` | 307 | Stesso redirect al login, nessun workbook |

Il POST anonimo si ferma al controllo di autenticazione, non esegue un export
autorizzato. Un redirect del middleware da solo non dimostra che esista il
Route Handler: la presenza di entrambe le route e' verificata anche nel codice
mergiato, nell'output di build e dal download Production riferito dall'utente.

Le risposte anonime di redirect hanno `Cache-Control: public, max-age=0,
must-revalidate`, senza contenuti business. Non vanno confuse con l'attachment
autenticato, per cui codice e test verificano `private, no-store` e `nosniff`.

## 4. Autorizzazione e Supabase

| Requisito | Esito / metodo |
| --- | --- |
| Pagina protetta | requireActiveAdmin prima del rendering; controllo server-side super_admin |
| Endpoint protetto | requireFullExportAdmin all'inizio del POST, prima di exportFullApplicationData |
| Service protetto | Nuova guard prima delle query business e ricontrollo al termine delle letture |
| Admin attivo | getUser verifica l'utente Auth; admin_users filtrata per auth_user_id, status active e archived_at null |
| Admin ordinario negato | Pagina -> /settings, endpoint -> 403; analisi statica e test isolati superati |
| Anonimo negato | Redirect al login verificato direttamente in Production |
| Inactive/archived/Auth-only | Negati nei test della guard con client simulato; nessun account live modificato per collaudo |
| Sessione/RLS | Client SSR con cookie utente e anon key; nessuna service role nel percorso export |
| Progetto | Allowlist URL PonteNext, altro progetto rifiutato prima delle query business |
| CSRF/metodo | Solo POST produce il workbook; Origin same-origin e controllo Sec-Fetch-Site; GET autorizzato -> 405 nei test |

Gli account admin ordinari, inactive e archived non sono stati impersonati in
Production: l'evidenza negativa deriva da codice/test, distinta dalla prova
HTTP anonima e dallo smoke test positivo Production dell'utente. Le letture
Auth/admin necessarie alle guard precedono ogni query business.

### Stato Supabase rilevato ora, solo metadati

- PonteNext `uhxfpsamenjhyrfgwckw`: ACTIVE_HEALTHY, eu-central-1,
  PostgreSQL 17.6.1.127.
- Migration applicate: 001_extensions, 002_admin_users,
  003_harden_admin_functions, 004_members_roles, 005_membership_plans,
  006_memberships_payments, 007_sponsors, 008_events,
  009_sponsor_contributions, 010_email. Nessuna migration M10-B.
- Ultima migration: `20260607195558 / 010_email`.
- 14 tabelle public: admin_users e le 13 business esportabili.
- RLS attiva su tutte; zero policy DELETE o ALL rilevate.
- SELECT business per authenticated con app_private.is_active_admin().
  Nessun filtro archivio nella policy impedisce l'inclusione degli archiviati.
- Helper con search_path vuoto, riferimenti qualificati, controllo auth.uid(),
  status active e archived_at null.
- Confronto manifest/information_schema: 13 tabelle, 158 colonne esportate,
  zero colonne mancanti e zero tipi incompatibili. Unica colonna business
  omessa deliberatamente: email_campaign_recipients.opt_out_token_hash.

Consultati stato progetto, journal migration, cataloghi colonne/policy e
definizione del helper. Nessuna query sulle righe business, auth.users o
anagrafiche admin. Nessuna chiamata DDL/DML, RPC operativa o Storage.
Le RLS degli admin ordinari restano quelle preesistenti: il vincolo super_admin
si applica alla funzione di export completo, non revoca il CRUD ordinario.

## 5. Workbook e sicurezza

Verifica strutturale tramite codice su main e test con soli dati sintetici
generati in memoria. Il workbook reale dell'utente non e' una fixture dei test.

| Controllo | Esito |
| --- | --- |
| Formato/nome | pontenext-full-export-v1; pontenext-full-export-YYYY-MM-DD-HHmm.xlsx, UTC |
| Fogli | 15: README, METADATA e 13 tabelle business nel manifest esplicito |
| README | Scopo, data/formato, elenco fogli, conservazione sicura, esclusione Auth, non-backup e non compatibile con futuro import nuovi soci |
| METADATA | Versioni, orari, project ref non segreto, strategia lettura, esclusioni e conteggi per tutti i fogli |
| Archiviati | Inclusi, senza filtro archived_at/status; archived_at esportato dove esiste |
| UUID/FK | Testo integrale; created_by/sent_by preservati come riferimenti esterni ad admin_users non esportata |
| Date/importi/bool | Date ISO, timestamp ISO con microsecondi, numeric(10,2) in celle numeriche, booleani nativi |
| Null/vuoto | Cella assente = null; stringa vuota = \\E; backslash iniziale letterale raddoppiato |
| Determinismo | Ordine fogli/colonne esplicito, righe ordinate per id; nessun SELECT * |
| Esclusioni | Nessun auth.users/admin_users come foglio, password/sessione/token/API key/connection string/configurazione segreta; hash opt-out escluso |
| Formula injection | Stringhe inlineStr; quotePrefix per = + - @ anche dopo whitespace; nessun elemento formula |
| Contenuti attivi | Nessuna macro, relazione esterna, hyperlink attivo o esecuzione HTML |
| Validita' XLSX | Caratteri XML illegali e celle oltre limite rifiutati; nessun troncamento silenzioso |
| Persistenza | Workbook solo in memoria lato server; nessun file su disco o Supabase Storage |
| Log/errori | Nessun log di righe/workbook nel percorso export; messaggi sanitizzati e redirect Next preservati |

Ordine dei 13 fogli business: members, roles, member_roles, membership_plans,
memberships, payments, sponsors, sponsor_contributions, events, event_sponsors,
email_templates, email_campaigns, email_campaign_recipients. Quest'ultima
tabella non possiede archived_at; il writer non inventa tale colonna.

La versione schema in METADATA e' dichiaratamente la baseline del manifest
`20260607195558_010_email`, non introspezione privilegiata durante il download.
Timestamp e metadata di generazione rendono il file non necessariamente
identico byte per byte fra due export, pur mantenendo stabile il formato.

Scansione mirata dei file src/tests tracciati senza stampare valori: nessun
literal nei pattern controllati di chiavi private/JWT/connection string.
Nessun riferimento a service role o RESEND_API_KEY nei bundle client compilati.
Nessun workbook XLSX/XLS/CSV tracciato; .env.local non tracciato o letto.
Questi controlli non certificano l'assenza di segreti eventualmente incollati
da un operatore nei campi di testo liberi: nessuna ispezione massiva dei dati live.

## 6. Consistenza e assenza di scritture

- Due letture complete paginate, pagine da 250 e conteggio esatto; nessuna
  query per singolo record/relazione, minimo 26 query business.
- SHA-256 di contenuti normalizzati, ordine, tabelle e conteggi confrontato
  fra letture. Divergenza, drift conteggi, righe mancanti/id duplicati o
  fuori ordine bloccano l'export; test sintetici superati.
- Massimo 10.000 righe complessive, 10 MiB normalizzati, 3 MiB XLSX. Nessun
  export limitato ai primi N record o attachment restituito a meta' generazione.
- Nessun INSERT/UPDATE/UPSERT/DELETE/RPC/Storage nel percorso export.
  L'export reale senza modifica dati e' inoltre confermato dall'utente.
- UI, README/METADATA e MIGRATION_AND_BACKUP dichiarano esplicitamente che
  **non e' uno snapshot transazionale** e richiedono assenza di scritture
  concorrenti. Due digest uguali non provano consistenza transazionale.
- **L'export Excel e' portabilita' e consultazione, non un backup completo
  PostgreSQL/Supabase.** Non ricrea Auth, schema, policy o configurazioni.

## 7. Esito export reale Production

**PASS, confermato dall'utente nella richiesta del 2026-09-20.**

Conferme ricevute: deployment Production completato da main; export autenticato
eseguito dalla Production con account super_admin; workbook aperto in Excel
desktop e verificato; conservazione esterna, non in Git; nessuna modifica dati
durante l'export.

Si tratta di una nuova evidenza Production, distinta dal precedente smoke
test Preview della PR #48 documentato nella checklist. Il dettaglio tecnico
di 15 fogli, tipi, esclusioni e ordine e' verificato dai test/manifest sul
codice mergiato; non viene attribuita a Codex una nuova ispezione del file reale.

Nessun workbook, screenshot contenente dati, conteggio live o record campione
richiesto/acquisito per questa verifica. Nessun nuovo login con credenziali
reali o export autenticato avviato da Codex.

## 8. Verifiche tecniche rieseguite sul codice mergiato

| Verifica | Esito |
| --- | --- |
| npm run lint | PASS, exit 0, zero warning nella riesecuzione fuori sandbox |
| npx --no-install tsc --noEmit | PASS, exit 0; compiler locale, nessuna installazione |
| npm run build | PASS, Next.js 16.2.7, exit 0 |
| Test automatici M10-B | PASS 16/16, zero falliti/skipped, nessuna rete/database |
| Route nell'output build | /settings/data-import-export e /settings/data-import-export/export, entrambe dinamiche |
| Route Production anonime | PASS, login 200 e pagina/endpoint GET/POST 307 verso login, nessun attachment |
| Supabase read-only | PASS, metadati e schema/manifest come sezione 4 |
| Equivalenza codice | Diff HEAD finale PR #48/main vuoto; nessun codice modificato nella verifica |
| git diff --check | PASS |

Comando dei test:

```bash
node --require ./tests/register-typescript.cjs ./tests/data-export.test.ts
```

La prima esecuzione lint in sandbox e' rimasta senza esito ed e' stata
interrotta; la riesecuzione autorizzata fuori sandbox e' terminata correttamente.
Non viene dichiarato PASS il tentativo interrotto o attribuita una causa
applicativa non dimostrata. Anche la build usa l'esecuzione autorizzata per
il limite spawn EPERM dei worker gia' documentato. Nessun Start-Process,
dev-server, modifica a script/configurazioni o lettura/stampa di segreti.

## 9. Problemi non bloccanti e raccomandazioni

**Nessun nuovo problema bloccante o regressione M10-B rilevati.**

Restano accettati, senza fix immediato:

1. Il timeout applicativo non interrompe rigidamente una generazione sincrona
   gia' iniziata; non e' una garanzia di deadline end-to-end di 25 secondi.
2. Il limite 10 MiB misura i dati normalizzati elaborati, non tutta la memoria
   heap/RSS del processo o i buffer intermedi.

**Rivalutazione necessaria solo con crescita significativa del volume dati.**
In quel caso misurare memoria/durata su fixture separate prima di aumentare
i limiti e considerare le mitigazioni descritte nella review. Nessun benchmark
di stress o cambiamento dei limiti eseguito sulla Production.

Le raccomandazioni minori pregresse su riepiloghi documentali e ampliamento
della copertura automatica restano tracciate in
[M10_B_EXPORT_REVIEW_REPORT.md](M10_B_EXPORT_REVIEW_REPORT.md); non riaprono il
merge o il completamento. Nessuna falsa promessa di backup o consistenza
transazionale viene introdotta da questo esito.

## 10. Decisione finale

**M10-B completata: SI.** Verifica post-merge positiva per il commit 6bc4c32:
repository e deployment Production allineati al commit, protezioni confermate,
test tecnici superati ed export reale Production attestato dall'utente.

Questo report chiude la verifica post-merge M10-B; non avvia M10-A1/A2 o M10-C
e non autorizza nuove migration, importazioni o modifiche ai dati live.
