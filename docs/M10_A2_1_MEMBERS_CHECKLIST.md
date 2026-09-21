# M10-A2.1 - Field Visibility Members Only

Implementazione e verifiche: 2026-09-21/22, orario Europe/Rome.
Base: main `e40f790`, dopo merge della verifica A1, PR #51.
Stato: **implementazione/test locali completati; 017 applicata e verificata live**.
Review finale positiva dopo fix B1 (`f049b1e`): **MERGE SI**.
PR #52 mantenuta in bozza fino al completamento della review; l'utente ha poi
autorizzato esplicitamente anche il merge in caso di esito positivo.
Il presente documento registra le verifiche pre-merge, non certifica il deploy Production.

## Scope

- [x] Solo members.list, members.create, members.edit, members.detail integrate.
- [x] Registro versione 2; 33 coppie soci attivate, CHECK 015 invariato (116 coppie note).
- [x] Lista: email, phone, city. Create/edit/detail: anche address, postal_code,
  province, birth_date, fiscal_code, profession, notes.
- [x] Nome, cognome, paese, stato e controlli tecnici sempre visibili/non configurabili.
- [x] Solo visible/hidden globale, nessun readonly, permission group o import.
- [x] Tutti gli altri moduli integrated=false; azioni/switch disabilitati e
  dicitura "Attivazione prevista in una fase successiva".
- [x] Export M10-B, report, email/segmentazione e relazioni non modificati.

## RPC e Sicurezza

- [x] `017_enable_member_field_visibility_rpc.sql` creata da scaffold CLI locale,
  adattata alla numerazione del repository; 015 e 016 invariate.
- [x] Nessun ALTER/DML business, nuova tabella, policy o grant di tabella.
- [x] Wrapper public SECURITY INVOKER, writer privato SECURITY DEFINER;
  search_path vuoto, owner postgres, EXECUTE authenticated, revocato ad anon/PUBLIC/service_role.
- [x] Guard app super_admin e controllo autonomo SQL auth.uid()/is_super_admin().
- [x] updated_by da admin_users.id, non da parametro client o Auth UUID.
- [x] Allowlist DB soli 4 screen e campi facoltativi soci, soli booleani completi.
- [x] Nessun SQL dinamico o mass assignment; nessuna service role nell'applicazione.
- [x] Salvataggio atomico; lock per schermata, confronto baseline stati, conflitti
  40001 senza retry automatico. Stessa baseline semantica resta valida se lo stato
  torna identico: non e' una revisione di audit monotona.
- [x] Reset soft; nessuna cancellazione o riattivazione di ID archiviati.
- [x] Data API diretta INSERT/UPDATE/DELETE/TRUNCATE ancora negata anche al super_admin.

## Conservazione Dati

- [x] Ogni submit rilegge le preferenze, senza usare la cache render.
- [x] Guard prima dei fetch; warning/errore di configurazione blocca i salvataggi.
- [x] Valori hidden esclusi dai props del form client e dai controlli HTML.
- [x] Hidden o chiavi sconosciute/tecniche, duplicati e file in request respinti;
  se la configurazione cambia mentre si compila, ricaricare prima di riprovare.
- [x] Modifica: record completo ricostruito per validazione; patch solo dei campi
  inviati, visibili e realmente cambiati. Assenza non diventa null/vuoto/false.
- [x] Valori legacy non inviati conservati verbatim, anche se non conformi alle
  regole per nuovi input; nessuna rinormalizzazione di hidden. Nuovi input validati.
- [x] Stringa vuota esplicita azzera soltanto un facoltativo visibile.
- [x] Versione updated_at catturata all'apertura e passata come argomento bound
  della server action; confronto con lettura fresca e CAS nell'UPDATE. Modulo
  obsoleto o concorrenza durante la scrittura respinti senza sovrascritture.
- [x] Create: null/default preesistenti per hidden; obbligatori validati.
- [x] Nessun aggiornamento a roles, member_roles, memberships o altre relazioni.

Test SQL isolato con le migration reali 002-006, 015, 016, 017, identita' sintetiche
e service `members.service.ts` effettivo collegato a un adapter PostgreSQL locale:
socio con email/telefono/indirizzo/note, email e note hidden, modifica cognome e
telefono. SQL verifica email/note/indirizzo/ID/created_at/archived_at invariati e
patch esatta `{last_name, phone}`. Conteggio soci resta uno; relazioni identiche.
Create sintetica in transazione di test, poi rollback; nessuna riga live inserita.
Test separato dimostra preservazione byte-per-byte di note con spazi ed email legacy.
La review ha aggiunto due regressioni CAS e verifica esplicita che, dopo reset,
email/note tornino nei props visibili senza alterare il record nel database isolato.

## UI e Browser

