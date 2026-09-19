# M10 - Field Visibility and Excel Data Portability

Data: 2026-09-19. Stato: **piano revisionato, non implementato**.

Base verificata: `main` al commit `b6bc68e215743ba55eb82ad03b463879586d68b5`.
Progetto verificato in sola lettura: **PonteNext**, `uhxfpsamenjhyrfgwckw`.

La PR #46, chiusa senza merge, e' annullata. Questo documento non recupera
permission group, scope multipli, readonly, configurazioni personali o permessi
per campo. Anche la precedente ipotesi di import Excel multi-tabella e' annullata.
**L'import M10-C inserisce esclusivamente nuovi soci in `public.members`.**

## 1. Decisioni e sequenza delle PR

| Fase | Funzione | Scritture future consentite |
| --- | --- | --- |
| M10-A Field Visibility | Visibilita' globale dei soli campi facoltativi, suddivisa in A1 e A2 | Configurazione nella nuova `ui_field_visibility`; nessuna trasformazione dei dati business |
| M10-B Complete Excel Export | Workbook completo delle 13 tabelle business previste | Nessuna scrittura di dati |
| M10-C New Members Excel Import | Modello dedicato, dry-run, INSERT di nuovi soci | Solo INSERT in `public.members` |

Le denominazioni A/B/C identificano le funzionalita', **non il loro ordine di
esecuzione**. Dopo l'approvazione del piano, l'ordine operativo vincolante e'
il seguente, con **quattro PR operative separate**:

1. **M10-B Complete Excel Export**.
2. **M10-A1 Field Visibility Foundation**.
3. **M10-A2 Field Visibility Rollout**.
4. **M10-C New Members Excel Import**.

Motivazione: l'export e' read-only sui dati applicativi e permette di ottenere
uno snapshot Excel prima delle modifiche ai form. La visibilita' richiede
introduzione progressiva e test di conservazione; l'import e' l'unica fase che
inserisce nuove anagrafiche business e viene implementato per ultimo. Le
scritture delle preferenze tecniche A1/A2 non sono import di dati business.
Lo snapshot Excel non sostituisce il backup PostgreSQL/Supabase.

### 1.1 Confini M10-A1 e M10-A2

**M10-A1 Field Visibility Foundation** comprende esclusivamente la base:

- migration additiva `ui_field_visibility`, vincoli/indici e trigger previsti;
- RLS e helper super_admin sicuro;
- registro tipizzato dei campi e resolver centralizzato;
- pagina `/settings/field-visibility` e relativa gestione della configurazione;
- test del motore, delle autorizzazioni e della pagina Impostazioni.

**Nessuna schermata business viene modificata in A1**: nessun controllo hidden
nei form/liste/dettagli/filtri, nessuna lettura delle preferenze nei loro fetch,
nessuna modifica a mapper, update o validazioni dei moduli. Il catalogo puo'
essere completo, ma l'applicazione ai moduli resta non attiva fino ad A2.

**M10-A2 Field Visibility Rollout** comprende:

- integrazione progressiva delle policy UI visible/hidden nelle schermate;
- adattamento dei mapper e degli update per preservare i valori nascosti;
- test di non perdita dati per stringhe, date, checkbox, FK e campi condizionali;
- attivazione per modulo solo dopo esito positivo dei relativi test.

A2 riusa infrastruttura, tabella, RLS, registro, resolver e Impostazioni di A1;
non ricrea la foundation e non richiede una nuova migration salvo necessita'
separatamente documentata e approvata. Non introduce readonly o nuovi permessi.

### 1.2 Passaggi e verifiche fra le fasi

- **B -> A1**: export testato con dati sintetici, verifica post-merge e possibilita'
  di ottenere/conservare in modo protetto lo snapshot applicativo pre-rollout.
  Un eventuale export live richiede autorizzazione: questa revisione non lo esegue.
- **A1 -> A2**: verifica post-merge della foundation, RLS/resolver corretti e
  conferma che schermate business, mapper e dati non siano cambiati.
- **Durante A2**: un gruppo di schermate alla volta, test di preservazione prima
  di abilitarne le preferenze; verifica finale di regressione e post-merge.
- **A2 -> C**: visibilita' collaudata; solo allora implementazione dell'import,
  test su ambiente separato e, eventualmente, primo import live con gate specifico.

B non dipende da `ui_field_visibility`, registro/resolver o helper creati in
A1: verifica il super_admin con il contesto Auth/admin esistente. Anche l'eventuale
RPC read-only B deve essere autosufficiente nel controllo del ruolo, senza
anticipare la foundation o ampliare le autorizzazioni.

Questa PR non crea codice, migration, file Excel, dipendenze o configurazioni
Vercel; non legge segreti, non esporta/importa dati reali e non modifica Supabase.
Il piano non costituisce autorizzazione a eseguire operazioni live.

## 2. Evidenze del repository e del database

Letti documentazione aggiornata in `/docs`, documenti operativi, migration,
route, form, componenti, service, validazioni, guard e implementazione M8.
Le verifiche live hanno interrogato metadati, vincoli, indici, policy, funzioni e
trigger, non estratto anagrafiche o altri record business.

### 2.1 Stato live

Sono presenti 14 tabelle applicative: `admin_users` e le 13 tabelle elencate
nell'export della sezione 13. RLS attiva su tutte; policy SELECT per gli admin
attivi, INSERT/UPDATE sulle tabelle business e nessuna policy DELETE.
`ui_field_visibility` non esiste. Non esistono tabelle permission group M10.

| Migration applicata | Versione live |
| --- | --- |
| 001_extensions | 20260606113953 |
| 002_admin_users | 20260606114014 |
| 003_harden_admin_functions | 20260606115133 |
| 004_members_roles | 20260606124849 |
| 005_membership_plans | 20260606221810 |
| 006_memberships_payments | 20260606221954 |
| 007_sponsors | 20260607132737 |
| 008_events | 20260607164703 |
| 009_sponsor_contributions | 20260607164732 |
| 010_email | 20260607195558 |

I file locali `011_audit_logs.sql`, `012_views.sql`, `013_rls_policies.sql` e
`014_seed.sql` sono placeholder, non migration da applicare. Non rinumerare o
riscrivere `001`-`010`. La numerazione delle eventuali migration additive segue
l'ordine effettivo B -> A1 -> A2 -> C. Se B introduce la funzione snapshot,
questa puo' occupare il primo numero libero: non prenotare `015` per A1.
Il nome della migration `ui_field_visibility` va scelto all'avvio di A1 dopo
verifica delle migration effettive di B; nessun file viene creato adesso.

### 2.2 Codice rilevante

| Area | Evidenza e conseguenza |
| --- | --- |
| `src/services/admin-auth.service.ts` | Risolve Auth e `admin_users` e ne verifica stato/archiviazione. Il contesto contiene `admin.id`, distinto da `user.id` |
| `src/services/members.service.ts` | Validazioni manuali, mapping completo dei valori e INSERT singolo socio; email e codice fiscale non sono identificatori univoci |
| `src/app/(admin)/members/actions.ts` | Guard prima delle operazioni; assegnazioni ruolo distinte dalla creazione socio |
| `src/components/members/MemberForm.tsx` | Campi camelCase del form, da mappare esplicitamente alle colonne snake_case |
| `src/utils/form.ts` | Assenza di campi convertita in stringa vuota, null o false: non adatto senza adattamento a form con campi nascosti |
| Service dei moduli e form esistenti | Diverse operazioni di modifica ricostruiscono l'intero record, non una patch dei soli campi presenti |
| `src/services/report-export.service.ts`, `src/utils/xlsx.ts` | Export M8 orientato al report, un foglio `Report`, valori come testo; non e' il workbook completo M10 |
| `src/app/(admin)/reports/export/route.ts` | Export autenticato esistente da conservare; nessun riuso che allarghi l'accesso M10 ai normali admin |
| `package.json` | Next.js 16, TypeScript strict; nessun parser XLSX e nessuna dipendenza Zod attualmente presente |

Le validazioni correnti sono funzioni TypeScript, non schemi Zod. Il piano
riusa questo approccio senza imporre una nuova libreria di validazione.

## 3. Principi e terminologia M10-A

- **Schermata**: contesto reale di lista, dettaglio, creazione, modifica o filtro;
  un pannello inline puo' costituire una schermata senza avere una propria route.
- **screen_key**: identificatore stabile di quel contesto, non derivato dalla label.
- **field_key**: identificatore stabile del dato, preferibilmente nome colonna;
  mappatura esplicita verso i nomi camelCase dei form e dei filtri.
- **visible**: campo mostrato, con il comportamento attuale della schermata.
- **hidden**: controllo/dato non mostrato in quel contesto; il valore persistito
  resta disponibile ai processi autorizzati.
- **Registro**: elenco tipizzato nel codice di coppie supportate e default.
- **Configurazione globale**: preferenza DB condivisa da tutti gli amministratori.

Non esistono readonly, scope, gruppi o preferenze per utente/browser. Nessun
localStorage. La visibilita' **non e' un'autorizzazione**: non rende riservato un
campo, non cambia RLS, report, export, email, segmentazioni o permessi CRUD.
Un campo nascosto non viene cancellato, convertito in null/false o sovrascritto
quando si modifica un altro campo.

