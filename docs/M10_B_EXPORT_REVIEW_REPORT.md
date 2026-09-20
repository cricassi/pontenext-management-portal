# M10-B Complete Excel Export - Review tecnica finale

Data: 2026-09-19. PR: [#48](https://github.com/cricassi/pontenext-management-portal/pull/48).
Progetto verificato: PonteNext `uhxfpsamenjhyrfgwckw`.

## 1. Esito e versione esaminata

**Decisione finale: merge SI**, per l'export manuale read-only nel perimetro M10-B.
Nessun problema bloccante rilevato. Due rilievi importanti non bloccanti sui
limiti runtime e due rilievi minori sono descritti sotto: non viene certificato
un limite rigido di 25 secondi end-to-end o di 10 MiB di memoria del processo.

- Base del diff: `ec99307655841a921cd9668c5f43f5257ce32fc1`, main dopo PR #47.
- Commit applicativo: `888a1b1e31ebe8dacd08694e16c9d06820ae29cd`.
- HEAD esaminato: `f7256ea3ff0e4d94907073cccbef66bac3cf0abb`, comprende la
  registrazione documentale dello smoke test autenticato.
- Branch: `codex/m10-b-complete-excel-export`.
- PR aperta, non draft; controllo GitHub/Vercel SUCCESS al momento della lettura.

Questa review aggiunge soltanto il presente documento alla PR. Nessuna modifica
di codice, migration, Supabase, dati live o configurazione Vercel. Nessun export
reale, workbook acquisito/allegato, invio email o avvio M10-A/M10-C.
La raccomandazione non esegue il merge e non certifica un deploy post-merge.

## 2. Problemi bloccanti

**Nessuno rilevato nel perimetro della review.**

Pagina, endpoint e service applicano i controlli server-side; il manifest
esclude il materiale di sicurezza; il download viene restituito soltanto dopo
letture, confronto e costruzione integrale del file. Non sono emersi percorsi
di scrittura business o di export parziale accettato come completo.

## 3. Problemi importanti non bloccanti

### I1. Timeout cooperativo, non deadline rigida di tutta la richiesta

Riferimenti: `src/services/data-export.service.ts:25`, `:38`, `:41`;
`src/utils/xlsx.ts:272`; `docs/M10_B_EXPORT_CHECKLIST.md:65`.

Il service passa `AbortSignal.timeout(25000)` alle letture e controlla il segnale
prima/dopo il lavoro. Il writer XML/ZIP e' pero' sincrono: se il timer scade
durante la generazione, il relativo evento puo' essere elaborato solo dopo
il ritorno del writer. Il controllo finale del solo segnale puo' quindi non
rilevare subito il superamento. Inoltre le guard Auth iniziali precedono il
timer e la guard finale non riceve il segnale di cancellazione.

Riproduzione isolata in questa review, senza rete, filesystem o dati reali:
service reale caricato con dipendenze simulate, budget ridotto a 20 ms solo
nel mock e pausa CPU sintetica di 60 ms prima del writer reale su fogli vuoti.
Risultato: ritorno del workbook in 66 ms, `aborted=false` al ritorno e
`aborted=true` dopo aver ceduto il controllo all'event loop. Non e' un benchmark
del deploy e non dimostra che l'export reale richieda piu' di 25 secondi;
dimostra il limite del meccanismo di scadenza.

Impatto: possibile sforamento del budget applicativo e lavoro superfluo dopo
la scadenza, non bypass dei permessi o restituzione di un file troncato.
L'endpoint dichiara separatamente `maxDuration = 60`; questo non trasforma il
timer applicativo in una deadline di 25 secondi.

Raccomandazione: in un fix runtime dedicato usare anche una deadline monotona
controllata prima e dopo le fasi, includere esplicitamente il tempo Auth nel
budget desiderato e aggiungere test con writer lento/guard lenta. Per
interrompere lavoro CPU, non solo rifiutarne il risultato, servono controlli
cooperativi nel writer. Correggere contestualmente le descrizioni del timeout.
I timer Node dipendono dal lavoro dell'event loop, come documentato nelle
[API ufficiali dei timer](https://nodejs.org/api/timers.html#scheduling-timers).

Classificazione non bloccante per il perimetro attuale: funzione manuale
riservata ai super_admin, output limitato a 3 MiB, nessuna perdita di dati o
scrittura. Non usare la checklist come garanzia di SLA temporale rigido.

### I2. Il budget dati non e' un tetto alla memoria allocata

Riferimenti: `src/utils/data-export.ts:67`, `:79`, `:95`;
`src/utils/xlsx.ts:292`.

I 10 MiB misurano le celle serializzate in JSON di ciascuna lettura. Una pagina
REST e' gia' stata ricevuta e deserializzata quando il budget viene verificato.
La seconda lettura raccoglie nuovamente i fogli mentre i primi sono conservati;
si aggiungono stringhe XML e copie Buffer per ZIP/risposta. Il picco heap/RSS
puo' quindi superare significativamente i 10 MiB, specialmente con testi ampi
o richieste concorrenti. Non e' presente un limite byte sul body REST prima
della deserializzazione. Il blocco del doppio click vale nella singola UI,
non costituisce un limite di concorrenza server.

I limiti applicativi righe/dati/file esistono e rifiutano il download quando
superati; non sono una protezione assoluta da esaurimento memoria. Nessun
test di esaurimento risorse e' stato eseguito sul live.

Raccomandazione: mantenere i limiti attuali, misurare picchi memoria con fixture
grandi su ambiente separato prima di aumentarli, valutare digest senza trattenere
il secondo dataset e una lettura con budget byte a monte del parsing. Non
promettere un RSS massimo di 10 MiB. Rischio non bloccante per l'uso manuale
attuale gia' collaudato, da trattare prima di estendere volumi/concorrenza.

## 4. Problemi minori

### M1. Riepiloghi documentali ancora riferiti al solo piano

`docs/MASTER_DEVELOPMENT_PLAN.md:227` definisce M10 non implementata, mentre
la stessa sezione a riga 260 descrive B implementata.
`docs/BUSINESS_RULES.md:177` conserva la frase generale "Funzioni non ancora
implementate". Il piano dettagliato e la checklist distinguono correttamente
B implementata su branch da A1/A2/C future.

Raccomandazione: nel successivo allineamento documentale indicare esplicitamente
lo stato di ogni sottofase, senza dichiarare implementata tutta M10. Nessun
effetto su autorizzazioni, dati o workbook.

### M2. Alcune prove non sono ancora test di regressione versionati

`tests/data-export.test.ts:108` verifica cancellazione gia' richiesta e limiti;
non riproduce la scadenza durante il writer. I test della guard e dell'endpoint
simulano Auth/database e non sostituiscono prove negative con account live.
Revoca del ruolo e cambio identita' alla guard finale sono stati verificati
con prove sintetiche aggiuntive in questa review, ma non aggiunti alla suite.

Raccomandazione: versionare questi casi nel prossimo intervento runtime e
automatizzare pending/errore/doppio click lato browser con risposte simulate.
Nessuna modifica di account reali e' necessaria per questi test.

## 5. Scope e autorizzazioni

| Controllo | Esito / evidenza |
| --- | --- |
| Solo M10-B | PASS: diff applicativo limitato a export, accesso da Impostazioni, utility XLSX condivisa e test |
| Nessuna field visibility/import | PASS: nessun resolver/tabella visibility, upload, parsing import o permission group; le citazioni nei documenti descrivono fasi future |
| Nessuna migration/configurazione | PASS: nessun diff in database, Supabase, dipendenze, variabili ambiente o configurazione Vercel |
| Nessuna scrittura Supabase | PASS statico: `.select`, `.order`, `.range`, `.abortSignal`; nessun DML/RPC/Storage o service business con effetti collaterali |
| Pagina super_admin | PASS: `requireActiveAdmin` e controllo ruolo prima del rendering; admin ordinario reindirizzato a `/settings` |
| Endpoint/service super_admin | PASS: guard prima delle query business, controllo ruolo ricavato da admin_users, nuova guard dopo le letture |
| Active/non-archived | PASS: guard richiede utente Auth verificato con `getUser`, admin status active e archived_at null |
| Negativi Auth | PASS test isolati: anonimo, Auth senza admin, inactive, archived e admin ordinario negati; nessun dato/account live alterato |
| Ricontrollo finale | PASS prove sintetiche: ruolo revocato o identita' cambiata impediscono la restituzione del workbook |
| Client di sessione | PASS: client SSR con cookie utente e anon key; nessuna service role nel percorso export |
| Progetto | PASS: URL PonteNext allowlisted; altro progetto rifiutato prima della creazione del client business |
| RLS | PASS metadati live: tutte le tabelle esportate richiedono admin attivo per SELECT, nessuna disattivazione/elevazione |

Letture Auth/admin delle guard sono necessarie e precedono i dati business.
Il privilegio super_admin riguarda l'operazione di export completo; non revoca
i diritti CRUD/RLS preesistenti degli admin ordinari. Nessuna pretesa che
questi ultimi non possano leggere i dati gia' autorizzati nel gestionale.

## 6. Workbook, esclusioni e sicurezza XLSX

Ordine verificato dei 15 fogli:

1. README
2. METADATA
3. members
4. roles
5. member_roles
6. membership_plans
7. memberships
8. payments
9. sponsors
10. sponsor_contributions
11. events
12. event_sponsors
13. email_templates
14. email_campaigns
15. email_campaign_recipients

- Manifest esplicito: `src/config/data-export.ts`, 13 tabelle e 158 colonne
  complessive. Confronto automatico con information_schema live: zero colonne
  mancanti e zero incompatibilita' di tipo. Unica colonna business omessa:
  `email_campaign_recipients.opt_out_token_hash`, deliberatamente esclusa.
- Nessun SELECT `*`, parametro client per scegliere tabelle o dipendenza da
  filtri/visibilita' UI. Archiviati, inattivi e relativi figli non filtrati;
  archived_at incluso dove esiste. I destinatari email non hanno archived_at.
- UUID e FK come testo integrale, inclusi riferimenti esterni created_by/sent_by
  verso admin_users, dichiarati nel workbook. CAP/telefoni/codici restano testo.
- Date ISO; timestamp ISO preservano microsecondi, con `+00:00` reso `Z`.
  Gli offset ISO eventualmente presenti non sono eliminati. Nessun seriale
  Excel o conversione tramite data locale.
- Importi numeric(10,2) come celle numeriche con formato a due decimali;
  interi finiti/sicuri e booleani nativi. Tipo inatteso o valore non valido
  blocca l'export, senza conversione silenziosa.
- Null = cella assente; vuoto = `\E`; backslash iniziale letterale raddoppiato.
  Ordine fogli/colonne deterministico, righe ordinate per id in entrambe le
  letture. Contenuto ZIP non necessariamente identico byte per byte fra export,
  poiche' date di esportazione e timestamp ZIP cambiano.
- README include finalita', formato, data, elenco fogli, esclusione Auth,
  differenza da backup, incompatibilita' con import soci e conservazione sicura.
  METADATA include versione applicativa, project ref, orari, strategia di
  consistenza e conteggi di tutti i fogli, senza contare le intestazioni.
- schema_migration_version e' esplicitamente una baseline del manifest:
  `20260607195558_010_email`, non una lettura privilegiata del journal a runtime.
- Esclusi auth.users, admin_users come foglio, password, sessioni, token,
  chiavi, connection string e configurazioni Supabase/Vercel/Resend. Nessun
  recupero di environment secrets per popolare il workbook.
- Tutte le stringhe sono `inlineStr`, mai formule; prefissi `=`, `+`, `-`, `@`
  anche dopo whitespace hanno `quotePrefix`. Numeri negativi veri restano numeri.
  Nessun elemento formula, macro, relazione esterna o hyperlink attivo generato.
- Testo/HTML escapato; caratteri XML illegali e surrogati isolati rifiutati,
  escape OOXML per CR e sequenze letterali `_xHHHH_`. Oltre 32.767 unita' UTF-16
  per cella: errore, mai slicing o troncamento. Controllo conservativo per Unicode.
- Nessun file XLSX/CSV tracciato nel repository; nessuna nuova dipendenza.
  Scansione mirata src/tests senza valori segreti stampati: nessun literal
  riconducibile ai pattern controllati di chiavi private, JWT o connection string.
  Nessun riferimento a RESEND_API_KEY/service role nei bundle `.next/static`.

La verifica delle esclusioni riguarda manifest, dipendenze e struttura, non
un'ispezione completa dei valori live. Campi liberi come notes/body/error_message
restano dati applicativi: non sono un luogo per conservare credenziali e il
writer non e' uno scanner DLP. Non si certifica l'assenza di segreti incollati
manualmente da qualcuno in qualunque testo del database.

## 7. Runtime, consistenza, HTTP e UI

| Controllo | Esito / limite |
| --- | --- |
| Generazione | Buffer/XML/ZIP in memoria; nessun filesystem o Supabase Storage; nessun log del workbook o delle righe |
| Righe e dati | 10.000 righe totali e 10 MiB normalizzati per passata; superamento -> errore, non primi N record |
| File e celle | XLSX massimo 3 MiB verificato anche dopo ZIP; cella e XML non rappresentabili bloccano tutto |
| Memoria/timeout | Con riserve I1/I2: budget dati e cancellazione cooperativa, non tetti assoluti RSS/deadline end-to-end |
| Completezza | Count esatto richiesto, pagine fino all'ultimo record anche con cap REST inferiore a 250; id duplicati/fuori ordine e righe mancanti rifiutati |
| N+1 | Assente: query per pagina/tabella, nessuna query per relazione/riga; minimo 26 query business per due letture di 13 tabelle |
| Digest | SHA-256 di celle normalizzate, ordine, nomi tabelle e conteggi; differenza fra letture -> errore changed/HTTP 409 |
| Consistenza | Nessuna transazione globale o lock: due letture uguali non escludono tutte le anomalie concorrenti; limite esplicito in UI/documentazione/workbook |
| Backup | Excel e' portabilita'/consultazione, non dump PostgreSQL e non restore Auth/schema/RLS; esportare senza scritture concorrenti |
| Metodo HTTP | Solo POST produce il file; GET autenticato autorizzato -> 405 e Allow POST, admin ordinario -> 403; anonimo -> login |
| CSRF | Origin deve coincidere; Sec-Fetch-Site, se presente, deve essere same-origin; origine mancante/esterna rifiutata |
| Risposta | MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; Content-Disposition attachment e filename UTC costruito dal server |
| Cache/errori | Risposte applicative successo/errore private, no-store e nosniff; errori da catalogo generico, non SQL/stack trace; redirect Next preservati |
| Nessun export parziale | Nessun byte del workbook inviato prima del completamento; letture/limiti/digest/errori bloccano l'attachment |
| UI | Avviso non-backup, inclusioni/esclusioni, limiti, pulsante export; nessun input file/import/modello da importare |
| Feedback/accessibilita' | Pending disabilita azione, ref inFlight previene doppio click nella stessa istanza, aria-busy/status, errore con role alert |
| Responsive | Classi min-w-0, wrapping, colonna singola mobile/doppia desktop e pulsante mobile a larghezza piena; shell esistente invariata |

La review non ha avviato browser/dev-server o un export live. I precedenti
controlli HTTP anonimi e la fixture SSR a 375x667/1440x900, documentati nella
checklist, sono evidenze della fase implementativa, non nuove prove browser
di questa review. Pending/errori sono stati controllati staticamente, non
certificati mediante un nuovo test visuale con sessione reale.

## 8. Supabase in sola lettura

Rilevazione corrente tramite MCP: progetto corretto, ACTIVE_HEALTHY, regione
eu-central-1, PostgreSQL 17.6.1.127. Consultati soltanto stato progetto,
journal migration, cataloghi colonne/policy e definizione del helper RLS.
Nessuna SELECT di righe business, Auth o anagrafiche admin effettuata.

- Migration applicate: 001_extensions, 002_admin_users,
  003_harden_admin_functions, 004_members_roles, 005_membership_plans,
  006_memberships_payments, 007_sponsors, 008_events,
  009_sponsor_contributions, 010_email. Nessuna M10.
- Ultima migration: `20260607195558 / 010_email`.
- 14 tabelle public: admin_users e le 13 business del manifest.
- RLS attiva su tutte e 14; zero policy DELETE o ALL rilevate.
- SELECT business per authenticated con `app_private.is_active_admin()`;
  nessun filtro archived_at nelle policy che impedisca l'export degli archiviati.
- Helper SECURITY DEFINER con search_path vuoto e riferimenti qualificati;
  verifica auth.uid(), status active e archived_at null.
- I vincoli RLS sono verificati nei cataloghi, non mediante impersonazione o
  modifica di utenti live. L'assenza di policy DELETE non certifica l'assenza
  di ogni privilegio distruttivo legacy, come gia' segnalato nel piano M10.

## 9. Verifiche rieseguite

| Verifica | Esito corrente |
| --- | --- |
| `npm run lint` | PASS, exit 0, zero warning |
| `npx --no-install tsc --noEmit` | PASS, exit 0; compiler locale, equivalente al typecheck richiesto senza installazioni |
| `npm run build` | PASS, Next.js 16.2.7; entrambe le route export presenti come dinamiche |
| `node --require ./tests/register-typescript.cjs ./tests/data-export.test.ts` | PASS, 16/16, zero falliti/skipped, senza rete/database |
| Prove sintetiche aggiuntive | PASS: revoca ruolo dopo letture, cambio identita' dopo letture, errore database senza ritorno workbook |
| Prova deadline isolata | Riprodotto I1; non classificata come PASS della garanzia temporale rigida |
| Schema/manifest | PASS: 13 tabelle, 158 colonne, tipi coerenti; unica esclusione opt_out_token_hash |
| Supabase | PASS metadati read-only come sezione 8 |
| Diff PR | Nessuna modifica a migration, configurazioni Supabase/Vercel o dipendenze |
| `git diff --check origin/main...HEAD` | PASS sul diff esaminato |

La build e' stata eseguita con autorizzazione fuori sandbox per il limite
spawn EPERM gia' documentato del worker Next.js. Nessun Start-Process,
pubblicazione manuale o cambiamento della configurazione di deploy.
L'esecuzione standard Next ha caricato l'ambiente locale senza leggerne o
stamparne i valori nei controlli della review.

Le prove aggiuntive usano fixture/mocks caricati in memoria tramite il runner
TypeScript esistente; non sono nuovi file di test committati. Non e' stato
rieseguito il lettore indipendente openpyxl della fase implementativa: resta
un'evidenza pregressa, affiancata dallo smoke test Excel desktop dell'utente.

## 10. Smoke test autenticato

**PASS comunicato dall'utente**, Vercel Preview della PR #48, gia' registrato
in [M10_B_EXPORT_CHECKLIST.md](M10_B_EXPORT_CHECKLIST.md). Confermati:

- Login super_admin e accesso a `/settings/data-import-export`.
- Download XLSX e apertura in Excel desktop senza errori.
- 15 fogli, README e METADATA presenti.
- Conteggi coerenti e record campione verificati.
- Nessun foglio Auth/admin_users e nessun segreto rilevato dall'utente.
- Nessuna modifica al database durante l'export.
- Workbook non committato, non allegato alla PR e non caricato su servizi esterni.

L'URL/hash del deploy dello smoke test non e' stato comunicato separatamente;
il commit applicativo associato alla PR e' 888a1b1. Non si attribuisce a Codex
il test manuale dell'utente. Nessun workbook richiesto o acquisito per la review.
La conferma copre il percorso positivo, non prove negative live, timeout,
concorrenza, grandi volumi o tutti gli stati visuali.

## 11. Raccomandazione finale

**Merge SI.** Autorizzazioni, perimetro read-only, struttura/completezza entro
i limiti, sicurezza XLSX e smoke test positivo supportano il merge M10-B.
I1/I2 restano rilievi runtime non bloccanti, non requisiti dichiarati integralmente
superati: evitare volumi/concorrenza maggiori senza benchmark e hardening dedicati.

Procedere successivamente con verifica post-merge, senza esportazioni live
automatiche. Non avviare M10-A1/A2 o M10-C come effetto di questa review.
Il workbook resta uno strumento di portabilita' riservato, non backup completo,
snapshot transazionale o file importabile nella futura funzione nuovi soci.
