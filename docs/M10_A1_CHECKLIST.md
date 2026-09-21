# M10-A1 - Field Visibility Foundation

Data: 2026-09-21. Base: `main` al merge `63283c9`, PR #49 documentale positiva
M10-B mergiata prima dell'avvio. Branch: `codex/m10-a1-field-visibility-foundation`.
Progetto: **PonteNext**, `uhxfpsamenjhyrfgwckw`, PostgreSQL 17, ACTIVE_HEALTHY.

## Esito e confini

Foundation implementata; blocker B1 sulle scritture Data API **risolto** con
la sola `016`, applicata dopo gate esplicito, versione live `20260921205506`.
Test isolati e Data API live superati. Esito review: **MERGE SI**; PR non mergiata.
**Non e' il completamento di M10-A: A2 non e' iniziata.**
Nessun form, lista, dettaglio, mapper/update o validatore business modificato.
L'unico file applicativo preesistente modificato e' l'indice Impostazioni,
per aggiungere il link al catalogo. Nessun import C, gruppo, scope o readonly.

- [x] Una sola nuova tabella: `public.ui_field_visibility`.
- [x] Migration additiva `015_ui_field_visibility.sql`, nessun seed.
- [x] RLS, helper super_admin, CHECK coppie, FK autore, indici e trigger.
- [x] Registro tipizzato versione 1, 42 schermate, 116 coppie configurabili.
- [x] Resolver server-only in batch, default visible e diagnostica senza valori business.
- [x] Pagina protetta `/settings/field-visibility`, link da Impostazioni.
- [x] Lettura admin attivi; action di modifica bloccate anche per super_admin.
- [x] Blocco scritture dirette Data API verificato dopo la 016 approvata.
- [x] Tutte le schermate `integrated: false`: switch, Salva e Ripristina disabilitati.
- [x] Rifiuto server save/reset su schermate non integrate prima di query configurazione.
- [x] Nessun consumo del resolver nei moduli business o export.
- [x] Nessuna nuova dipendenza applicativa, env o modifica provider/deploy.
- [x] Review finale positiva dopo applicazione e collaudo della 016.
- [ ] Merge della PR A1, non eseguito automaticamente.
- [ ] Verifica post-merge A1 prima dell'avvio A2.

## Correzione B1: lock 016

- [x] `015_ui_field_visibility.sql` invariata e mai rieseguita sul live.
- [x] `016_lock_ui_field_visibility_foundation.sql`: solo policy/privilegi della tabella configurazione.
- [x] Rimozione policy INSERT/UPDATE; authenticated mantiene solo SELECT, anon/PUBLIC nessun accesso.
- [x] Nessun DML, RPC, funzione o modifica business; RLS e SELECT policy conservate.
- [x] Test isolati: admin e super_admin leggono, scritture ricevono SQLSTATE 42501.
- [x] Idempotenza e preservazione di righe, struttura, helper e oggetti estranei verificate in isolamento.
- [x] Gate esatto dopo SQL completo/conteggi: `MIGRATION 016 LOCK M10-A1 APPROVATA`.
- [x] Applicazione della sola 016, verifica storico/grant/policy e conteggi pre/post.
- [x] INSERT/PATCH Data API con JWT super_admin negati (403/42501), senza service role.
- [x] Review finale aggiornata dopo il collaudo live; nessun merge automatico.

Ricevuta conferma autonoma dopo SQL/conteggi: non usata la sola citazione nelle
istruzioni. Stato live attuale: SELECT admin attivi, nessuna scrittura applicativa,
anon negato, RLS attiva e configurazione vuota. La sezione 015 sotto e' storica.
Conteggi delle 14 tabelle preesistenti invariati alle 20:54:35 e 21:00:09 UTC.

## Migration 015 e validazione live storica

Ricevuto dall'utente il gate esatto **MIGRATION M10-A LIVE APPROVATA**, dopo
la presentazione del SQL completo e del perimetro additivo. Applicata tramite
MCP `apply_migration` solo `015_ui_field_visibility`, versione
**20260921195425**. Nessun placeholder 011-014 applicato. Storico 001-010 invariato.

Lo scaffold e' stato creato con Supabase CLI 2.101.0 in una directory temporanea
non collegata al live, poi riportato nella convenzione numerata del repository.
Non sono stati creati config CLI, file di link o credenziali nel repository.

- Nuova tabella con id, screen_key, field_key, is_visible, updated_by,
  created_at, updated_at, archived_at. Zero righe dopo migration e browser test.
- `updated_by` NOT NULL riferisce `admin_users.id`, non `auth.uid()`.
- CHECK `ui_field_visibility_supported_pair`: solo coppie facoltative supportate;
  hash MD5 della definizione di catalogo live `4bd414d8dd14cbaab05c884ee608b2c4`.
- Unicita' parziale `(screen_key, field_key)` WHERE archived_at IS NULL;
  indice FK updated_by, trigger `set_ui_field_visibility_updated_at` che riusa
  `public.set_updated_at()` senza modificarlo.