- [x] Stessa preferenza per tabella desktop e card mobile, intestazioni/valori hidden assenti.
- [x] Create/edit/detail soci verificati; identita', stato e paese restano leggibili.
- [x] Impostazioni: modulo/schermata, switch soci, conferma, salvataggio, reset,
  refresh, messaggi e stato dirty/pending; admin ordinario coperto da test render/server.
- [x] Browser Next.js locale con backend esclusivamente sintetico in memoria:
  login demo, modifica socio demo, creazione demo senza email/note, save/reset
  configurazione. Dopo reset lista email conservata nuovamente visibile.
- [x] Cambiando modulo in Sponsor, catalogo non attivo e switch disabilitati.
- [x] Cinque route controllate a 360, 375, 390 e 1280 pixel, 20 combinazioni;
  nessuno scroll orizzontale della pagina (`scrollWidth <= innerWidth`).
- [x] Screenshot desktop lista/impostazioni e mobile form ispezionati con soli dati demo.
- [x] Review: prova browser con due moduli demo aperti; primo salvataggio riuscito,
  secondo obsoleto rifiutato con messaggio comprensibile. Valori concorrenti
  preservati dopo ricaricamento; email/note hidden ancora non renderizzate.

Route: /members, /members/new, /members/[id], /members/[id]/edit,
/settings/field-visibility. Browser Chromium, non dispositivo Safari fisico.
Fixture riproducibile: `tests/member-visibility-browser-fixture.cjs`, solo loopback
54329; Next.js 3011 con URL/anon key sintetici sovrascritti nel solo processo,
env server segrete vuote. Nessun file env modificato. Login demo con next diretto
ai soci/impostazioni: la fixture non implementa dashboard o altri moduli.
La fixture HTTP verifica UI/server actions, **non** la RLS reale; questa e' verificata
separatamente nei test SQL. Server e fixture arrestati al termine del collaudo.

## Verifiche Tecniche

- [x] `npm run lint`.
- [x] `npx tsc --noEmit`.
- [x] `npm run build`; route soci e Impostazioni presenti, tutte le route precedenti conservate.
- [x] `tests/field-visibility.test.ts`: 13 test.
- [x] `tests/field-visibility-db.test.ts`: 12 test runner (015/016 storiche, solo isolate).
- [x] `tests/member-visibility.test.ts`: 7 test, inclusi render dei 42 screen per entrambi i ruoli.
- [x] `tests/member-visibility-db.test.ts`: 14 test runner (13 scenari + wrapper).
- [x] `tests/data-export.test.ts`: 16 regressioni sintetiche M8/M10-B.
- [x] `git diff --check` e controllo diff 015/016 vuoto.

Suite TypeScript eseguite con `node --require ./tests/register-typescript.cjs`.
Totale dopo fix della review: **62/62 PASS**, nessun test fallito o saltato.
Lint, typecheck e build rieseguiti positivamente dopo il fix; CSS/layout invariati.
Suite SQL richiedono `PGLITE_TEST_MODULE` verso @electric-sql/pglite 0.3.14,
installato separatamente nella directory temporanea di test. Nessuna nuova
dipendenza applicativa o modifica al lockfile.
La prima build in sandbox si e' fermata a `spawn EPERM`; build autorizzata fuori
sandbox riuscita. Nessun uso di Start-Process.

## Supabase Read-Only e Gate

Solo PonteNext `uhxfpsamenjhyrfgwckw`. Pre-migration 2026-09-21 22:13:11 UTC;
post-migration/test 22:15:36 UTC. Conteggi identici in entrambe le letture:

| Tabella | Conteggio |
| --- | ---: |
| admin_users | 2 |
| members | 105 |
| roles | 7 |
| member_roles | 3 |
| membership_plans | 3 |
| memberships | 6 |
| payments | 2 |
| sponsors | 2 |
| sponsor_contributions | 2 |
| events | 2 |
| event_sponsors | 0 |
| email_templates | 1 |
| email_campaigns | 0 |
| email_campaign_recipients | 0 |
| ui_field_visibility | 0 |

Conteggi invariati dalla verifica A1. RLS attiva, sola policy SELECT admin attivi,
authenticated senza grant di scrittura diretta. Nessuna modifica di dati business,
email o export reale eseguiti durante A2.1.

Storico: 015 registrata una volta come `20260921195425`, 016 una volta come
`20260921205506`; sola 017 applicata come `20260921221332` dopo il gate. Wrapper
public e writer privato presenti. 015 e 016 non rieseguite.

### Evidenze Post-Applicazione 017

- SQL approvato invariato: SHA-256 file
  `2c045354946243566628915aec2aed42e0268ca3894b61eec7a1d7997409a5da`.
- Confronto SQL locale/storico live rimuovendo whitespace, MD5 uguali:

| Migration | MD5 SQL normalizzato |
| --- | --- |
| 015 | dc411b05b0ca1d9c683f3b10d8cdf73c |
| 016 | 9f74a75112080ce904215fd5b012e330 |
| 017 | 300f8ff5773a384fdd6d453bf3367df0 |

