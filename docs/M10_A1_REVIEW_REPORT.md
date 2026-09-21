# M10-A1 - Review tecnica finale PR #50

Data: 2026-09-21. Repository: `cricassi/pontenext-management-portal`.
PR: https://github.com/cricassi/pontenext-management-portal/pull/50
Base verificata: `63283c9ebf2d9d310513a84c27c1cef2b5d459e4` (PR #49 mergiata).
Commit applicativo esaminato: `cb1886de541e387c261206d24a930faad68b3495`.
Progetto live: **PonteNext**, `uhxfpsamenjhyrfgwckw`, ACTIVE_HEALTHY,
PostgreSQL 17.6.1.127. PR aperta e non mergiata durante la review.

## 1. Esito complessivo e decisione

**Decisione finale: MERGE NO rispetto ai criteri di questa review.**

Build, controlli statici, test automatici, struttura SQL, autorizzazioni per
ruolo, catalogo e responsive hanno esito positivo. Non sono emerse regressioni
nel diff business. Rimane pero' un **blocker di accettazione sul punto 9**:
il gate `integrated = false` impedisce le scritture dalle action Next.js, ma
non impedisce a un super_admin attivo di inserire/aggiornare override tramite
accesso diretto alla Data API. Non e' quindi verificabile come vera la regola
assoluta "nessun override puo' essere salvato per schermate non integrate".

Non si tratta di accesso anonimo, escalation di un admin ordinario o perdita di
dati business: serve gia' il ruolo super_admin e A1 non applica gli override
alle schermate operative. E' una discrepanza tra il gate richiesto nella review
e il confine applicativo precedentemente documentato, non un errore di build.

Questo report aggiorna l'esito preliminare "nessun blocker A1" della checklist
di implementazione. Nessun merge eseguito. A2 e C non iniziate.

## 2. Problemi bloccanti

### B1 - Gate delle schermate non integrate aggirabile fuori dalle action

Riferimenti verificati:

- `database/migrations/015_ui_field_visibility.sql:171`: grant INSERT/UPDATE
  ad authenticated; le policy da riga 177 autorizzano il super_admin attivo.
- `src/services/field-visibility.service.ts:47` e `:65`: il controllo
  `assertVisibilityIntegrated` e' nelle funzioni applicative save/reset.
- `src/config/field-visibility-registry.ts:25`: tutte le schermate sono false.
- `tests/field-visibility-db.test.ts:78`: una scrittura diretta con ruolo
  authenticated e identita' sintetica super_admin riesce sulla coppia
  `members.edit/email`, che nel registro e' non integrata.

Le policy live verificano ruolo, stato, archiviazione e autore corretto, ma non
lo stato di integrazione della schermata. Il CHECK SQL accetta le 116 coppie
facoltative anche prima del rollout. Una richiesta diretta con sessione valida,
coppia ammessa e proprio `admin_users.id` non passa dalle action Next.js.

Evidenza riprodotta **solo nel PostgreSQL isolato PGlite**, con identita' e dati
sintetici. Il test SQL esistente conferma INSERT e UPDATE riusciti, poi verifica
l'intero catalogo ammesso. Sul live sono state lette soltanto policy/grant e
conteggi: nessuna richiesta di scrittura, nemmeno da annullare con rollback.

Il piano, sezione 7, limita esplicitamente il gate alle operazioni server della
pagina; `M10_A1_CHECKLIST.md:103` dichiara gia' il percorso Data API autorizzato.
Queste precisazioni spiegano l'implementazione, ma non soddisfano il requisito
piu' ampio espresso nel punto 9 della richiesta di review.

Per rimuovere il blocker occorre una decisione esplicita:

1. Mantenere il divieto assoluto: progettare una nuova migration correttiva
   `016`, da approvare separatamente, che blocchi anche le scritture dirette
   durante A1 (ad esempio grant di scrittura revocati o policy restrittive
   dedicate), definendo come riaprirle solo per i moduli autorizzati in A2.
2. In alternativa, accettare esplicitamente il confine gia' documentato:
   nessuna scrittura dalle action per schermate non integrate, ma configurazione
   diretta consentita al super_admin dalla RLS, senza effetto sui moduli A1.
   Questa alternativa cambia il criterio di accettazione e non e' assunta qui.

**Non modificare retroattivamente la 015.** Nessuna 016 creata o applicata,
nessun fix SQL o bypass con service role introdotto durante questa review.
Un fix soltanto nel codice Next.js non chiuderebbe il percorso diretto.

## 3. Problemi importanti non bloccanti

- **Collaudo A2 ancora necessario:** cache reale Next.js dopo scrittura,
  invalidazione delle viste e due richieste PostgREST concorrenti non sono
  collaudate end-to-end qui. I test coprono adapter della cache, rilettura fresca,
  atomicita' SQL, collisioni e ID obsoleti dopo reset in isolamento. Non equivalgono
  a due transazioni concorrenti su Supabase. Nessun comando operativo e' abilitato
  nella pagina A1; completare questi test in staging prima del rollout.
- **Security Advisor preesistente:** protezione password compromesse disabilitata.
  Nessun rilievo Advisor sulla nuova tabella/helper/RLS. Non modificata Auth.
  [Riferimento Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- **Browser con admin ordinario non eseguito:** il live contiene due super_admin
  attivi e nessun admin ordinario. Non sono stati creati account o modificati
  ruoli per colmare il test. Lettura admin e rifiuto scrittura verificati tramite
  test di service/pagina e RLS nel DB isolato; non dichiarati come login browser reale.

## 4. Problemi minori e limiti

- Responsive verificato nel browser Chromium integrato, non su Safari/iPhone
  fisico. Non rilevati overflow ai viewport verificati.
- Il primo `npm.cmd run build` nel sandbox ha compilato il codice, poi fallito
  avviando il worker TypeScript con `Error: spawn EPERM`, errno -4048. Ripetuto
  con autorizzazione di esecuzione: exit 0. Limite ambientale, non fix applicativo.
- Le raccomandazioni M10-B restano invariate: timeout non interrompibile
  rigidamente durante generazione sincrona e limite 10 MiB sui dati normalizzati,
  non sull'intera memoria. Nessun nuovo export reale acquisito o necessario qui.

## 5. Scope e regressioni

Diff base/head: 21 file, foundation, migration additiva, test e documentazione.
L'unico file applicativo preesistente modificato e' l'indice `/settings`, con
un link al catalogo. Invariati form, liste, dettagli, mapper FormData, validatori,
azioni e service business di members, memberships, payments, sponsors, events,
email e reports. Nessuna modifica all'export M10-B o alle sue dipendenze.

- Registro tipizzato versione 1: **42 schermate, 116 coppie configurabili**.
- Tutte le schermate `integrated: false`; nessun consumer nei moduli business.
- Nessun import Excel, permission group, scope operativo o stato readonly.
- Nessun ID tecnico/audit fra i campi configurabili. FK opzionali configurabili
  soltanto quando rappresentano selettori o label gia' mostrati all'utente.
- Obbligatori e campi condizionali esclusi: ad esempio descrizione contributi
  non monetari, motivazione quota zero, estremi periodo, conferme invio.
- Nessuna nuova dipendenza, variabile ambiente, configurazione Vercel o provider.

La compilazione conserva tutte le route e include la nuova route dinamica
`/settings/field-visibility` e gli endpoint M10-B. La conferma di assenza di
regressioni business si basa su diff immutato, build e test, non su una nuova
esecuzione di tutti i CRUD reali: nessun dato live e' stato modificato.

## 6. Coerenza migration locale e database live

Storico live: 001-010 e **una sola** registrazione `015_ui_field_visibility`,
versione **20260921195425**. I file 011-014 sono ancora commenti placeholder,
immutati nella PR e assenti dallo storico live.

Confronto del testo SQL della 015 con lo statement registrato nello storico:
7.421 caratteri dopo normalizzazione LF e trim; MD5 identico
`06744a30b53e6a153f44d58a02fdde1d`. Il file contiene soltanto un newline finale
aggiuntivo. MD5 usato come riscontro di uguaglianza, non come firma di sicurezza.
Il CHECK nel catalogo live conserva l'MD5 della definizione
`4bd414d8dd14cbaab05c884ee608b2c4`. Test di parita' registro/file e test SQL di
ammissione di tutte le 116 coppie passati; nessuna coppia extra o mancante.

Schema live coerente:

- `id uuid` PK, generazione UUID; screen_key/field_key text NOT NULL;
  is_visible boolean NOT NULL DEFAULT true.
- `updated_by uuid NOT NULL` FK verso `public.admin_users.id`, indice dedicato.
- created_at/updated_at timestamptz NOT NULL DEFAULT now(); archived_at nullable.
- Unicita' parziale screen_key/field_key WHERE archived_at IS NULL.
- Trigger updated_at riusa `public.set_updated_at()`, senza modificarlo.
- RLS attiva su tutte le **15 tabelle public**, comprese le 14 preesistenti.
- Tre policy sulla nuova tabella: SELECT admin attivi; INSERT/UPDATE super_admin
  attivi con autore corretto; UPDATE esclude righe sorgenti archiviate.
- Nessuna policy DELETE; authenticated ha solo SELECT/INSERT/UPDATE, nessun
  DELETE/TRUNCATE/REFERENCES/TRIGGER. Nessun grant anon/PUBLIC sulla tabella.
- Restano i privilegi amministrativi di postgres/service_role del progetto;
  l'applicazione A1 non usa service role, ma il client SSR di sessione/RLS.
- `app_private.is_super_admin()`: zero parametri, owner postgres, STABLE,
  SECURITY DEFINER, search_path vuoto, nomi qualificati. Confronta auth.uid()
  con auth_user_id, role super_admin, status active e archived_at null.
  EXECUTE concesso ad authenticated, non anon/PUBLIC; anon senza USAGE sullo schema.

Il service usa `admin.id`, non Auth UUID, per updated_by. Le policy confrontano
lo stesso ID risolto da auth_user_id. Test isolati respingono autore falsificato,
Auth UUID come autore, admin ordinario, inactive, archived e Auth senza admin.
Il reset archivia l'override, non cancella righe; il vecchio ID non puo' essere
riattivato. Queste operazioni sono state provate solo con dati sintetici.

### Conteggi prima/dopo la review

| Tabella | Baseline A1 | Inizio review | Fine controlli browser |
| --- | ---: | ---: | ---: |
| admin_users | 2 | 2 | 2 |
| members | 105 | 105 | 105 |
| roles | 7 | 7 | 7 |
| member_roles | 3 | 3 | 3 |
| membership_plans | 3 | 3 | 3 |
| memberships | 6 | 6 | 6 |
| payments | 2 | 2 | 2 |
| sponsors | 2 | 2 | 2 |
| sponsor_contributions | 2 | 2 | 2 |
| events | 2 | 2 | 2 |
| event_sponsors | 0 | 0 | 0 |
| email_templates | 1 | 1 | 1 |
| email_campaigns | 0 | 0 | 0 |
| email_campaign_recipients | 0 | 0 | 0 |
| ui_field_visibility | 0 | 0 | 0 |

**Confermata tabella live vuota e conteggi business invariati.** La 015 non
contiene ALTER/DML sulle 14 tabelle precedenti; il diff non cambia i loro file
di migration. Durante la review solo letture aggregate e di catalogo tramite
MCP, nessuna mutation business/configurazione. I conteggi, da soli, non provano
l'uguaglianza storica di ogni valore: non sono stati esportati record o acquisiti
backup per sostenerlo. I normali login/logout di collaudo comportano gestione
della sessione Auth, non cambi di account, ruoli o dati applicativi.

## 7. Resolver, action e UI

Il service e' protetto da `import "server-only"`; `requireActiveAdmin` precede
il caricamento configurazione. La pagina esegue una propria guard; le action
verificano nuovamente admin/ruolo sul server, validano input e respingono
schermate non integrate prima di qualsiasi query di configurazione.
Richieste manomesse **alle action** non superano il gate; il limite Data API
e' distinto ed e' descritto in B1.

Caricamento batch con colonne esplicite, chiavi canoniche, conteggio esatto e
limite derivato dal registro; nessuna query per campo. React cache limitata alla
request/render, senza cache condivisa persistente o localStorage. Guard sempre
prima dell'accesso al loader. Rilettura non memoizzata prima del salvataggio.

Assenza/archiviazione -> default visible. Override invalidi/duplicati -> default
dei campi coinvolti con warning. Errori DB -> default con warning, comandi
disabilitati; nessun arbitrario ampliamento di autorizzazioni. Il fallback e'
previsto dal piano per preferenze UI, non e' una policy di riservatezza. A1 non
carica valori business da nascondere. Errori action sanitizzati, redirect Auth
preservati con unstable_rethrow, invalidazione limitata alla pagina Impostazioni.

Browser sulla build locale, comando:

```text
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011
```

Esiti rieseguiti:

- Logout e accesso anonimo alla nuova route -> `/login`.
- Login reale super_admin riuscito, pagina/catalogo caricati senza warning DB.
- Modulo/schermata, ricerca senza risultati e template senza campi facoltativi.
- Badge "Non ancora attiva" e indicazione M10-A2; nessuna promessa di operativita'.
- Switch e Salva/Ripristina disabilitati; nessun invio di preferenze eseguito.
- Tabella desktop e elenco mobile, controlli etichettati, input ricerca 16px.
- Viewport 1440x900: nessun elemento main oltre i bordi; mobile 375x667 e
  360x740: scrollWidth documento rispettivamente 375 e 360, zero overflow main.
- A 375x667, dopo scroll, pulsanti inferiori a y=423-467 e y=479-523, dentro
  il viewport. Nessun errore/warning nei log console del tab.

Screenshot ispezionati, non aggiunti alla PR. Viewport ripristinato e scheda
temporanea chiusa. Nessun test browser admin ordinario dichiarato come superato:
vedere sezione 3. Nessun export reale, invio email o modifica preferenze.

## 8. Verifiche tecniche

| Verifica | Esito |
| --- | --- |
| npm run lint (npm.cmd su Windows) | PASS, exit 0 |
| npx --no-install tsc --noEmit | PASS, exit 0 |
| npm run build | PASS, exit 0 con worker autorizzati |
| tests/field-visibility.test.ts | PASS, 12/12 |
| tests/field-visibility-db.test.ts | PASS, 7 scenari + wrapper, 8/8 runner |
| tests/data-export.test.ts | PASS, 16/16, solo fixture sintetiche |
| Supabase live | Sola lettura; schema/grant/policy/count verificati |
| Browser anonimo/super_admin | PASS |
| Browser admin ordinario | NON ESEGUITO, account non disponibile |
| Desktop/mobile Chromium | PASS; Safari fisico non collaudato |
| git diff --check | PASS |

Test Node eseguiti con `--require ./tests/register-typescript.cjs`.
Test SQL tramite PGlite 0.3.14 gia' installato fuori dal repository, in memoria,
con `PGLITE_TEST_MODULE` puntato alla directory temporanea descritta in
`M10_A1_CHECKLIST.md`. Nessuna nuova dipendenza o modifica ai test.

Il successo della suite SQL non elimina B1: la suite attuale verifica proprio
che il super_admin possa scrivere direttamente. Una futura correzione del gate
dovra' aggiungere test negativi coerenti per gli accessi diretti in A1.

## 9. Azione richiesta prima del merge

Risolvere B1 tramite approvazione di un intervento SQL separato oppure tramite
accettazione esplicita del confine applicativo gia' documentato. Fino a questa
decisione **non attestare "Merge si"** rispetto alla richiesta attuale.

La review aggiunge soltanto questo report alla PR #50. Nessun codice, migration,
configurazione Supabase/Vercel o dato live applicativo modificato. La 015 resta
immutata e non deve essere riapplicata al merge. M10-A2 e M10-C restano ferme.