- Helper `app_private.is_super_admin()`: STABLE SECURITY DEFINER,
  `search_path = ''`, nomi qualificati, ruolo/stato/archiviazione verificati;
  anon senza EXECUTE, authenticated con EXECUTE.
- Tre sole policy, tutte authenticated: SELECT admin attivi; INSERT/UPDATE
  super_admin attivi, autore verificato. UPDATE esclude righe sorgenti archiviate;
  reset non rende riutilizzabile il vecchio ID.
- Grant authenticated limitati SELECT/INSERT/UPDATE; nessun anon/PUBLIC,
  DELETE/TRUNCATE/REFERENCES/TRIGGER applicativo. Non replicati i grant legacy ampi.
- 15 tabelle public dopo migration, tutte con RLS attiva. Nessun ALTER/DML su
  tabelle business, nessuna modifica Auth o dati amministratore.

Conteggi esatti prima e dopo, sole letture aggregate, nessun record esportato:

| Tabella preesistente | Prima | Dopo |
| --- | ---: | ---: |
| admin_users | 2 | 2 |
| members | 105 | 105 |
| roles | 7 | 7 |
| member_roles | 3 | 3 |
| membership_plans | 3 | 3 |
| memberships | 6 | 6 |
| payments | 2 | 2 |
| sponsors | 2 | 2 |
| sponsor_contributions | 2 | 2 |
| events | 2 | 2 |
| event_sponsors | 0 | 0 |
| email_templates | 1 | 1 |
| email_campaigns | 0 | 0 |
| email_campaign_recipients | 0 | 0 |

Gli stessi conteggi non sono da soli una prova di uguaglianza dei valori:
la preservazione e' supportata anche dall'assenza di DML/ALTER business nel SQL
applicato e dall'assenza di operazioni live di modifica durante il collaudo.

## Registro, risoluzione e scritture predisposte

- Chiavi stabili indipendenti dalle label, mappatura esplicita `formKey`, campi
  obbligatori e workflow non configurabili. Nessun ID tecnico o audit nel catalogo.
- Desktop/card mobile condividono screen_key; contesti create/edit/detail distinti.
- Registro autorevole e CHECK SQL allineati da test; nuove coppie richiedono
  aggiornamento coordinato con una nuova migration, non modifica della 015 applicata.
- Una SELECT di configurazione per insieme canonico di schermate, colonne esplicite,
  conteggio esatto e limite derivato dal registro; nessuna query per campo.
- React `cache` limitata alla request/render, nessuna cache globale o localStorage.
  Guard prima di accedere al loader; client Supabase di sessione, mai service role.
- Default visible per assenza/archiviazione; override invalidi ignorati con warning.
  Errore lettura -> default con avviso; scritture bloccate, errori sanitizzati.
- Salvataggio predisposto: allowlist completa per schermata, soli booleani,
  rilettura fresca non memoizzata, ID/autore/timestamp server, un bulk upsert su PK.
  Conflitto di coppia attiva o ID archiviato -> fallimento intero, nessun retry.
- Reset predisposto: unico UPDATE degli override attivi, soft archive, nessun DELETE.
  Created_at preservato; nuovo salvataggio dopo reset usa nuovo ID.
- Revalidate della sola pagina Impostazioni. A2 aggiungera' le viste integrate;
  nessuna invalidazione o applicazione prematura ai moduli business.

Le scritture dirette consentite dalla 015 sono il blocker B1, non un comportamento
accettabile per A1. La 016 le nega anche al super_admin autenticato: test Data API PASS.
Le funzioni upsert/reset predisposte restano irraggiungibili con integrated=false;
non riattivarle direttamente in A2. La futura A2 richiede una RPC controllata,
allowlist database delle sole coppie integrate, verifica super_admin attivo e
updated_by risolto da auth.uid() tramite admin_users.auth_user_id. Ogni rollout
estendera' esplicitamente l'allowlist; non ripristinare INSERT/UPDATE diretti.
Nessuna RPC implementata in A1 e nessuna service role nel browser.

## Test automatizzati

Comandi eseguiti sul branch:

```text
npm run lint
npx --no-install tsc --noEmit
npm run build
node --require ./tests/register-typescript.cjs ./tests/field-visibility.test.ts
node --require ./tests/register-typescript.cjs ./tests/field-visibility-db.test.ts
node --require ./tests/register-typescript.cjs ./tests/data-export.test.ts
```

Esiti della review iniziale: lint, typecheck e build superati; 12/12 test
foundation, 7 scenari SQL piu' wrapper, 16/16 regressioni M10-B. La correzione
016 aggiunge il contratto SQL esatto e tre scenari di lock: **13/13** foundation
e **10 scenari SQL piu' due wrapper (12/12 runner)**, superati in isolamento.
Le prove storiche della sola 015 restano separate da quelle dello stato 015+016.
Rieseguiti sulla correzione: lint, typecheck, build e git diff --check PASS;
regressione M10-B **16/16 PASS** con soli dati sintetici. Nessun nuovo export live.
Conteggi pre/post-016 del 2026-09-21 identici alla tabella storica sopra,
ui_field_visibility = 0. Nello storico una sola 016 `20260921205506`;
nessuna riesecuzione della 015. Rerun post-gate delle tre suite e lint/tsc/build PASS.
Dettagli e limiti del collaudo corrente in M10_A1_REVIEW_REPORT.md.
Build include `/settings/field-visibility` dinamica e conserva tutte le route.
Il primo processo lint rimasto fermo e' stato interrotto e rilanciato con
`npm.cmd run lint`, terminato con exit 0. Build eseguita con permesso di avvio worker.