## 4. M10-A1: modello dati della foundation

Una sola nuova tabella, `public.ui_field_visibility`, senza alterare le tabelle
business o il modello Auth/admin esistente.

| Colonna | Tipo e regola |
| --- | --- |
| id | UUID PK, default di generazione nel DB; nel bulk A l'eventuale nuovo UUID e' assegnato dal server, mai scelto dal browser |
| screen_key | text NOT NULL, chiave conosciuta nel registro |
| field_key | text NOT NULL, campo configurabile di quella schermata |
| is_visible | boolean NOT NULL, default true |
| updated_by | UUID NOT NULL, FK a `public.admin_users.id` |
| created_at | timestamptz NOT NULL, default now() |
| updated_at | timestamptz NOT NULL, default now(), trigger esistente |
| archived_at | timestamptz nullable |

Scelta **A: righe per stati espliciti**, sia true sia false. Tabella inizialmente
vuota; assenza di riga attiva significa default visible. Questa scelta conserva
un modello diretto e leggibile: salvare Visibile non deve avere il significato
implicito di cancellare una riga. Non prepopolare ogni coppia del registro.

Indice univoco parziale su `(screen_key, field_key)` per righe con
`archived_at is null`. Reset: archiviare il solo override, mai cancellare dati
business o righe fisicamente. Un successivo salvataggio puo' creare una nuova
riga attiva. Conservare il timestamp originale di creazione.

`updated_by` viene risolto dal contesto verificato:
`admin_users.auth_user_id = auth.uid()` -> `admin_users.id`.
**Non scrivere `auth.uid()` direttamente in `updated_by`.** Il client non sceglie
questo valore; INSERT/UPDATE devono verificare anche che corrisponda all'attore.

Per respingere coppie arbitrarie anche con accesso diretto alla Data API, prevedere
un CHECK statico sulle coppie configurabili, generato nella futura migration
dallo stesso registro e verificato da test di parita'. Non introdurre un'altra
tabella catalogo. Le coppie obbligatorie/non configurabili non sono ammesse.
Una nuova coppia futura richiedera' aggiornamento coordinato di registro e CHECK;
rinominare una label non cambia le chiavi.

## 5. M10-A1: migration, RLS e salvataggio

La futura migration contiene soltanto nuova tabella, vincoli/indici, trigger
`updated_at`, abilitazione RLS, policy, helper super_admin sicuro e grant minimi.
Nessun seed business, ALTER di tabelle business, DML sui record esistenti,
UPDATE/DELETE/DROP/TRUNCATE operativo. L'abilitazione RLS sulla **nuova** tabella
e le clausole `FOR UPDATE` delle policy non sono modifiche dei dati business.

| Operazione su ui_field_visibility | Autorizzazione |
| --- | --- |
| SELECT | Admin attivo, non archiviato |
| INSERT | Super_admin attivo, non archiviato; autore corretto |
| UPDATE, incluso reset logico | Super_admin attivo, non archiviato; autore corretto |
| DELETE | Nessuna policy e nessun grant applicativo |
| anon | Nessuna policy/grant |

Riutilizzare `app_private.is_active_admin()`. L'helper
`app_private.is_super_admin()` controlla `auth_user_id`, role super_admin,
status active e archived_at null, con `search_path = ''`, oggetti qualificati,
EXECUTE minimo e SECURITY DEFINER solo se necessario. L'helper appartiene alla
foundation A1; B deve funzionare senza attenderlo. Non sostituire la guard
applicativa e non cambiare la lettura di admin_users.

Salva opera sulla schermata selezionata. Dopo validazione, il service rilegge
gli ID attivi dal DB e prepara un unico bulk upsert **delle sole configurazioni A**,
con conflitto sulla PK id, non sull'indice parziale. Per righe nuove genera UUID
server-side; conserva created_at delle righe esistenti e usa un timestamp
server affidabile per quelle nuove. ID/autore/timestamp non arrivano dal client.
L'indice parziale resta la protezione contro creazioni concorrenti della stessa
coppia: conflitto -> rollback dell'intero bulk e richiesta di ricaricamento,
senza retry che sovrascriva una configurazione non vista.

La policy UPDATE ammette come righe sorgenti solo quelle non archiviate, mentre
WITH CHECK consente al super_admin sia salvataggio sia archiviazione. Un reset
concorrente non deve permettere al vecchio ID di essere riattivato dal bulk.
Reset usa un solo UPDATE delle righe attive della schermata, soggetto a RLS.
Testare in staging entrambi i casi di concorrenza con PostgREST: nessuna sequenza
REST multi-step dichiarata atomicamente riuscita. Tra modifiche alle stesse
righe ancora attive prevale l'ultimo salvataggio intero; mostrare conferma e orario.
Questo uso di upsert riguarda soltanto ui_field_visibility: **in M10-C e' vietato**.

## 6. Registro e inventario delle schermate

File futuro: `src/config/field-visibility-registry.ts`. Campi del registro:
`screenKey`, `fieldKey`, `module`, `label`, `description`, `isRequired`,
`configurable`, `defaultVisible`, `displayOrder`. Registro versionato in Git.
Tutti i campi configurabili iniziano visible; chiavi indipendenti da traduzione.
Il registro viene predisposto in A1; l'inventario seguente definisce le
integrazioni da eseguire in A2, non modifiche alle schermate da anticipare in A1.

Liste desktop e relative card mobile usano **la medesima screen_key**; create,
edit, detail e filtri hanno chiavi distinte. Non aggiungere nella card campi che
oggi non esistono solo per renderla identica alla tabella. Nascondere
`members.edit.email` non nasconde `members.list.email` o la colonna nei report.

### 6.1 Inventario dei campi facoltativi configurabili

Le parentesi nei nomi delle route indicano pannelli inline, non nuove route.
Ogni chiave elencata separata da virgola identifica una voce autonoma del registro.