- Entrambe le funzioni owner postgres, search_path vuoto; EXECUTE authenticated,
  negato ad anon/service_role; writer privato definer e wrapper pubblico invoker.
- Test SQL live in BEGIN/ROLLBACK: impersonazione del ruolo authenticated con
  auth.uid() di super_admin attivo esistente, senza creare/modificare utenti Auth.
  Save dei 3 campi members.list, email hidden, updated_by corretto: PASS.
  Baseline obsoleta rifiutata con 40001; screen sponsor e campo non ammesso con 22023.
  INSERT/UPDATE/DELETE diretti rifiutati con 42501, reset soft: PASS.
- Prove annullate interamente: zero override persistenti. Nessun INSERT/UPDATE/
  DELETE/TRUNCATE su tabelle business. Privilegio TRUNCATE verificato assente,
  senza eseguire TRUNCATE. Non usate chiavi service role.
- Authenticated senza corrispondenza admin, RPC anon e SELECT anon negati: PASS.
  Nessun account live admin ordinario disponibile; quel caso resta coperto dai
  test isolati. Queste prove SQL non sono chiamate HTTP Data API o browser.

Advisor post-migration: solo warning preesistente
[Leaked Password Protection Disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Performance invariata: 3 [FK email senza indice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
e 42 [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
informativi. Nessun intervento fuori scope.

- [x] Approvazione separata ricevuta: `MIGRATION 017 M10-A2.1 MEMBERS APPROVATA`.
- [x] Applicazione della sola 017 e verifica SQL live post-migration.
- [x] Smoke test autenticato sul deploy dichiarato positivo dall'utente, registrato sotto.
- [x] Review finale dopo fix B1: MERGE SI; report M10_A2_1_MEMBERS_REVIEW_REPORT.md.

SQL completo: [017_enable_member_field_visibility_rpc.sql](../database/migrations/017_enable_member_field_visibility_rpc.sql).
Gate completato dopo presentazione SQL e conteggi, con approvazione utente
esplicita separata. Non applicare nuovamente 015/016/017. Per nuovi target
servono verifica storico/checksum e autorizzazione dedicata; la semplice
citazione del gate in questa guida non e' approvazione.

## Smoke Autenticato Dichiarato e Rilettura Post-Reset

Fonte: dichiarazione dell'utente, ricevuta il 2026-09-22 (Europe/Rome).
Non presentata come nuova prova HTTP effettuata da Codex.

- [x] Accesso super_admin e /settings/field-visibility riusciti.
- [x] Quattro schermate members modificabili, salvataggio e visibilita' corretti.
- [x] Reset ai valori predefiniti riuscito; scritture dirette Data API negate.
- [x] Nessun altro modulo integrato; nessuna modifica business involontaria osservata.

Rilettura Codex esclusivamente SELECT alle 22:28 UTC del 21 settembre (22 in Italia),
conteggi riconfermati alle 22:39 UTC:

| Schermata | Override attivi | Righe archiviate |
| --- | ---: | ---: |
| members.list | 0 | 0 |
| members.create | 0 | 10 |
| members.edit | 0 | 0 |
| members.detail | 0 | 0 |
| Altri moduli | 0 | 0 |

Dieci righe totali archiviate sono compatibili con il reset soft. Non sono un
blocker e non vanno cancellate: il resolver ignora archived_at valorizzato.
members resta a 105; tutti i conteggi business sopra invariati. La tabella non
e' piu' vuota dopo lo smoke utente, ma non contiene alcun override attivo.
Nessuna scrittura Supabase, pulizia o riesecuzione migration durante questa review.

La preview di b6c753e risulta completata nei controlli GitHub/Vercel. Il browser
Codex incontra Vercel Deployment Protection prima dell'app: non e' stato eseguito
un nuovo smoke autenticato HTTP live da Codex. Valgono lo smoke dichiarato e le
prove browser demo locali; test su Safari fisico e stress PostgREST non eseguiti.

## Limiti Residui

- Test concorrenza coprono baseline obsoleta e rollback dopo errore a meta' batch.
  Stress con due connessioni PostgREST reali non eseguito; PGlite
  non sostituisce quel test. Lock transazionale e confronto avvengono nel DB.
- Nessun login admin ordinario live creato; test ruoli in SQL e render isolati.
- Preferenze UI, non autorizzazioni per colonna. Export/report/email e API business
  autorizzate continuano ad accedere ai valori secondo i permessi esistenti.
- Lettura preferenze e modifica socio sono richieste separate: non si promette
  atomicita' fra un cambio preferenza concorrente e l'update business. La patch
  usa le preferenze rilette al submit e non azzera campi assenti; il record usa CAS.
- Migration live verificata; review positiva e smoke utente registrato. Il deploy
  Production conseguente al merge va distinto da queste evidenze pre-merge.