I test SQL usano **PGlite 0.3.14**, PostgreSQL/WASM in memoria, con Auth/ruoli e
anagrafiche esclusivamente sintetici. Non sono mock del motore SQL, ma non sono
nemmeno un'istanza Supabase/PostgREST completa. Nessuna dipendenza nel package.json.
Prerequisito riproducibile PowerShell, installato solo in directory temporanea:

```powershell
$runtime = Join-Path $env:TEMP 'pontenext-m10-a1-validation'
npm install --prefix $runtime --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.3.14
$env:PGLITE_TEST_MODULE = Join-Path $runtime 'node_modules/@electric-sql/pglite'
node --require ./tests/register-typescript.cjs ./tests/field-visibility-db.test.ts
```

`PGLITE_TEST_MODULE` e' solo un percorso per il test, non una env applicativa,
una connessione remota o un segreto da aggiungere a `.env.example`.

Casi coperti: default/override/archiviazione, parita' di tutte le coppie,
obbligatori/chiavi arbitrarie, booleani/stringhe/payload tecnici, guard prima
delle query, admin ordinario, super_admin, anon, inactive/archived/Auth senza
admin, autore falsificato/Auth UUID, grant distruttivi negati, trigger,
unicita', rollback bulk, ID obsoleto dopo reset non riattivabile, nuovo ID
dopo reset. Le fixture di salvataggio usano un'integrazione simulata solo nel
test; non esiste un bypass o una variabile ambiente di attivazione nel runtime.

## Browser e responsive

Build locale avviata con:

```text
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011
```

- [x] Anonimo su `/settings/field-visibility` -> `/login?next=...`.
- [x] Login super_admin reale autorizzato, redirect alla pagina corretta.
- [x] Lettura della tabella live vuota: catalogo completo, nessun warning DB.
- [x] Scelta modulo/schermata, ricerca campo e nessun risultato.
- [x] Empty state template email senza campi configurabili.
- [x] Obbligatori visibili/disabilitati, testi di motivazione, tutti i comandi inattivi.
- [x] Desktop tabella, mobile elenco, input a 16px.
- [x] 1440px, 375px e 360px: larghezza documento non supera il viewport.
- [x] A 375x667 i pulsanti finali arrivano a y=523, con spazio inferiore disponibile.
- [x] Reload autenticato riuscito, nessuna preferenza scritta e nessun export reale.

Prima del nuovo login la sessione locale precedente ha prodotto
`Invalid Refresh Token: Refresh Token Not Found`; il login esplicito e il
successivo reload sono riusciti. Non modificata la gestione Auth per questo
evento locale. Nessun token o credenziale copiato in file/log della PR.
Controllo responsive tramite Chromium del browser integrato, non dispositivo
Safari reale: il collaudo fisico iPhone resta una verifica aggiuntiva.

## Rilievi e prossimi gate

**B1 risolto: 016 approvata, applicata e verificata anche tramite Data API.**
Gli altri rilievi restano documentati, senza interventi fuori scope:

- Security Advisor: warning Auth per
  [protezione password compromesse disabilitata](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
  Nessun rilievo sul nuovo helper/tabella/RLS.
- Performance Advisor: tre FK legacy senza indice (created_by/sent_by email_campaigns,
  created_by email_templates), e 42 indici segnalati inutilizzati. Sulla foundation
  solo `ui_field_visibility_updated_by_idx` inutilizzato, atteso su tabella vuota:
  non rimuoverlo. [FK](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
  [indici inutilizzati](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
- Concorrenza SQL/rollback verificati in isolamento; due richieste simultanee
  PostgREST e invalidazione dopo scrittura reale da collaudare in staging prima
  di attivare il primo modulo A2. In A1 i comandi operativi sono bloccati.
- La memoizzazione e' testata con adapter di request cache, non con un contatore
  query su Next.js Production. Il loader di pagina e' stato verificato nel browser.
- A2 deve prima rendere mapper/update presence-aware e superare test di non
  perdita dati per ogni contesto; solo dopo puo' porre integrated=true.
- M10-B resta invariata: timeout sincrono non rigidamente interrompibile e
  10 MiB riferiti ai dati normalizzati, non all'intera memoria. Rivalutare solo
  con crescita significativa dei volumi, come approvato nella review B.

Riferimenti verificati: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[changelog](https://supabase.com/changelog), [PGlite](https://pglite.dev/docs/).
Nessuna email inviata, workbook reale acquisito o dato business modificato.