| Modulo e route reale | screen_key proposte | field_key configurabili |
| --- | --- | --- |
| Soci, `/members` | `members.list` | `email`, `phone`, `city` |
| Socio, `/members/new`, `/members/[id]/edit`, `/members/[id]` | `members.create`, `members.edit`, `members.detail` | `email`, `phone`, `address`, `city`, `postal_code`, `province`, `birth_date`, `fiscal_code`, `profession`, `notes` |
| Ruoli, `/settings/roles` (lista e form inline) | `roles.list`, `roles.create`, `roles.edit` | `description`, `is_default` |
| Assegnazione ruoli, dettaglio socio | `member_roles.create`, `member_roles.list` | `notes` |
| Piani, `/settings/membership-plans` | `membership_plans.list`, `membership_plans.create`, `membership_plans.edit` | `description` |
| Iscrizioni, `/memberships` | `memberships.list` | `membership_plan_id` come label del piano mostrato |
| Iscrizione, `/memberships/[id]` | `memberships.detail` | `membership_plan_id` come label del piano mostrato |
| Storico iscrizioni nel socio | `memberships.history` | `membership_plan_id` come label del piano mostrato |
| Iscrizione e rinnovo rapido, `/memberships/new` | `memberships.create` | Nessuno nella V1: controlli necessari al periodo/quota e note condizionalmente obbligatorie |
| Pagamenti nel dettaglio iscrizione | `payments.create`, `payments.list` | `reference`, `notes`, dove gia' mostrati |
| Sponsor, `/sponsors` | `sponsors.list` | `contact_name`, `email`, `phone`, `city`, dove gia' mostrati |
| Sponsor, `/sponsors/new`, `/sponsors/[id]/edit`, `/sponsors/[id]` | `sponsors.create`, `sponsors.edit`, `sponsors.detail` | `contact_name`, `email`, `phone`, `website`, `address`, `city`, `vat_number`, `fiscal_code`, `notes` |
| Contributi nel dettaglio sponsor | `sponsor_contributions.create`, `sponsor_contributions.edit`, `sponsor_contributions.list` | `event_id` (selettore/label dell'evento), `notes` |
| Contributi nel dettaglio evento | `sponsor_contributions.event_list` | Nessuno: associazione, tipo, data, importo e descrizione restano visibili |
| Eventi, `/events` | `events.list` | `location` |
| Evento, `/events/new`, `/events/[id]/edit`, `/events/[id]` | `events.create`, `events.edit`, `events.detail` | `description`, `location`, `notes` |
| Eventi collegati nel dettaglio sponsor | `events.sponsor_list` | `location` |
| Sponsor associati nel dettaglio evento | `event_sponsors.create`, `event_sponsors.edit`, `event_sponsors.list` | `sponsorship_level`, `notes` |
| Template, `/email/templates` e form esistenti | `email_templates.list`, `email_templates.create`, `email_templates.edit` | Nessuno: nome, subject, body, audience richiesti; is_active e' un controllo di workflow |
| Campagne, `/email/campaigns` e form/dettaglio esistenti | `email_campaigns.list`, `email_campaigns.create`, `email_campaigns.edit`, `email_campaigns.detail` | `template_id`, dove gia' mostrato; edit solo bozza |
| Report, `/reports` | `reports.filters` | `query` (form `q`), `status`, `membership_status`, `payment_status`, `payment_method`, `contribution_type`, `audience_type`, soltanto per i tipi di report che gia' li supportano |

`is_default` dei ruoli e' una scelta facoltativa con default esistente false;
non e' un permesso admin. La sua visibilita' richiede il trattamento sicuro delle
checkbox della sezione 9. Un selettore opzionale di relazione mostrato all'utente
puo' essere configurabile; una FK nascosta usata solo dal runtime no.

Non inventare `memberships.edit`, `payments.edit` o pagine di dettaglio/CRUD che
non esistono. I pannelli di ruoli, pagamenti e relazioni restano nelle route attuali.

### 6.2 Campi e schermate esclusi

Obbligatori sempre visibili: nome/cognome/stato/country del socio, nome e
ordinamento ruolo, nome/quota minima/durata/ordinamento piano, ragione sociale e
stato sponsor, nome/stato/inizio evento, dati necessari a periodo e pagamento.
Il default Italia non rende country automaticamente nascondibile nel form.

Restano visibili anche campi nullable ma necessari al workflow:
`sponsor_contributions.description` per non monetari, `memberships.notes` per
quota zero, estremi dei periodi, `events.end_datetime`, `member_roles.end_date`,
scelta piano in creazione/rinnovo, destinatari custom, base consenso e conferma invio.

Non configurabili: PK, FK tecniche non mostrate, created_at/updated_at/archived_at,
campi Auth/sicurezza, audit interno, runtime, importi aggregati, stati derivati,
contatori, pulsanti, azioni, conferme, filtri indispensabili al workflow.
`reports.filters` non nasconde tipo report, date del periodo, finestra scadenza
o consenso esplicito all'inclusione degli archiviati.

Login, dashboard/KPI, navigazione, logout, `/expirations` e relativi filtri
operativi, riepilogo `/email`, destinatari/stati invio e indici Impostazioni non
acquisiscono campi configurabili. Filtri e ordinamenti degli elenchi anagrafici
restano invariati. Questa e' una selezione conservativa delle schermate reali,
non una personalizzazione libera del layout.

## 7. Pagina /settings/field-visibility

Route definitiva `/settings/field-visibility`: coerente con `/settings/roles`
e `/settings/membership-plans` e piu' esplicita di `/settings/fields`.
`requireActiveAdmin` prima di ogni fetch; lettura per admin attivi, modifiche
con ulteriore controllo super_admin server-side. Il normale admin vede la
configurazione ma non puo' salvarla o resettarla.

La pagina viene creata in A1. Fino all'integrazione A2 di una schermata, il suo
catalogo e' consultabile ma switch, Salva e Ripristina per quella schermata
restano disabilitati, con indicazione di applicazione non ancora attiva. Il
service di configurazione viene collaudato in ambiente separato senza effetti
sui form. L'abilitazione segue lo stato di integrazione versionato nel codice,
non un terzo stato DB o un flag scelto dall'utente. Le operazioni server della
pagina rifiutano configurazioni operative per schermate non ancora attivate.

Raggruppamento per modulo, selettore schermata, ricerca, label, descrizione,
indicazione obbligatorio/facoltativo, default e switch **Visibile**. Campi
obbligatori selezionati e disabilitati con motivo esatto:
**"Campo obbligatorio: non può essere nascosto"**.
Per quelli esclusi dal workflow mostrare il motivo specifico, non dichiararli
falsamente NOT NULL. Schermata priva di campi facoltativi: empty state dedicato.

Salva e Ripristina predefiniti per schermata, conferma del riepilogo, stato
dirty e avviso prima di perdere modifiche. Dicitura:
**"Questa configurazione è globale per tutti gli amministratori"**.
Nessun selettore ruoli/gruppi/scope e nessun controllo readonly.

Tabella desktop, elenco mobile; Brand Refresh invariato, focus e label associate,
switch accessibili da tastiera, azioni con icone Lucide pertinenti e testo chiaro.
Non reintrodurre overflow orizzontale, input piccoli che attivano zoom Safari o
pulsanti coperti dalla barra inferiore. Conservare safe area e scroll padding.

## 8. Resolver A1 e integrazione progressiva A2

Un unico service futuro `field-visibility.service.ts`, server-side, carica per
screen_key tutte le righe attive e risolve una mappa di booleani dal registro.
In A1 viene usato/testato nella foundation e nella pagina Impostazioni; non
viene ancora collegato alle schermate business. In A2 il componente integrato
riceve soltanto questa mappa. Per pagine con pannelli multipli,
una lettura per insieme di screen_key, **mai una query per campo**.

Memoizzazione limitata alla request/render autenticata: nessuna cache globale
fra sessioni e nessuna persistenza browser. Dopo salvataggio/reset invalidare
pagina Impostazioni e viste coinvolte con le API di revalidazione esistenti;
un submit rilegge sempre la configurazione corrente. Testare in Next.js reale
che request cache e invalidazione non restituiscano preferenze precedenti.

Assenza di riga: default visible. Riga archiviata: ignorata. Chiave ignota in
lettura: ignorata e diagnostica senza valori personali; in scrittura: rifiutata.
Errore DB: lettura UI puo' usare default visible con avviso, trattandosi di
preferenza non riservata; **salvataggio form/configurazione bloccato** se non si
puo' ricostruire con certezza l'insieme dei campi da preservare.

Rollout **A2**, successivo alla verifica post-merge A1: prima members, poi
sponsors/events, quindi ruoli/relazioni/piani/iscrizioni/pagamenti/email/filtri.
Per ogni gruppo adeguare prima mapper/update e validazioni di presenza, poi
integrare liste/card/dettagli/form/filtri e verificare non perdita dati. Solo
allora abilitare i controlli della relativa schermata nelle Impostazioni.
Nessun toggle operativo per componenti non ancora integrati; nessuna attivazione
massiva dei moduli per il solo fatto che A1 sia stata mergiata.

## 9. Preservazione dei valori: requisito bloccante M10-A2

Le modifiche descritte in questa sezione appartengono esclusivamente ad A2.
A1 non modifica helper condivisi, mapper, update o validazioni dei form business.

Non basta omettere un Input. Oggi `readRequiredString` usa stringa vuota per
assenza, `readOptionalString` produce null e `readBoolean` false; diversi mapper
scrivono poi tutti i campi del record. Gli adattamenti futuri devono separare
campo assente, campo esplicitamente svuotato e campo nascosto.

| Punto attuale | Rischio con un controllo nascosto | Correzione futura |
| --- | --- | --- |
| `src/utils/form.ts` e validatori dei service | Assenza -> `""`, null, false | Usare presenza esplicita e allowlist per schermata prima della normalizzazione |
| Members/sponsors/events, mapper completi | Note, contatti, date sovrascritti da null | Patch solo dei campi visibili presenti; validazione su record corrente piu' patch |
| Roles/plans, sortOrder con fallback `0` | Azzeramento involontario | Campo richiesto resta visibile; assenza obbligatoria rifiutata, non accettata come zero |
| Roles isDefault / plans isActive / template isActive | Checkbox assente -> false | Solo isDefault configurabile; presenza del controllo distinta dal suo valore |
| Contributi, importo vuoto `0`, data vuota oggi | Default non richiesto in update | Importo/data non configurabili; rifiutare omissioni richieste; non riapplicare default create su update |
| Payments, amount e data; helper valuta | Vuoto -> NaN/default data | Validazioni esistenti mantenute; reference/notes hidden non partecipano alla patch |
| Contributi eventId, campagne templateId | Assenza -> null e scollegamento | FK opzionale hidden preservata; svuotamento ammesso solo da selettore visibile |
| ReportFilterPanel/parser filtri | Controllo nascosto assente -> all/false/nessuna ricerca | Trasportare i filtri attivi senza modificarli; stessa query e colonne export M8 |

Flusso server di edit: autenticare, caricare record e configurazione corrente,
costruire allowlist, ricavare patch dei campi visibili realmente presenti,
validare il risultato unito al record corrente, persistere **solo la patch**.
Campi hidden eventualmente inviati manualmente sono esclusi da questa action
di schermata; non diventano autorizzazioni DB per colonna.

Per una checkbox visibile, il form deve inviare un marcatore di presenza
distinto dal valore; il server lo accetta solo per campi attualmente visibili.
Unchecked esplicito puo' diventare false; checkbox nascosta/assente non cambia
il DB. Non fidarsi di un elenco di campi visibili dichiarato dal client.

In create, campi facoltativi nascosti assumono null o **default gia' esistenti**;
nessun default arbitrario. Obbligatori o condizionalmente necessari restano
visibili e vengono sempre validati. Se la configurazione cambia durante la
compilazione, richiedere ricaricamento prima di un salvataggio ambiguo.

I filtri report sono parametri di query, non campi riservati: un filtro nascosto
ma attivo resta nel parametro/hidden input e nel riepilogo filtri applicati;
non azzerarlo al submit. L'export completo B non usa affatto questi filtri.

## 10. Test e acceptance M10-A

### 10.1 M10-A1 Field Visibility Foundation

- Default visible senza righe; hidden; reset mediante archiviazione; no DELETE.
- Obbligatori e condizionali non nascondibili, anche con request contraffatta.
- Admin legge ma non modifica; super_admin attivo autorizzato alla configurazione; anon,
  inactive, archived e Auth senza admin negati alle operazioni non autorizzate.
- `updated_by` e' l'ID admin corretto, non Auth UUID; autore arbitrario rifiutato.
- RLS, grant, CHECK coppie ammesse e unicita' della coppia attiva verificati in DB.
- Nessuna alterazione/dato trasformato nelle tabelle business dalla migration.
- Registro, resolver, batch/cache/fallback e salvataggio/reset collaudati con
  fixture su ambiente separato; nessuna query per singolo campo.
- Pagina Impostazioni desktop/mobile protetta, catalogo leggibile e controlli
  delle schermate non integrate disabilitati; rifiuto server di attivazioni premature.
- Diff A1 privo di modifiche alle schermate business, ai loro mapper/update e
  alle validazioni; nessun consumo del resolver nei moduli prima di A2.
- Lint, typecheck, build e verifica post-merge foundation.

Accettazione A1: infrastruttura e pagina pronte, nessuna schermata business
modificata, nessuna preferenza prematuramente applicata. Non e' ancora il
completamento funzionale di M10-A Field Visibility.

### 10.2 M10-A2 Field Visibility Rollout

- Hidden non cancella stringhe, date, checkbox o FK; clear esplicito visible valido.
- Modifica di un altro campo preserva tutti i valori nascosti; cambi concorrenti
  delle preferenze non producono perdita dati.
- Liste/card coerenti; create/edit/detail indipendenti; label tradotte non cambiano chiavi.
- Query in batch, fallback documentato, invalidazione e reset effettivi.
- Report, email, segmentazioni e rinnovi storici invariati; nessuna UI gruppi/readonly.
- Lint, typecheck, build e test desktop/mobile, incluso Safari e azioni a fondo pagina.

Accettazione A2: integrazioni progressive completate, configurazione globale
persistita e applicata, due soli stati, campi facoltativi soltanto, permessi
corretti, test di non perdita dati superati per ogni modulo e nessuna regressione.
M10-A e' completa solo dopo A1 **e** A2; C attende la verifica post-merge A2.

## 11. Pagina portabilita' e autorizzazioni M10-B/C

Route definitiva **`/settings/data-import-export`**. Accesso esclusivo ai
super_admin attivi, con guard server-side prima di parsing, letture o download.
Usare la sessione Supabase verificata e RLS, non un client service role.

Tre operazioni distinte:

1. **Esporta tutti i dati in Excel** (B).
2. **Scarica modello import nuovi soci** (C).
3. **Importa nuovi soci da Excel** (C).

Non aggiungere bottoni di import disabilitati o finti nella PR B in attesa di C.
Ogni endpoint verifica autonomamente guard/ruolo; nascondere il menu non basta.
Endpoint tecnici proposti sotto la stessa route: `export` (POST),
`members-template` (GET), `members-import/dry-run` e `members-import/confirm`
(POST multipart). Errori/report di import restituiti dallo stesso flusso protetto.
GET non esegue mai import; metodo non supportato rifiutato.

Protezione same-origin/CSRF per POST, allowlist dei parametri, risposte private
`no-store`, Content-Disposition attachment e Content-Type XLSX corretto.
Non memorizzare workbook in public, repository, storage o disco temporaneo.
Niente file Excel o dati personali nei log, console, cache CDN o analytics.

## 12. M10-B: formato completo e differenza da M8

B e' la **prima fase operativa**, read-only sui dati applicativi. Non legge
configurazioni M10-A e non richiede che la relativa tabella esista. Lo snapshot
Excel permette un riferimento dei dati prima degli interventi A2 sui form;
resta portabilita' applicativa, non un backup completo o un restore automatico.

Identificatore **`pontenext-full-export-v1`**; nome download
`pontenext-full-export-v1-<timestamp-UTC>.xlsx`.

Questo export include tutti i record autorizzati delle 13 tabelle previste,
**anche archiviati e inattivi**, senza filtri di pagina, ordinamento UI o
preferenze hidden. Include i figli delle entita' archiviate. Non troncare una
query al limite predefinito REST e non chiamare completo un file parziale.

L'attuale export `/reports/export` M8 resta distinto: CSV/XLSX filtrati,
preview e limiti esistenti. Non ampliarne i permessi e non trasformarlo
automaticamente in export globale. Il writer attuale produce un foglio di
report, non un manifest typed multi-sheet, e non dispone di parser import.

README descrive scopo, formato, tipi, esclusioni, presenza di dati personali e
incompatibilita' con l'import soci. METADATA registra versione formato/schema,
timestamp UTC, commit applicativo, migration `001`-`010` rilevate alla futura
esecuzione, origine non segreta, conteggi per foglio, strategia snapshot,
colonne escluse e riferimenti esterni. Non inserire token o credenziali.

## 13. M10-B: manifest dei fogli e relazioni

**15 fogli: README, METADATA e 13 fogli dati.** Manifest esplicito, nessun
`select *` su nuove colonne future. Colonne in ordine canonico:

| Foglio | Colonne incluse |
| --- | --- |
| members | id, first_name, last_name, email, phone, address, city, postal_code, province, country, birth_date, fiscal_code, profession, notes, status, created_at, updated_at, archived_at |
| roles | id, name, description, is_default, sort_order, created_at, updated_at, archived_at |
| member_roles | id, member_id, role_id, start_date, end_date, notes, created_at, updated_at, archived_at |
| membership_plans | id, name, description, minimum_fee, default_duration_months, is_active, sort_order, created_at, updated_at, archived_at |
| memberships | id, member_id, membership_plan_id, start_date, end_date, minimum_fee, expected_fee, paid_amount, payment_status, status, notes, created_at, updated_at, archived_at |
| payments | id, membership_id, payment_date, amount, method, reference, notes, created_by, created_at, updated_at, archived_at |
| sponsors | id, company_name, contact_name, email, phone, website, address, city, vat_number, fiscal_code, notes, status, created_at, updated_at, archived_at |
| sponsor_contributions | id, sponsor_id, contribution_date, amount, contribution_type, description, notes, created_at, updated_at, archived_at, event_id |
| events | id, name, description, start_datetime, end_datetime, location, status, notes, created_at, updated_at, archived_at |
| event_sponsors | id, event_id, sponsor_id, sponsorship_level, notes, created_at, updated_at, archived_at |
| email_templates | id, name, subject, body, audience, is_active, created_by, created_at, updated_at, archived_at |
| email_campaigns | id, template_id, subject, body, audience_type, status, provider, recipient_snapshot_generated_at, send_confirmed_at, sent_at, failed_at, error_message, created_by, sent_by, created_at, updated_at, archived_at |
| email_campaign_recipients | id, campaign_id, recipient_type, member_id, sponsor_id, email, recipient_name, status, skip_reason, provider_message_id, error_message, sent_at, opted_out_at, consent_basis_snapshot, created_at, updated_at |

Esclusione deliberata: `email_campaign_recipients.opt_out_token_hash` e'
materiale di sicurezza e **non viene esportato**, neppure come hash. Questa
tabella non ha archived_at: non inventare una colonna o filtrarla come le altre.
Subject/body delle campagne e destinatari sono snapshot storici, non ricostruiti
dai template o dall'anagrafica corrente. Contenuto HTML solo testo nel file.

UUID e FK restano testo integrale; numeri monetari restano numeri a due decimali,
booleane vere booleane; date testo ISO `YYYY-MM-DD`, timestamptz ISO UTC con
precisione conservata, non seriali Excel dipendenti dal fuso. CAP, telefoni,
codici fiscali e partite IVA sono testo per non perdere zeri iniziali.
Stringhe come `=...` sono celle di tipo testo, mai formule o hyperlink attivi.

Definire in README un encoding reversibile: null = cella assente, stringa vuota
= marcatore `\\E`, backslash iniziale letterale raddoppiato. Il decoder di test
deve distinguere null/vuoto/marker letterale; numeri e booleani non usano marker.
Nessun troncamento silenzioso di testo, precisione o caratteri XML non rappresentabili:
incompatibilita' -> export bloccato con messaggio privo di contenuto sensibile.

Le FK business restano riferimenti ai fogli corrispondenti. `created_by` e
`sent_by` puntano ad `admin_users`, **non esportata**: conservarne gli UUID e
dichiarare in METADATA che sono riferimenti esterni. Non esportare Auth, password,
sessioni, chiavi, token, service role, anon key, credenziali o configurazione UI.

## 14. M10-B: snapshot, limiti e implementazione prevista

Letture REST separate non garantiscono uno snapshot coerente durante scritture
concorrenti. Scelta proposta: futura funzione RPC read-only dedicata al manifest,
SECURITY INVOKER, search_path sicuro, sessione utente e controllo super_admin,
che restituisca dati e conteggi con **un unico statement SELECT** e snapshot
PostgreSQL coerente. Nessuna scrittura, modifica di tabella o bypass RLS.
La funzione richiedera' una migration additiva separata B da approvare, non
contenuta nella migration A e non creata in questa PR.

Se si scegliesse invece paging REST, dichiarare esplicitamente la minore
consistenza e la necessita' di finestra senza scritture: non presentarlo come
snapshot atomico equivalente. L'accettazione B richiede la soluzione snapshot
verificata, non solo conteggi uguali rilevati in istanti diversi.

Limiti iniziali proposti: massimo **10.000 righe dati complessive**, **10 MiB**
di payload dati prima del writer e **3 MiB** di XLSX finale. Conteggi e limiti
verificati prima di restituire qualunque download; anche una sola tabella
eccedente blocca l'intero export. I limiti non autorizzano selezione dei primi N
record. Volumi superiori richiedono revisione progettuale, non esportazioni
parziali dichiarate complete o upload automatico di dati su nuovi servizi.

`data-export.service.ts` futuro: autorizzazione, snapshot allowlisted, controllo
tipi/limiti, serializzazione XLSX in memoria. Libreria e limiti da validare con
dataset sintetici ampi, testi email lunghi e record archiviati. Il limite nativo
Excel di 32.767 caratteri per cella impone un controllo preventivo, non slicing.
[Limiti ufficiali Excel](https://support.microsoft.com/en-us/excel/excel-specifications-and-limits).

## 15. Test e acceptance M10-B

- Tutti i 15 fogli, manifest esatto, METADATA e conteggi coerenti con lo snapshot.
- UUID/FK interni preservati; riferimenti admin esterni esplicitati; nessun Auth.
- Nessun token/hash opt-out/segreto; confronto del manifest con schema approvato.
- Attivi, inattivi, archiviati e figli inclusi; nessuna dipendenza da filtri/hidden.
- Numeri/importi/date/stati conservati; test null/vuoto/marker e zeri iniziali.
- Celle formula-like esportate come testo; HTML non eseguito; niente macro/link esterni.
- Letture concorrenti non producono relazioni spezzate da snapshot differenti.
- Limiti righe/file/cella -> errore, mai dati tagliati; nessun file su disco.
- Admin ordinario/anon/inactive/archived negati; super_admin soggetto a RLS.
- M8 invariato; test parser indipendente riapre il workbook e confronta i dati
  sintetici in memoria, **senza importarli nel DB**.
- Lint, typecheck, build e test in ambiente separato prima di qualsiasi export live.

## 16. M10-C: perimetro create-only definitivo

Unica destinazione: **`public.members`**. Unico DML ammesso: **INSERT**.
Vietati UPDATE, UPSERT, DELETE, TRUNCATE, MERGE, `on conflict do update`,
archiviazione, riattivazione, modifica di soci esistenti e update dopo l'insert.

Nessuna scrittura in roles, member_roles, membership_plans, memberships, payments,
sponsors, sponsor_contributions, events, event_sponsors, email_templates,
email_campaigns, email_campaign_recipients, admin_users, auth.users o
ui_field_visibility. Nessuna nuova tabella audit.

Un socio importato non ha automaticamente ruoli, iscrizioni, quote o pagamenti;
non riceve messaggi, non ottiene account o utenti Supabase Auth. Successive
assegnazioni e iscrizioni si svolgono con le funzioni ordinarie. L'import non
e' un restore, una sincronizzazione o un percorso per caricare altre entita'.

## 17. Schema reale members e modello Excel dedicato

File **`pontenext-new-members-import-v1.xlsx`**, identificatore nel README
**`pontenext-new-members-import-v1`**. Esattamente due fogli: **README**, **members**.
README con identificatore/versione in celle fisse documentate, scopo, colonne,
obblighi, date ISO, default, duplicati, limiti e divieto di modificare soci
esistenti o creare ruoli/iscrizioni. Il nome del file non prova il formato.

Tutte le intestazioni del modello sono stabili e presenti; facoltativo significa
che la **cella** puo' essere vuota. Rifiutare intestazioni mancanti, duplicate o
sconosciute, non correggerle indovinando sinonimi. L'ordine ufficiale e' quello
della tabella; un riordino univoco riconosciuto per nome e' ammesso.

| Colonna modello | Schema live / regola import |
| --- | --- |
| first_name | text NOT NULL, obbligatorio non vuoto dopo trim |
| last_name | text NOT NULL, obbligatorio non vuoto dopo trim |
| email | text nullable; facoltativo, trim/lowercase e formato valido |
| phone | text nullable; facoltativo, non numero Excel |
| address | text nullable; facoltativo |
| city | text nullable; facoltativo |
| postal_code | text nullable; facoltativo, zeri iniziali preservati |
| province | text nullable; facoltativo, uppercase e due caratteri come il form |
| country | text NOT NULL con default Italia; cella facoltativa, vuota -> Italia |
| birth_date | date nullable; facoltativo, ISO rigoroso e data reale non futura |
| fiscal_code | text nullable; facoltativo, uppercase e rimozione spazi superflui |
| profession | text nullable; facoltativo |
| notes | text nullable; facoltativo, a capo e accenti preservati |
| source_row_reference | Colonna facoltativa di servizio scelta per la V1; testo riportato negli esiti, **mai persistito** |

Campi tecnici vietati anche se la colonna e' vuota: **id, status, created_at,
updated_at, archived_at**. Vietati anche role_name, role_id, membership_plan,
quota, data iscrizione/data_iscrizione, payment e qualunque colonna extra.

Il database genera UUID e timestamp. Il server imposta status **active**;
archived_at e' sempre null. Nessun valore tecnico dal workbook confluisce
nell'INSERT. `members.status` resta anagrafico, non associativo.

Le 13 colonne business corrispondono allo schema live. CHECK attuali: nomi non
vuoti, status limitato ad active/inactive/archived, email/codice fiscale non
vuoti se valorizzati. Non risultano vincoli DB di lunghezza o UNIQUE su email
e fiscal_code. Il solo trigger members e' `set_members_updated_at` BEFORE
UPDATE: non ci sono trigger INSERT che creino relazioni o inviino email.

Il workbook completo B e' **rifiutato**, non parzialmente elaborato. Non estrarre
il suo foglio members e non ignorare silenziosamente altri fogli: formato e
insieme dei fogli dedicati sono obbligatori. `ui_field_visibility` non influisce
sul modello o sulle colonne importabili, anche se nascoste nell'applicazione.

## 18. Flusso obbligatorio M10-C

1. Scaricare il modello ufficiale dalla pagina protetta.
2. Compilare members con nuove anagrafiche.
3. Upload XLSX, ancora senza scritture.
4. Controllo estensione, contenitore, formato e versione.
5. Parsing esclusivamente server-side.
6. Dry-run completo: validazione di tutte le righe e duplicati file/database.
7. Preview dei valori normalizzati, paginata senza omettere errori dal riepilogo.
8. Riepilogo totale, valide, errori, duplicati bloccanti, possibili duplicati e normalizzazioni.
9. Download report errori/avvisi, anche se l'import e' bloccato.
10. Presa visione esplicita dei warning e conferma del super_admin.
11. Nuova verifica server e **un unico bulk INSERT atomico**, tutto-o-niente.
12. Report finale con record effettivamente creati e UUID generati.

Nessun inserimento al caricamento o alla preview. Un solo errore/conflict blocca
tutte le righe; non saltare automaticamente quelle problematiche. Oltre limite
il file e' rifiutato e va diviso dall'utente, con un nuovo dry-run per ogni file.

## 19. Dry-run, ricevuta e conferma non aggirabile

Il server calcola SHA-256 dei byte originali, hash del dataset normalizzato,
riepilogo e warning. Il solo hash fornito dal browser **non dimostra** che il
dry-run sia stato eseguito. Prevedere ricevuta firmata server-side, valida
15 minuti, legata a admin.id, Auth UID, progetto, formato/versione validatore,
hash file/dataset, numero righe, hash warning e nonce.

Firma con chiave dedicata server-only futura, proposta
`MEMBERS_IMPORT_RECEIPT_SECRET`: non riusare service role, password o chiave
Resend. Se implementata, documentarne generazione/rotazione e aggiungere solo
il nome vuoto a `.env.example` nella futura PR C; **nessuna env cambia ora**.
Chiave assente/scaduta/ruotata -> nuovo dry-run, non bypass.

Alla conferma il browser ricarica lo stesso file conservato solo in memoria,
la ricevuta e l'accettazione dei warning. Il server riverifica sessione/ruolo,
firma/scadenza/attore, hash, parsing, validazioni e duplicati sul DB corrente.
Preview JSON, valori normalizzati o UUID inventati dal browser non sono input
di fiducia. File diverso, nuova regola, nuovo warning o modifica rilevante
dei possibili duplicati -> **nuovo dry-run e nuova conferma**.

Non conservare il workbook permanentemente o in memoria di processo contando
sulla successiva invocazione Vercel: le istanze possono essere diverse.
Il browser non usa localStorage e svuota file/preview all'abbandono della pagina.
Disabilitare doppio submit; non eseguire retry automatici dell'INSERT.

La ricevuta non e' un audit persistente o garanzia exactly-once. Senza nuova
tabella idempotenza non si puo' garantire il recupero automatico dopo risposta
persa: un timeout puo' seguire un commit riuscito. Mostrare **esito da verificare**,
non dichiarare zero righe o ripetere l'operazione. Richiedere controllo in sola
lettura dei soci creati e nuova decisione prima di un'altra esecuzione.

## 20. Duplicati: classificazione e letture

Gli indici live `members_email_idx` e `members_fiscal_code_idx` sono **non univoci**.
La PK id e' unica ma e' generata ex novo: non protegge da doppie anagrafiche.
Controllare anche soci inattivi e archiviati; non riattivarli automaticamente.

| Confronto | Esito V1 |
| --- | --- |
| fiscal_code valorizzato uguale dopo uppercase/rimozione spazi, nel file o nel DB | conflict: blocca tutto |
| Riga business normalizzata identica ripetuta nel file, ignorando source_row_reference | conflict: blocca tutto |
| Stessa email nel file o nel DB | warning: possibile duplicato, presa visione obbligatoria |
| Stesso nome/cognome | warning, non identificazione certa |
| Stesso nome/cognome/data nascita | warning evidenziato, verifica esplicita |
| Stessa email con nome differente | warning esplicito, non merge o overwrite |
| Nessun match e dati validi | Valida |

Per le corrispondenze warning usare confronto trim e case-insensitive, senza
riscrivere arbitrariamente nomi o rimuovere accenti dai dati salvati. Specificare
se il match e' interno al file o con record esistente; aggregare piu' motivi
sulla stessa riga senza gonfiare il numero delle righe problematiche.

Non riusare `getMembers()` come controllo duplicati: esclude archiviati e carica
relazioni non necessarie. Proiezione minima dedicata: id, fiscal_code, email,
first_name, last_name, birth_date, indicazione stato/archiviazione per warning.
Nessuna query per riga. Dry-run: lettura paginata deterministica, normalizzazione
anche dei valori legacy in memoria, massimo iniziale **10.000 soci da confrontare**;
se superato, interrompere con richiesta di revisione della strategia, non
convalidare su un sottoinsieme. Il lookup finale transazionale usa la stessa
normalizzazione. Non assumere che un `.in()` di codici normalizzati intercetti
codici legacy contenenti spazi.

Non introdurre UNIQUE sull'email o sanificazioni automatiche dei record live.
Un codice fiscale uguale e' trattato come conflitto prudenziale operativo,
non come nuova affermazione di unicita' dello schema.

## 21. Atomicita' e concorrenza: decisione tecnica proposta

Una sola `.insert(array)` e' atomica per le righe, ma il controllo duplicati
REST precedente e' separato: due istanze possono superarlo contemporaneamente.
Un lock JavaScript locale o advisory lock usato solo dagli importer non blocca
un normale INSERT manuale concorrente.

Per chiudere questa finestra, **proposta per la futura PR C**: funzione RPC
dedicata, SECURITY INVOKER, search_path vuoto e nomi qualificati, che controlla
super_admin attivo, limiti/allowlist, acquisisce un lock transazionale breve
`SHARE ROW EXCLUSIVE` su members, rilegge duplicati/avvisi nello stato corrente e
esegue **un solo INSERT bulk con RETURNING**. Il lock e' acquisito prima della
rilettura, in isolamento READ COMMITTED, e rilasciato al commit/rollback.
Conflitto nuovo, warning non confermato, errore o timeout prima del commit ->
nessun INSERT riuscito. Non eseguire chiamate esterne mentre il lock e' detenuto.

Questa modalita' di lock serializza gli inserimenti/modifiche concorrenti della
tabella senza impedirne le normali letture. Lock timeout iniziale 2 secondi,
statement timeout 5 secondi, da collaudare su ambiente separato. Nessuna modifica
strutturale di members e nessun DML su altre tabelle. La funzione richiede una
**futura migration additiva separata C, da approvare esplicitamente**: solo
funzione e privilegi strettamente necessari, senza tabella audit, nuovi indici
business, trigger o riscrittura di policy. Nessuna migration in questa PR.
[Comportamento dei lock PostgreSQL](https://www.postgresql.org/docs/17/explicit-locking.html).

Gli eventuali helper puri per normalizzazione devono avere gli stessi casi di
test del validatore TypeScript. La RPC non accetta nomi tabella/colonna, id,
status o autore arbitrari e non usa SQL dinamico. RLS resta applicata tramite
sessione; niente SECURITY DEFINER per bypassarla e niente service role.
Il server Next.js verifica la ricevuta prima della chiamata; la RPC riverifica
ruolo, dati, conflitti e warning, anche se invocata direttamente. La ricevuta
protegge il workflow Excel, non revoca il CRUD gia' autorizzato nella Data API.

Il risultato associa righe sorgente e UUID ritornati tramite chiave canonica
della riga normalizzata, con test sui default; non assumere che RETURNING abbia
lo stesso ordine dell'Excel e non preassegnare id dal file.

**Se non viene approvata/collaudata questa soluzione, C non e' pronta per import
live concorrenti.** Non dichiarare risolto il problema con una seconda SELECT.
Un'eventuale alternativa richiede decisione documentata prima dell'implementazione.
Non eseguire INSERT per riga, chunk, ignore-on-conflict o aggiornamenti successivi.

## 22. Validazione unica e normalizzazione

Estrarre nella futura C le regole di `validateMemberFormData` in un validatore
di dominio puro riusato dal form manuale e dall'adattatore Excel; quest'ultimo
fornisce i default controllati. Non chiamare un'action browser in un ciclo e
non duplicare regole divergenti in un secondo form nascosto.

Gap osservati oggi: `normalizeDateInput` distingue solo vuoto/non vuoto;
il controllo nascita confronta con oggi ma non valida rigorosamente il calendario;
non ci sono massimi espliciti; fiscal_code viene trim/uppercase, non ripulito
dagli spazi interni. Tali controlli vanno resi condivisi, non attribuiti al codice
attuale come gia' esistenti. Nessuna modifica dei record salvati.

| Dato | Regola proposta condivisa sulle nuove scritture |
| --- | --- |
| first_name, last_name | Trim esterno, obbligatori; massimo 100 caratteri ciascuno |
| email | Trim/lowercase, stessa regola formato del modulo, massimo 254 |
| phone | Testo, trim, massimo 50; non reinterpretare come numero |
| address | Trim, massimo 255 |
| city | Trim, massimo 100 |
| postal_code | Testo, massimo 20; mantenere zeri iniziali |
| province | Trim/uppercase, due caratteri se presente |
| country | Trim, massimo 100; vuoto -> Italia; testo libero valido, nessun nuovo catalogo paesi |
| birth_date | Testo ISO YYYY-MM-DD, data di calendario reale, non futura; vuoto -> null |
| fiscal_code | Uppercase e rimozione whitespace superfluo, massimo 32; nessun nuovo obbligo di checksum o lunghezza italiana 16 |
| profession | Trim, massimo 150 |
| notes | Trim esterno, massimo 5.000, mantenere a capo/Unicode |
| source_row_reference | Testo, trim, massimo 100, solo import/report, non dato membro |

I massimi sono **proposte M10-C**, non vincoli attuali del DB: verificare e
approvare nella PR C gli impatti sul form manuale e sui valori legacy lunghi.
Un edit non correlato non deve riscrivere/tagliare un valore legacy invariato;
validare nuovi valori/patch senza bonifiche automatiche. Non rilasciare due
validatori incompatibili per aggirare il problema.

Stringhe vuote facoltative -> null, eccetto country default. Nessun title-case
automatico, traslitterazione, perdita di accenti o modifica interna dei nomi.
Le date Excel seriali e i formati locali ambigui sono rifiutati nella V1: il
modello preformatta la colonna come testo e richiede ISO. Mostrare nella preview
sia normalizzazioni rilevanti sia valore finale. Errori di data non diventano null.

## 23. Sicurezza Excel, limiti e libreria

Solo `.xlsx`, MIME XLSX coerente e contenitore OOXML verificato: l'estensione
da sola non basta. Rifiutare `.xls`, `.xlsm`, macro/VBA anche camuffate, cifratura,
formule anche con valore cached, DDE, collegamenti esterni, oggetti incorporati,
fogli nascosti/extra, intestazioni duplicate, XML con entita' esterne e archivi
malformati. Il parser non esegue formule, HTML o contenuti del documento.

Controllare ZIP prima del parsing completo: limite byte decompressi, entry,
compression ratio e dimensioni reali del foglio, non solo `usedRange` dichiarato.
Massimo 100 entry, 10 MiB decompressi, 100:1 di espansione; niente estrazione su
disco. Righe vuote finali ignorate ma soggette ai limiti di scansione; riga con
sola source_row_reference non e' una nuova anagrafica valida.

| Limite iniziale C | Valore proposto |
| --- | --- |
| File compresso | 1 MiB |
| Body multipart complessivo | 1,5 MiB, applicato prima di buffering illimitato |
| Righe dati members | 500, oltre limite rifiutare tutto |
| Colonne members | 14 intestazioni esatte, inclusa source_row_reference |
| Dimensioni foglio | Riga header piu' massimo 500 righe dati; README limitato al modello |
| XML decompresso complessivo | 10 MiB |
| Tempo parsing/validazione applicativo | Budget 10 secondi per dry-run, da verificare con carichi sintetici |
| Transazione finale | Lock 2 secondi, statement 5 secondi; mai lavoro di parsing sotto lock |
| Report finale/errori | Massimo 3 MiB; valori e lunghezze controllati, nessun export massivo |

Vercel documenta un limite di **4,5 MB per request e response delle Functions**.
I massimi sopra sono scelte applicative prudenti inferiori a tale limite, non
limiti del piano Vercel osservati. Durata e memoria dipendono da piano/runtime/
Fluid Compute: non sono stati letti o modificati i settings del progetto.
Prima di C misurare heap, tempo, body multipart e output sul deploy di test,
con margine entro i limiti effettivi; se non rispettati, abbassare i limiti,
non introdurre chunk non atomici. I Route Handler evitano di affidarsi al limite
predefinito delle Server Actions per i file.
[Documentazione ufficiale Vercel, consultata il 2026-09-19](https://vercel.com/docs/functions/limitations).

Libreria candidata da valutare: [ExcelJS](https://github.com/exceljs/exceljs),
per lettura/scrittura tipizzata multi-sheet server-side. La scelta non e' una
certificazione di sicurezza: prima di installarla nella futura implementazione
verificare versione, licenza, manutenzione recente, advisory diretti/transitivi,
API per riconoscere formule e limiti ZIP; documentare l'esito e fissare la versione.
Se non permette i controlli prima dell'espansione, serve un lettore ZIP limitato
verificato o una diversa libreria. Non scrivere un parser XLSX artigianale.
**Nessuna dipendenza installata nella PR documentale.**

File, preview e report sono dati personali: nessun contenuto nei log, niente
telemetria di valori o file nel repository. In error report e preview valori
escapati come testo, mai HTML; XLSX usa celle stringa, CSV tecnico eventualmente
neutralizza prefissi formula e quote. Campi tecnici sconosciuti con contenuto
potenzialmente segreto vengono indicati come non ammessi senza riprodurne il valore.

## 24. Report errori e report finale

Report errori scaricabile preferibilmente XLSX, con foglio `errors`: riga Excel
(numero reale, header contato), source_row_reference, colonna, valore sicuro,
codice/tipo errore, descrizione e livello **error / conflict / warning**.
Niente stack trace, SQL, credenziali, token o dettagli interni Supabase.
Per campi sconosciuti/tecnici il valore e' redatto; lunghezze eccessive riportate
come anteprima esplicita, non usate per modificare il dato da importare.
La pagina deve rendere accessibili tutti gli errori, non soltanto quelli della
pagina di preview attualmente visualizzata.

Report finale dopo successo confermato: data/ora UTC, amministratore verificato,
nome file sanificato, SHA-256 file, numero inserimenti, elenco UUID generati,
nome/cognome, riga sorgente e warning esplicitamente confermati. Conteggio
ritornato deve coincidere con le righe validate; mancata corrispondenza non e'
un successo parziale accettabile. Download immediato in memoria, no tabella audit.

Report e ricevuta non garantiscono storico permanente: dopo chiusura pagina o
perdita risposta non promettere un elenco import recuperabile automaticamente.
Non aggiungere all'anagrafica un import_id/source_reference non richiesto.

## 25. RLS, guard e autorizzazione C

`members_insert_active_admin` autorizza oggi gli admin attivi, compresi quelli
ordinari, all'INSERT manuale. **Non restringere questa policy per implementare
l'import.** La route/action C deve imporre `requireActiveAdmin` e controllo
aggiuntivo super_admin prima del parsing e di nuovo prima della scrittura.
Usare il client Supabase server con sessione utente, soggetto alla stessa RLS.

La funzione transazionale proposta verifica autonomamente il ruolo aggiornato
e usa SECURITY INVOKER. Nessuna route pubblica, nessuna key nel browser/file,
nessuna elevazione service role e nessuna modifica del modello admin/Auth.
Gli admin ordinari mantengono il CRUD manuale ma non possono usare endpoint
Excel/RPC import. Utenti inactive/archived/Auth senza admin respinti.

Il divieto di saltare il dry-run riguarda ogni endpoint dell'applicazione C:
nessuno di essi invoca la scrittura senza ricevuta verificata. Non equivale a
revocare le API CRUD gia' accessibili a un admin autorizzato. Prima di esporre
la RPC C, la review deve verificare anche il requisito di conferma per le
chiamate dirette: se si richiede prova crittografica del dry-run anche nel DB,
serve una soluzione approvata di verifica della ricevuta a quel confine.
Non presentare la sola verifica del ruolo nella RPC come prova del dry-run;
la RPC non va pubblicata come endpoint di import alternativo privo di conferma.

Nota di audit read-only: i grant di tabella legacy per `authenticated` includono
privilegi piu' ampi delle operazioni previste (tra cui TRUNCATE), mentre non
esistono policy DELETE. RLS **non protegge TRUNCATE**: non equiparare assenza di
policy DELETE ad assenza di ogni privilegio distruttivo. Non sono stati esercitati
o modificati tali grant. Revisione dei privilegi legacy da trattare separatamente;
M10 non espone SQL arbitrario, non usa questi privilegi per DML distruttivo e
non li replica sulla nuova tabella A.
[Limiti delle policy RLS in PostgreSQL](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

## 26. Gate live e verifiche prima dell'esecuzione

### M10-A1, foundation di M10-A

Prima di una futura applicazione live: mostrare SQL completo, classificare
l'additivita', assenza di UPDATE/DELETE/DROP/TRUNCATE operativo e di ALTER su
tabelle business; registrare conteggi business prima/dopo senza esportare record,
verificare RLS e chiedere esattamente:

**MIGRATION M10-A LIVE APPROVATA**

Senza quella conferma Codex non applica la migration. Eventuali funzioni future
B/C richiedono proprie revisioni e approvazioni, non sono autorizzate da questa frase.
Il nome del gate M10-A resta invariato e si applica alla migration di A1.
A2 non ripete la migration foundation; eventuali necessita' aggiuntive richiedono
decisione separata. L'ordine B -> A1 non autorizza migration o export live automatici.

### M10-C

Prima del primo import live Codex mostra progetto, file/hash, dry-run, numero
righe, errori/conflict/warning, risultato test in ambiente separato e conferma
che il solo DML e' INSERT su members. Richiede esattamente:

**IMPORT NUOVI SOCI LIVE APPROVATO**

Questa frase sostituisce il precedente gate generico dell'import multi-tabella.
Approvazione riferita a quel file/hash, dataset e riepilogo, non a import futuri
o file modificati. La sola presenza della frase nella documentazione non e'
un'autorizzazione. Senza conferma non inserire dati live, nemmeno per un test.
Ogni uso umano dell'interfaccia richiede comunque conferma del super_admin e
presa visione dei warning, indipendentemente dal gate operativo di Codex.

## 27. Service layer e UI previsti

| Componente futuro | Responsabilita' |
| --- | --- |
| field-visibility registry/service | Catalogo, batch load, default, salvataggio configurazione e reset |
| FieldVisibilitySettings | Modulo/schermata, campi, switch, conferme e modifiche non salvate |
| data-export.service | Manifest, lettura snapshot RLS, limiti, workbook completo |
| members-import.service | Formato, parsing sicuro, normalizzazione condivisa, dry-run, ricevuta, riconferma, singolo INSERT |
| Validatore membro condiviso | Regole dominio per form e import, senza accesso a file o Supabase |
| Utility XLSX server-only | Tipi celle, limiti, escaping, workbook; nessun DB client privilegiato |
| DataImportExportPage | Tre operazioni separate, guard e stati caricamento/errore |
| MembersImportPreview / ImportIssues / ImportResult | Righe normalizzate, conteggi, warning, download e conferma |

Nomi React in PascalCase.tsx; organizzazione secondo pattern esistenti. Non
creare un framework generico di import multi-entita'. Dataset C consentito
determinato dal codice, non da parametro table o da foglio scelto nel browser.

Desktop: preview tabellare con scroll interno, header e colonna errori leggibili.
Mobile: righe in elenco con dettaglio espandibile e conteggi sempre accessibili;
nessuno scroll orizzontale dell'intera pagina. Empty state prima dell'upload,
stati validazione/invio distinti, pulsante Inserisci inattivo con errori o
senza presa visione. Navigazione via tastiera, messaggi associati alle righe,
focus sul riepilogo esito e spazio inferiore per Safari. Nessuna nuova dashboard.

## 28. Test M10-C

Tutti i test con dati sintetici su ambiente separato; nessun inserimento,
archiviazione o invio email sul progetto live per collaudare il piano.

| Gruppo | Casi obbligatori |
| --- | --- |
| Modello | XLSX dedicato valido, vuoto, versione sconosciuta, foglio members mancante, fogli extra, workbook completo B rifiutato |
| Intestazioni | Obbligatoria mancante, facoltativa header mancante, duplicata, sconosciuta, campo tecnico presente anche vuoto |
| File | Non XLSX, XLS/XLSM, macro mascherata, formula/cache formula, link esterno, oggetto embedded, ZIP bomb, XML malformato, oversize |
| Dati | Nome/cognome assenti, email invalida, provincia invalida, data inesistente/futura/locale/seriale, limiti lunghezza, country/default |
| Normalizzazione | Spazi, email lowercase, fiscale uppercase/spazi, celle vuote/null, accenti, a capo, zeri iniziali |
| Conflitti | Fiscale duplicato nel file o DB anche inattivo/archiviato, riga identica ripetuta, zero righe inserite |
| Warning | Email uguale anche nome diverso, nome/cognome, nome/cognome/nascita, presa visione obbligatoria, avviso nuovo dopo dry-run |
| Limiti | 500 righe e 501, file oltre 1 MiB, multipart/decompressione e scan DB oltre limite, nessun chunk automatico |
| Dry-run | Nessuna scrittura, SHA-256 corretto, ricevuta assente/alterata/scaduta, file cambiato, altro utente/progetto, preview manipolata |
| Auth/RLS | Anon, admin ordinario, inactive, archived, Auth senza admin negati; super_admin valido; RPC diretta con ruolo errato negata |
| Atomicita' | Un solo bulk INSERT, errore in una riga -> rollback totale; errore DB/lock timeout -> nessun risultato parziale |
| Concorrenza | Due import con fiscale uguale, INSERT manuale concorrente, nuovo possibile duplicato: serializzazione e riconferma corretta |
| Esito ambiguo | Risposta persa dopo commit, doppio click, replay ricevuta: nessun retry automatico o falsa promessa exactly-once |
| Effetti collaterali | Nessun UPDATE/UPSERT/DELETE/TRUNCATE/MERGE; valori dei soci preesistenti invariati; nessuna scrittura su altre tabelle |
| Relazioni | Nessun ruolo, member_role, membership, quota, payment o account Auth creato; nessuna email inviata |
| Report | Error/conflict/warning corretti, formule neutralizzate, valori sensibili redatti, UUID generati mappati senza dipendere dall'ordine RETURNING |
| UI | Desktop/mobile, preview paginata, errori completi, warning/confirm, file annullato, azioni raggiungibili su Safari |
| Regressioni | CRUD soci manuale, permessi admin ordinario, hidden UI indipendente dal formato import, M8 e M10-B invariati |
| Tecniche | npm run lint; npx tsc --noEmit; npm run build |

## 29. Acceptance criteria M10-C

- [ ] Solo nuovi soci; unica tabella scritta members e solo INSERT.
- [ ] Nessuna modifica/riattivazione/archiviazione dei record esistenti; nessun upsert.
- [ ] Modello dedicato e formato/versione verificati; workbook completo rifiutato.
- [ ] UUID dal DB, status active dal server, timestamp DB, archived_at null.
- [ ] Colonne import indipendenti dalla visibilita' UI; nessun campo tecnico accettato.
- [ ] Validatore coerente con form manuale, righe/limiti/default/normalizzazioni espliciti.
- [ ] Dry-run obbligatorio e senza scritture, ricevuta/hash verificati e nuova validazione finale.
- [ ] Duplicati certi bloccanti, possibili duplicati segnalati e confermati.
- [ ] Singolo INSERT atomico, protezione concorrenza collaudata, zero import parziali.
- [ ] Super_admin server-side, sessione/RLS, admin ordinario escluso solo dall'import.
- [ ] Nessuna relazione, quota, pagamento, Auth o email generata.
- [ ] Nessun file persistito; report errori e finale scaricabili; timeout ambiguo gestito.
- [ ] Lint, typecheck, build e test separati superati prima del live.
- [ ] Gate live richiesto sullo stesso hash/dry-run; nessuna esecuzione implicita.

## 30. Rischi e prerequisiti per le PR operative

| Priorita' | Rischio | Misura / condizione di rilascio |
| --- | --- | --- |
| Blocker | Hidden provoca null/false o scollega FK | Patch presence-aware e test di preservazione per ogni form integrato |
| Blocker | Form inutilizzabile per obbligatori nascosti | Registro conservativo, rifiuto server e CHECK coppie ammesse |
| Blocker | Import con dati non approvati o su altre tabelle | Allowlist, ricevuta, guard, verifica finale e DML limitato members |
| Blocker | RPC invocabile direttamente senza prova del dry-run | Definire/verificare il confine di conferma prima di esporla; nessun percorso C alternativo senza conferma |
| Blocker | Check duplicati e INSERT separati | Transazione/lock finale approvati e collaudati; niente garanzie inventate da indici non univoci |
| Blocker | Parser ZIP/XLSX non limitato o dipendenza vulnerabile | Audit libreria prima dell'installazione, limiti prima della decompressione |
| Important | Timeout dopo commit / ripetizione file senza fiscale | Nessun retry automatico, controllo read-only prima di ripetere; no exactly-once dichiarato |
| Important | Form e import hanno validazioni divergenti | Validatore condiviso, gestione valori legacy, test manuale ed Excel |
| Important | Lock members rallenta CRUD normale | Parsing fuori transazione, limiti, timeout breve, test concorrenza; rifiutare piuttosto che bloccare a lungo |
| Important | Snapshot export incoerente o incompleto | Lettura unica coerente, conteggi, nessun troncamento, limiti tutto-o-niente |
| Important | Export scambiato per backup o modello import | Formati distinti, rifiuto automatico e documentazione esplicita |
| Important | Exfiltrazione involontaria di dati/credenziali | Manifest, esclusioni token, guard super_admin, no log/cache, conservazione sicura dei download |
| Important | Grant legacy piu' ampi delle policy | Raccomandazione hardening separata; non usare/replicare privilegi distruttivi |
| Minor | Troppe preferenze, chiavi incoerenti o cache stale | Registro unico, filtri UI, chiavi stabili, batch e invalidazione |
| Minor | Limiti Vercel/Excel diversi al rilascio | Riverifica documentazione/piano effettivo e benchmark prima di B/C |

Prerequisiti ancora da approvare nella rispettiva implementazione: versione
libreria e audit, eventuali RPC additive B/C, benchmark e massimi effettivi,
chiave dedicata della ricevuta e regole condivise di lunghezza per nuovi valori.
Non sono autorizzazioni a cambiare schema/configurazioni nella task attuale.

## 31. Out of scope e compatibilita'

Fuori scope: permission group, utenti/gruppi, scope multipli, readonly,
permessi record/colonna/personali, localStorage, campi custom, drag-and-drop,
label modificabili, configurazione colonne export tramite visibilita', nuove
funzionalita' contabili, fatturazione, IVA, prima nota, area soci o nuovi provider.

Fuori scope C: import ruoli/assegnazioni/iscrizioni/quote/pagamenti/sponsor/eventi/
email/campagne/admin/Auth, import multi-tabella, restore, update/upsert/delete,
archiviazione/riattivazione, sincronizzazione bidirezionale, CSV import e macro.
I precedenti test di import UUID/FK/importi multi-tabella sono sostituiti dai
test soci; per B restano i test di conservazione UUID/FK/importi nel solo export.

M10-C non usa UUID storici del file: ne genera di nuovi per nuove anagrafiche.
Non puo' ricreare uno storico memberships/payments. Ogni rinnovo resta una
nuova membership nelle funzioni ordinarie, non un effetto dell'import.

Excel e' portabilita' applicativa, **non backup completo Supabase**: mancano
Auth, credenziali, policy, trigger, funzioni, schema e configurazioni hosting/
Resend. Dump PostgreSQL e procedure di restore/login admin restano quelle di
`MIGRATION_AND_BACKUP.md`. Non usare C per ripristinare un dump o un export B.

## 32. Verifiche di questa PR documentale

Eseguite sul repository della base indicata, senza implementare M10:

- `npm run lint`: superato.
- `npx --no-install tsc --noEmit`: superato, usando TypeScript locale senza installazioni.
- `npm run build`: superato; route esistenti presenti. Nessuna route M10 ancora implementata.
- Supabase: sole letture di metadati/schema/indici/policy/migration/trigger sul progetto indicato.
- Nessun import/export reale, nessun invio email, nessun dato live modificato.

Questi esiti certificano soltanto la base attuale, **non** test di funzionalita'
future. Documenti di coerenza aggiornati in questa PR: Master Plan, ADR,
Business Rules, Database Design, UI Guidelines, Migration and Backup, Changelog.
Il merge di questa PR approva un piano, non avvia automaticamente A, B o C.

Revisione dell'ordine operativo nella PR #47: solo documenti, sequenza
B -> A1 -> A2 -> C e confini foundation/rollout. Le verifiche applicative e
Supabase sopra sono quelle della precedente preparazione del piano, non nuove
esecuzioni di questa revisione; per il riordino si verificano diff documentale,
link e coerenza delle dipendenze. Nessun accesso operativo Supabase/Vercel.
