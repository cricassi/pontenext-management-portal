# M10 - Configurable Field Visibility & Permission-Ready Policies

Implementation Plan, 19 settembre 2026.

**Stato: proposta documentale, non implementata.** Questo documento non abilita
policy, non contiene una migration operativa e non modifica dati o configurazioni.
Repository verificato: `cricassi/pontenext-management-portal`, base `main`
`b6bc68e215743ba55eb82ad03b463879586d68b5` (post PR #44).
Supabase verificato esclusivamente in lettura: `PonteNext`,
`uhxfpsamenjhyrfgwckw`. Nessuna operazione su Vercel o invio email.

Sono stati letti integralmente i documenti Markdown in `docs`, il testo dei tre
manuali DOCX, le migration e i seed, e analizzati route, form, componenti,
service, action, validazioni e guard esistenti. I report storici descrivono le
rispettive milestone: non sostituiscono la verifica dello stato corrente.

Riferimenti: [Database](DATABASE_DESIGN.md), [regole business](BUSINESS_RULES.md),
[ADR](ADR-001_ARCHITECTURE.md), [UI](UI_GUIDELINES.md),
[responsive](RESPONSIVE_RULES.md), [brand](BRAND_UI_GUIDELINES.md),
[hardening](M9_HARDENING_REPORT.md), [backup](MIGRATION_AND_BACKUP.md).

## 1. Obiettivo e terminologia

Configurare presentazione e compilazione dei campi delle schermate esistenti,
senza cambiare il significato dei dati, le regole di business o le autorizzazioni
necessarie alle operazioni. La configurazione iniziale e' globale.

| Termine | Definizione |
| --- | --- |
| Schermata | Contesto operativo: pagina, elenco, dettaglio o form incorporato. Non necessariamente una route distinta. |
| `screen_key` | Identificatore stabile nel codice, ad esempio `members.create`; indipendente da URL, etichette e lingua. |
| Campo | Informazione di business mostrata o raccolta nella schermata. Non coincide necessariamente con una colonna SQL. |
| `field_key` | Identificatore stabile del campo all'interno della schermata, normalmente `snake_case`; non deriva dalla label. |
| `editable` | Visibile e modificabile, se l'operazione e il ciclo di vita del record consentono la modifica. |
| `readonly` | Visibile, non modificabile; valore autorevole ricostruito o verificato sul server. |
| `hidden` | Non mostrato e non trasmesso al client in quella schermata; nessuna cancellazione implicita del valore salvato. |
| Policy globale | Override valido per tutti gli admin attivi per una coppia schermata/campo. |
| Futura policy per permission group | Override associato a un gruppo di autorizzazioni degli amministratori; non operativo in M10. |
| Default nel codice | Stato definito dal registro versionato, utilizzato quando la lettura delle policy riesce e non esiste un override attivo. |
| Override nel database | Eccezione al default; non definisce nuovi campi o nuove schermate. |

`roles` e `member_roles` descrivono ruoli associativi dei soci: **non sono
permission group**. `admin_users.role` continua a distinguere `admin` e
`super_admin`; i soci non acquisiscono un account.

Un campo nascosto in `members.edit` puo' restare visibile in `members.detail`
o in un report. La configurazione e' per schermata, non una classificazione
globale di riservatezza. Non equivale a consenso email, cancellazione dati,
autorizzazione record-level o autorizzazione a eseguire un'azione.

## 2. Scope M10 e route definitiva

La futura implementazione comprende:

- registro centralizzato e tipizzato di schermate e campi supportati;
- override globali persistenti, soft delete e vincoli di configurazione;
- resolver unico, proiezione dei dati mostrabili e controllo delle scritture;
- pagina Impostazioni con modifica riservata ai `super_admin` attivi;
- integrazione progressiva nelle schermate censite, senza nuovi CRUD business;
- contratto estendibile ai permission group, non ancora attivabile;
- test di configurazione, conservazione dei dati, sicurezza e regressione.

**Route definitiva: `/settings/field-visibility`.** E' coerente con
`/settings/roles` e `/settings/membership-plans` e distingue la gestione delle
policy dalla creazione di campi custom, che non e' prevista. Non introdurre un
alias `/settings/fields`. Aggiungere il collegamento dalla pagina Impostazioni;
non occorre moltiplicare le voci della navigazione principale.

Un admin attivo puo' consultare la pagina in sola lettura. Solo il super_admin
attivo puo' salvare e ripristinare i default. Nessuna modifica ad Auth, provider,
variabili ambiente o hosting e' necessaria per questa proposta.

### 2.1 Evidenze di partenza

Il codice usa Next.js App Router, Server Components, Server Actions,
`useActionState`, FormData e validazioni TypeScript dedicate. **Non e' presente
Zod** nelle dipendenze attuali: mantenere le validazioni esistenti; non imporre
una migrazione generale dei form a una nuova libreria. Qualsiasi futura adozione
di Zod dovra' preservare le stesse regole e non sostituire i vincoli database.

Gli helper dei form convertono frequentemente un valore assente in `null` o
`false`. Molti aggiornamenti inviano l'intero oggetto validato. Disabilitare o
rimuovere soltanto l'input puo' quindi sovrascrivere dati: serve modificare il
contratto di serializzazione e aggiornamento, non soltanto lo stile dei campi.

Alcune pagine si affidano al layout protetto, al middleware e alle RLS; le pagine
piu' recenti chiamano anche `requireActiveAdmin` esplicitamente. In ogni ingresso
server coinvolto da M10 la guard dovra' precedere fetch sensibili e policy.
Non assumere che il layout serializzi l'esecuzione di tutti i suoi figli.

### 2.2 Snapshot Supabase in sola lettura

Progetto `PonteNext`, stato `ACTIVE_HEALTHY`, regione `eu-central-1`, PostgreSQL
`17.6.1.127`. Cataloghi, colonne, vincoli, funzioni, policy e migration sono
stati letti tramite MCP; nessuna scrittura, nemmeno una prova con rollback.

| Versione live | Migration applicata |
| --- | --- |
| `20260606113953` | `001_extensions` |
| `20260606114014` | `002_admin_users` |
| `20260606115133` | `003_harden_admin_functions` |
| `20260606124849` | `004_members_roles` |
| `20260606221810` | `005_membership_plans` |
| `20260606221954` | `006_memberships_payments` |
| `20260607132737` | `007_sponsors` |
| `20260607164703` | `008_events` |
| `20260607164732` | `009_sponsor_contributions` |
| `20260607195558` | `010_email` |

Le 14 tabelle pubbliche presenti hanno RLS attiva: `admin_users`, `members`,
`roles`, `member_roles`, `membership_plans`, `memberships`, `payments`,
`sponsors`, `sponsor_contributions`, `events`, `event_sponsors`,
`email_templates`, `email_campaigns`, `email_campaign_recipients`.
Non esistono `ui_field_policies`, tabelle permission group o `audit_logs`.

Le 13 tabelle business hanno policy SELECT/INSERT/UPDATE per admin attivi;
`admin_users` ha la policy SELECT che ammette la propria riga o un admin attivo.
Non risultano policy DELETE. `app_private.is_active_admin()` e'
`SECURITY DEFINER` con `search_path = ''`; `public.set_updated_at()` ha
`search_path = ''`. Non esiste ancora un helper `is_super_admin()`.

Attenzione: assenza di policy DELETE non significa assenza di grant DELETE.
Il catalogo mostra grant estesi, comprendenti DELETE/TRUNCATE, alle utenze
tecniche su tabelle esistenti. Non sono stati alterati o provati. Per la nuova
tabella prevedere esplicitamente privilegi minimi e verificare i grant effettivi,
senza estendere M10 a una revisione indiscriminata delle tabelle business.

Le migration locali `011`-`014` sono placeholder di funzionalita' previste, non
migration live da applicare automaticamente. La futura migration M10 potra'
chiamarsi `015_ui_field_policies`, dopo ricontrollo della numerazione: non viene
creata qui e non deve riscrivere le migration `001`-`010` o eseguire placeholder.

## 3. Schermate configurabili

Le chiavi seguenti sono il perimetro proposto. Le colonne e i campi mostrati in
liste/dettagli ammettono solo `readonly`/`hidden`, quando configurabili: non
introdurre editing inline per giustificare lo stato `editable`.

| Route esistente | `screen_key` proposte | Decisione |
| --- | --- | --- |
| `/members` | `members.list` | Colonne business opzionali, stessa policy per tabella e card mobile. |
| `/members/new` | `members.create` | Form anagrafico. |
| `/members/[id]/edit` | `members.edit` | Form anagrafico. |
| `/members/[id]` | `members.detail`, `member_roles.list`, `member_roles.create` | Sezioni anagrafiche e assegnazione ruolo incorporata. |
| `/settings/roles` | `roles.list`, `roles.create`, `roles.edit` | Creazione/modifica incorporata, anche tramite `?edit=...`. |
| `/settings/membership-plans` | `membership_plans.list`, `membership_plans.create`, `membership_plans.edit` | I piani esistono gia': includerli per non lasciare un form Impostazioni senza classificazione. |
| `/memberships` | `memberships.list` | Colonne opzionali; identita', periodo e stati derivati restano riconoscibili. |
| `/memberships/new` | `memberships.create` | Un'unica policy anche per rinnovo e rinnovo rapido, senza vie alternative piu' permissive. |
| `/memberships/[id]` | `memberships.detail`, `payments.list`, `payments.create` | Pagamenti incorporati e storico. |
| `/expirations` | `expirations.list` | Soltanto colonne opzionali realmente presenti; periodo, scadenza, socio e azione rinnovo restano fissi. |
| `/sponsors`, `/sponsors/new`, `/sponsors/[id]/edit` | `sponsors.list`, `sponsors.create`, `sponsors.edit` | Campi business. |
| `/sponsors/[id]` | `sponsors.detail`, `sponsor_contributions.list`, `sponsor_contributions.create`, `sponsor_contributions.edit` | Contributi incorporati, anche con `?editContribution=...`. |
| `/events`, `/events/new`, `/events/[id]/edit` | `events.list`, `events.create`, `events.edit` | Campi business. |
| `/events/[id]` | `events.detail`, `event_sponsors.list`, `event_sponsors.create`, `event_sponsors.edit` | Collegamenti incorporati, anche con `?editSponsor=...`. La lista contributi usa la stessa policy `sponsor_contributions.list`. |
| `/email/templates` | `email_templates.list`, `email_templates.create`, `email_templates.edit` | Form incorporati, modifica tramite `?edit=...`. |
| `/email/campaigns` | `email_campaigns.list`, `email_campaigns.create`, `email_campaigns.edit`, `email_campaigns.detail` | Modifica solo delle bozze; dettaglio selezionato tramite `?campaign=...`. Nessuna nuova route email. |
| `/reports` | `reports.filters` | Solo filtri consentiti per il tipo report; applicazione identica in preview e `/reports/export`. |

Escludere `/login`, redirect `/`, shell/header/menu, dashboard operativa,
overview `/email`, landing `/settings` e la stessa pagina di configurazione:
sono navigazione, sicurezza o informazioni aggregate, non form da disabilitare.
Escludere azioni archivia/rinnova/invia/esporta, conferme di sicurezza,
paginazione e controlli di autenticazione. Le policy dei campi non autorizzano
o revocano queste operazioni.

**Non registrare `memberships.edit` o `payments.edit`: non esistono tali form o
service nel prodotto attuale.** Non aggiungerli per completare un elenco teorico.
L'assegnazione di ruoli ha creazione e azioni di fine/archiviazione, non un nuovo
editor generico `member_roles.edit`.

### 3.1 Inventario iniziale dei campi

I nomi sotto sono chiavi concettuali del registro, normalmente allineate alle
colonne. Il mapping verso nomi FormData camelCase resta esplicito negli adapter.
Ogni schermata registra solo i campi che gia' usa: questa tabella non richiede
di aggiungere colonne alle liste o informazioni ai dettagli.

| Famiglia | Campi e restrizioni da registrare |
| --- | --- |
| `members.*` | `first_name`, `last_name`, `country`, `status` obbligatori; `email`, `phone`, `birth_date`, `fiscal_code`, `address`, `city`, `postal_code`, `province`, `profession`, `notes` opzionali. Status e' anagrafico, non associativo. |
| `roles.*` | `name` obbligatorio; `description` opzionale; `is_default` e `sort_order` non null con default da verificare sul server. Nessuna relazione con permessi admin. |
| `member_roles.*` | Selettore `role_id`, `start_date`, `end_date`, `notes`; ruolo e inizio obbligatori, socio fissato dal dettaglio. La terminazione del ruolo resta un'azione business. |
| `membership_plans.*` | `name`, `minimum_fee`, `default_duration_months`, `sort_order`, `is_active` non null; `description` opzionale. Non cambiare minimo quota o durata tramite una policy. |
| `memberships.*` | Selettore `member_id`, selettore `membership_plan_id` opzionale, `start_date`, `end_date`, `minimum_fee`, `expected_fee`, `notes`. `notes` necessarie quando quota prevista zero; nessuna modifica dello storico per un rinnovo. |
| `payments.*` | `payment_date`, `amount`, `method` obbligatori; `reference`, `notes` opzionali; iscrizione fissata dal contesto. |
| `sponsors.*` | `company_name`, `status` obbligatori; `contact_name`, `email`, `phone`, `website`, `address`, `city`, `vat_number`, `fiscal_code`, `notes` opzionali. Gli identificativi fiscali anagrafici gia' presenti non introducono contabilita'. |
| `sponsor_contributions.*` | `contribution_date`, `contribution_type`, `amount` non null; `description` condizionalmente obbligatoria; selettore `event_id` opzionale e `notes`. Sponsor fissato dal contesto. |
| `events.*` | `name`, `start_datetime`, `status` obbligatori; `end_datetime`, `description`, `location`, `notes` opzionali. Usare i nomi canonici delle date. |
| `event_sponsors.*` | Selettore `sponsor_id` obbligatorio, `sponsorship_level`, `notes` opzionali; evento fissato dal contesto. |
| `email_templates.*` | `name`, `subject`, `body`, `audience`, `is_active`; campi non null. Le validazioni sul contenuto restano vincolanti. |
| `email_campaigns.*` | Selettore `template_id` opzionale; `subject`, `body`, `audience_type` obbligatori; modifica limitata al draft. Subject/body effettivi e destinatari devono restare verificabili prima dell'invio. |
| `reports.filters` | Mapping esplicito di ricerca `q`, `status`, `membershipStatus`, `paymentStatus`, `paymentMethod`, `contributionType`, `audienceType`, `dateFrom`, `dateTo`. Chiavi stabili proposte: `query`, `status`, `membership_status`, `payment_status`, `payment_method`, `contribution_type`, `audience_type`, `date_from`, `date_to`. |

Nei report mantenere fissi il selettore `reportType`, l'inclusione degli
archiviati e `expirationWindow` quando applicabile: identificano perimetro e
intenzione dell'estrazione. I filtri configurabili compaiono solo nei report che
gia' li supportano. Una policy non abilita filtri non previsti da
`reportDefinitions` e non cambia le colonne dei file esportati.

Escludere dal catalogo modificabile ID tecnici, FK di contesto non mostrate,
`created_at`, `updated_at`, `archived_at`, autore, provider ID, chiavi Auth,
lock, token, campi audit e valori runtime. I selettori socio/ruolo/piano/evento
realmente mostrati sono invece campi business, anche se il valore e' una FK:
continuano a richiedere verifica server dell'entita' selezionata.

`paid_amount`, `payment_status`, stati derivati delle iscrizioni e stati di
invio restano gestiti da trigger o workflow e non diventano editabili.
Le date tecniche possono rimanere visibili dove gia' utili, senza essere
configurabili. Identita' minima del record, indicatori indispensabili alle
azioni e riepilogo di conferma email restano fissi.

## 4. Regole per editable, readonly e hidden

| Stato | UI e dati verso il browser | Scrittura sul server |
| --- | --- | --- |
| `editable` | Controllo visibile, abilitato solo se consentito dal workflow. | Accettare solo campi in allowlist, validati con le regole business. |
| `readonly` | Valore visibile in testo o controllo non modificabile; non reinviarlo come fonte autorevole. | In modifica usare il valore corrente; rifiutare una variazione manomessa. In creazione usare solo un default server ammesso. |
| `hidden` | Nessun input, valore, prop serializzata, attributo, hidden input, errore con valore o cella mobile/desktop contenente quel dato. | Rifiutare un campo nascosto inviato manualmente; preservare il valore esistente. In create applicare null o default server compatibile con i vincoli. |

L'assenza di un campo NON equivale a un comando di cancellazione. Il clear di
un valore opzionale e' possibile solo da un campo editable, con semantica
esplicita gia' prevista dal form. Non applicare `disabled` indiscriminatamente
a un form esistente aspettandosi che gli attuali mapper preservino i dati.

Una pagina Server Component deve filtrare prima di renderizzare o passare
oggetti ai Client Components: `display:none` e la sola condizione JSX client
non proteggono il payload RSC. Anche option list, anteprime e messaggi errore
devono usare DTO minimi. Un selettore non deve ricevere l'intera anagrafica.

I campi readonly in creazione senza un valore opzionale possono essere
mostrati vuoti, ma non creare falsi default dal testo del placeholder.
Nel riepilogo Impostazioni spiegare che tale scelta non raccogliera' un dato.

## 5. Campi obbligatori, default e dipendenze

Regole invarianti, applicate sia dalla UI Impostazioni sia dal server:

1. Un campo obbligatorio non puo' essere hidden, anche se il database ha un default.
2. In creazione e' editable, salvo default certo applicato sul server che consenta readonly.
3. In modifica puo' essere readonly; il valore esistente non viene reinviato come autorita'.
4. Un default presente solo nel JSX o nello stato React non soddisfa il requisito.
5. Un default deve essere valido per tutti i record/contesti coperti dalla policy.
6. Una configurazione che rende impossibile un record valido viene rifiutata atomicamente.

| Caso attuale | Decisione per il piano |
| --- | --- |
| Nome/cognome socio, ragione sociale, nome ruolo/evento | Create solo editable; nessun default inventato. Edit readonly ammesso. Hidden mai. |
| Paese socio | Il server gia' prevede `Italia`: readonly create ammissibile solo mantenendo quella funzione di default e i test. Hidden no. |
| `sort_order` e booleani dei form Impostazioni | Definire il default per operazione nel registro server; non usare il valore false ottenuto accidentalmente da un checkbox omesso. Hidden no se obbligatori. |
| Status anagrafico/evento, audience template, metodo pagamento | I default UI o SQL non bastano se l'action richiede il valore: inizialmente create solo editable; readonly solo dopo aver implementato e testato il default server specifico. |
| Data pagamento/contributo | Readonly create possibile con il default server corrente, con data/fuso deterministici. Importo monetario senza default positivo resta editable. |
| Inizio ruolo e inizio evento | Il valore iniziale client non e' un default server garantito: create editable. |
| Quota e durata piano | Il valore iniziale 30/12 del form non autorizza readonly: create editable finche' manca un default server esplicito e valido. |
| Quota prevista zero | Le note iscrizione diventano obbligatorie. Per M10 mantenerle editable in create per tutte le scelte di quota, non nasconderle in base alla quota iniziale. |
| Contributo goods/service/other | Description obbligatoria. Per M10 mantenerla editable nei form create/edit che permettono il cambio tipo; una policy fissa piu' permissiva renderebbe alcuni casi invalidi. |
| Contributo money | Amount maggiore di zero. Il default zero valido per contributi non monetari non e' un default universale: create amount editable. |
| Campagna custom/manuale | Inserimento destinatari e conferma di invio restano controlli del workflow non configurabili; non nascondere un requisito di sicurezza. |

Aggiungere al registro `required_when` e dipendenze solo come contratto
tipizzato, riusando regole business, non espressioni arbitrarie salvate nel DB.
`allowed_states` puo' essere piu' restrittivo del caso generale, con motivazione.
Inizialmente bloccare configurazioni condizionali non dimostrate sicure.

Date fine/inizio, quota minima/prevista, piano/importi e tipo/descrizione vanno
validati sull'oggetto completo ricostruito. Un end_datetime nascosto gia'
salvato non si cancella cambiando start_datetime: una coppia incoerente viene
rifiutata con errore comprensibile senza rivelare il valore nascosto.

Rinnovo normale e rapido condividono `memberships.create`: sempre nuova riga.
Eventuali default di rinnovo devono essere calcolati dal server da sorgente e
piano verificati, non fidandosi di query string o campi hidden. Non generalizzare
un default valido per rinnovo a tutte le nuove iscrizioni. Non sono previste
policy per modificare retroattivamente una membership.

## 6. Registro centralizzato nel codice

File proposto: `src/config/field-policy-registry.ts`, registro puro, tipizzato,
versionato con `registry_version`. Nessuna creazione di questo file nella fase
di piano. Componenti React PascalCase.tsx; helper/config secondo convenzioni
esistenti. Nessuna nuova dipendenza richiesta dalla progettazione.

| Metadato | Funzione |
| --- | --- |
| `screen_key`, `field_key`, `module` | Identita' e raggruppamento stabili, union TypeScript derivabile. |
| `label`, `description`, `display_order` | Presentazione curata nel codice, non modificabile dalla UI. |
| `field_type` | Testo, email, data, numero, booleano, selezione, contenuto email ecc. |
| `is_required`, `required_when` | Obbligo incondizionato o regola condizionale server. |
| `configurable`, `allowed_states` | Opzioni ammesse per quella schermata, non un generico toggle per ogni colonna. |
| `default_state` | Editable nei form; readonly negli elenchi/dettagli; eccezioni gia' presenti preservate. |
| `operation`, `dependencies` | Create/update/display/filter e dipendenze di validazione. |
| `default_provider` | Riferimento a funzione server certa, oppure nessuno; non valore letto dal browser. |
| `integration_status` | Schermata realmente integrata: non attivare override su un modulo ancora senza enforcement. |

Tenere mapping DB/FormData, default provider e adapter di scrittura in moduli
server-only separati dal sottoinsieme serializzabile delle label/stati. La UI
riceve metadati sicuri, stato risolto e motivazioni, mai record completi nascosti.

Il registro e' l'unica fonte dei campi supportati. Il DB non e' un catalogo di
campi liberamente inseribili. Ogni chiave nasce con adapter, proiezione, regole
e test; nessuna configurazione arbitraria o SQL dinamico basato su field_key.

Le action rifiutano chiavi sconosciute. Per impedire anche l'inserimento diretto
di override inventati, prevedere nella futura migration una funzione di
validazione/allowlist SQL derivata dal registro e verificata da test di parita'.
E' un artefatto compilato/revisionato, non una seconda fonte manuale o una
tabella catalogo modificabile. Copre coppie valide, stati consentiti, requisiti
statici e schermate abilitate. La logica condizionale completa resta condivisa
nelle validazioni server, con restrizioni conservative nel catalogo SQL.

Variazioni di chiavi o stati ammessi richiedono incremento versione, test di
parita' e gestione esplicita degli override preesistenti. Non rinominare una
chiave a seguito di una semplice modifica alla label. Chiavi deprecate non
devono diventare silenziosamente nuove configurazioni permissive.

## 7. Modello dati proposto

Nome scelto: **`public.ui_field_policies`**. Il prefisso UI chiarisce il perimetro
di presentazione/interazione e non promette un sistema completo di permessi.
L'enforcement delle action rimane comunque obbligatorio. Evitare il nome
generico `permissions`, che confonderebbe questo registro con l'autorizzazione.

| Campo | Proposta e vincoli |
| --- | --- |
| `id` | UUID, PK, generazione server/database. |
| `screen_key` | Text non null, chiave registrata, immutabile dopo inserimento. |
| `field_key` | Text non null, appartiene alla schermata, immutabile. |
| `state` | Text non null con CHECK: editable, readonly, hidden. |
| `scope_type` | Text non null, vocabolario global/permission_group, default global. |
| `scope_id` | UUID nullable: null per global; obbligatorio per permission_group. |
| `updated_by` | UUID non null, FK verso admin_users con cancellazione fisica vietata/RESTRICT; autore ricavato da auth.uid(), non da input libero. |
| `created_at`, `updated_at` | Timestamptz non null, default e trigger coerenti con le migration esistenti. |
| `archived_at` | Timestamptz nullable, soft delete dell'override. |

In M10 aggiungere anche un vincolo di attivazione che consenta **solo global**.
I campi e il vocabolario predisposti per permission_group non consentono ancora
inserimenti operativi, nemmeno via API diretta. In futuro rimuovere quel vincolo
solo insieme a FK sul gruppo, assegnazioni, RLS e resolver aggiornati. Non creare
oggi una tabella gruppi o una FK verso una tabella inesistente.

Unicita' proposta: due indici univoci parziali sui soli override non archiviati:

- global: coppia `(screen_key, field_key)` dove scope global e archived_at null;
- permission_group: terna `(screen_key, field_key, scope_id)` dove scope
  permission_group e archived_at null.

Il CHECK di scope garantisce la nullabilita' corretta. Non usare la sola
UNIQUE a quattro colonne con scope_id nullable: il comportamento ordinario
dei NULL consentirebbe duplicati globali. PostgreSQL 17 supporta anche
`NULLS NOT DISTINCT`, ma i due indici separati rendono espliciti i due casi.
Riferimento: [unicita' PostgreSQL 17](https://www.postgresql.org/docs/17/indexes-unique.html).

L'indice global copre le letture per schermata; misurare prima di aggiungere
indici duplicati. Considerare l'indice FK `updated_by` nel controllo advisor.
Nessun seed di override: tabella inizialmente vuota equivale al comportamento
attuale del registro. Non rieseguire seed di ruoli o piani per questa milestone.

Salvare un valore uguale al default archivia l'override attivo; un successivo
override crea una nuova riga, senza riattivare arbitrariamente quelle archiviate.
Reset archivia soltanto override della schermata/scope selezionati. Non tocca
record business. `updated_by` identifica l'ultimo autore, non e' un audit log
completo di ogni modifica; non promettere uno storico che il modello non salva.

### 7.1 Salvataggio atomico e concorrenza

Un salvataggio per schermata deve essere tutto-o-niente, compreso reset.
Proporre una RPC dedicata, invoker e soggetta a RLS, con controlli espliciti di
super_admin, registry_version e allowlist. Niente chiamate indipendenti per
ciascun campo che possano lasciare una configurazione parzialmente applicata.

La richiesta contiene modifiche della schermata, versione del registro e
revisione attesa dello snapshot policy. La revisione puo' essere un hash
deterministico delle righe/versioni, senza un'altra tabella. La RPC serializza
le scritture per schermata/scope con lock transazionale e verifica la revisione
prima di scrivere; un conflitto richiede ricaricamento, non last-write-wins.
Tutti i percorsi di scrittura devono rispettare lo stesso protocollo; un trigger
di controllo protegge identita', autore, scope e validita' anche da accessi
diretti. Se non e' possibile garantire questo contratto con grant diretti,
limitare la mutazione alla RPC dedicata con privilegi strettamente circoscritti.

I campi esclusi dalla ricerca UI restano nello snapshot: salvare un elenco
filtrato non deve resettare campi non visualizzati. La chiave schermata e'
validata contro il registro, mai interpolata in SQL.

## 8. Predisposizione permission group

Contratto futuro di risoluzione per ogni campo:

1. Considerare gli override attivi dei gruppi effettivi dell'admin.
2. Se almeno un gruppo ha un override, scegliere il piu' restrittivo:
   `hidden > readonly > editable`.
3. Se nessun gruppo ha un override, usare global.
4. Se manca anche global, usare il default del registro.

Un gruppo senza override non aggiunge implicitamente un editable. La regola
evita che l'aggiunta di un secondo gruppo allarghi accidentalmente i permessi
rispetto a un gruppo gia' restrittivo. La precedenza gruppo/global e' distinta
dal confronto tra gruppi: un futuro override di gruppo potra' differire dal
global; le invarianti dei campi obbligatori continuano sempre a prevalere.

In M10 il resolver riceve un contesto admin verificato, ma non carica o inventa
appartenenze a gruppi. Nessun CRUD gruppi, assegnazione, selettore gruppi o
policy operative permission_group. Testare il contratto futuro come funzione
pura, non simulare gruppi attivi nel database di produzione.

Le autorizzazioni reali continuano nei guard, service/action e RLS. Un utente
non admin resta escluso anche se ogni campo fosse editable. Un super_admin
che usa un normale form segue la stessa policy globale degli altri admin;
puo' modificarla nella pagina dedicata, non aggirarla implicitamente nel form.

## 9. Autorizzazioni della pagina Impostazioni

Prima di caricare policy: `requireActiveAdmin`, sessione Supabase del chiamante.
Prima di save/reset: controllo super_admin sul record admin attuale, inclusi
`status = active` e `archived_at IS NULL`, ripetuto lato database.
Non fidarsi di ruolo spedito dal client o di metadata Auth modificabili.

Prevedere un helper applicativo server `requireSuperAdmin` coerente con quello
esistente, non ancora presente. Revoca o archiviazione successiva all'apertura
pagina deve bloccare il salvataggio. L'admin ordinario vede configurazione e
stati effettivi ma non controlli editabili; la manomissione della request deve
comunque fallire.

SELECT delle policy solo per admin attivi, INSERT/UPDATE solo per super_admin
attivi, nessuna policy pubblica/anonima/DELETE. Usare session client, non service
role per superare RLS. Dettagli SQL nella sezione 15.

## 10. UI della pagina Impostazioni

Layout coerente con Brand Refresh: shell scura gia' esistente, contenuto chiaro,
accento rosso, testo leggibile. Nessun restyling trasversale o nuova dipendenza.

- Intestazione compatta e dicitura **Configurazione globale**.
- Modulo e schermata selezionabili; filtri di navigazione non creano policy.
- Ricerca su label/descrizione, conteggio risultati, elenco nell'ordine del registro.
- Ogni riga: label, obbligatorio/opzionale/condizionale, default, override attivo
  oppure "Usa predefinito", stato effettivo e motivo di eventuali limitazioni.
- Controllo accessibile a tre stati: "Visibile e modificabile", "Solo visibile",
  "Nascosto". Nei contesti di sola lettura editable e' disabilitato.
- Radio group/controllo segmentato con testo e icone lucide Pencil, Eye, EyeOff
  solo come supporto; non affidare il significato al colore.
- Opzioni non consentite disabilitate con motivazione associata; invarianti
  comunque ricontrollate sul server. Campi non configurabili restano spiegati
  ma fuori dall'insieme salvabile.
- Salva per schermata; conferma con riepilogo delle sole modifiche e indicazione
  che la policy non cancella valori o revoca permessi globali sui dati.
- Reset con conferma: archivia soltanto gli override della schermata. Opzione
  di ritorno al default anche per il singolo campo, senza DELETE fisico.
- Evidenza modifiche non salvate; conferma prima di cambiare schermata/modulo
  o lasciare la pagina tramite navigazione gestita. `beforeunload` best effort,
  senza promettere dialoghi garantiti su tutti i browser mobile.
- In salvataggio prevenire doppio submit; su errore conservare il draft locale;
  su conflitto richiedere confronto/ricaricamento della versione aggiornata.

Desktop: tabella compatta o righe allineate, senza card annidate. Mobile: righe
verticali con controlli che vanno a capo, label complete e touch target adeguati.
Non introdurre una tabella larga che costringa a scroll orizzontale. L'azione
finale deve restare raggiungibile sopra la toolbar Safari, conservando lo
spazio inferiore dello shell e lo scroll verticale unico gia' corretti.

Empty state distinti: nessuna schermata integrata nel modulo, nessun risultato
di ricerca, nessun override (default attivi). Un errore di caricamento non e'
un empty state: bloccare save e proporre riprova. Nessun selettore gruppi.

## 11. Resolver centralizzato e proiezione

Contratto concettuale: `resolveFieldPolicy({ screenKey, fieldKey, adminContext })`.
Il contesto admin e' ottenuto dalla guard; non e' input fidato del browser.
La funzione risolve in memoria usando un set gia' caricato per la richiesta.

Separazione proposta dei file futuri: `src/services/field-policies.service.ts`
per letture/salvataggi autorizzati, `src/utils/field-policy-resolver.ts` per la
risoluzione pura e tipi dedicati in `src/types/field-policy.ts`. Pagina e action
restano sotto `src/app/(admin)/settings/field-visibility`; componenti
`FieldPolicySettingsForm.tsx` e `FieldPolicyStateControl.tsx` nella cartella
settings. Riutilizzare componenti base esistenti. Gli adapter di scrittura
restano vicini ai service dei moduli: non introdurre un ORM generico o un
service che aggiorna tabelle arbitrarie in base alle chiavi ricevute.

Flusso previsto:

1. Guard e verifica della versione del registro supportata.
2. Raccolta delle screen_key necessarie: una pagina dettaglio puo' avere piu' form.
3. Una lettura degli override globali attivi per l'insieme di schermate.
4. Validazione righe contro registro, scope e stati ammessi.
5. Risoluzione di una mappa di stati, origine default/override e revisione.
6. Proiezione server dei soli campi visibili e metadati necessari alla UI.
7. Riutilizzo della mappa per tutti i componenti della richiesta.

Nessuna query per campo. Il resolver puro non istanzia un nuovo client Supabase
per ogni chiamata. Separare la lettura server, la funzione pura di precedenza,
la proiezione display e gli adapter di input, senza duplicare regole per modulo.

Fallback sicuro:

- lettura riuscita e nessun override: default del registro;
- override archiviato: ignorato;
- screen/field richiesto non registrato: errore di programmazione/configurazione,
  non editable implicito;
- errore DB o override attivo incompatibile: bloccare la schermata interessata
  o l'azione, con errore generico e diagnostica senza valori personali;
- versione incompatibile dopo deploy: chiedere ricaricamento e impedire scritture;
- chiavi deprecate: gestione esplicita in aggiornamento registro, non conversione
  automatica in altri campi. Le righe archiviate non condizionano il rendering.

Un errore di lettura non equivale a tabella vuota. Questo evita di riaprire
campi bloccati proprio durante un guasto delle policy.

## 12. Enforcement server-side

### 12.1 Contratto comune delle action

Ogni operazione associa sul server la propria screen_key: il client non puo'
scegliere `members.create` per aggirare `members.edit`. Parametri tecnici e
identificativi del record sono validati separatamente, con i controlli di
contesto gia' presenti. Nessun mass assignment da FormData o JSON alle colonne.

Sequenza obbligatoria:

1. Guard attiva, permessi dell'operazione e stato del record.
2. Policy fresca e confronto con la revisione presentata dal form. Se cambiata,
   nessuna scrittura e messaggio "Configurazione aggiornata, ricarica il modulo".
3. Parse del contenitore request con allowlist esplicita; separare i metadata
   tecnici previsti da Next.js dai campi business. Rifiutare campi business ignoti.
4. Rifiutare ogni valore hidden inviato, anche vuoto, e ogni tentativo di cambiare
   readonly. Il form normale omette entrambi. Eventuale compatibilita' con un
   readonly reinviato richiede confronto canonico e non lo rende autorevole.
5. In create ricostruire default/null server-side per campi non editabili.
6. In update leggere il record corrente e ricostruire il candidato completo
   per la validazione usando valori attuali per readonly/hidden/tecnici.
7. Eseguire le validazioni business esistenti e quelle incrociate; nessun bypass
   perche' un controllo non e' visibile. RLS e vincoli DB rimangono attivi.
8. Scrivere una patch contenente soltanto colonne editable consentite e realmente
   interessate. Non rispedire tutto il record ricostruito per la validazione.
9. Restituire DTO ed errori filtrati, senza echo di campi nascosti o dettagli SQL.

Separare quindi **candidato completo per validare** e **patch per aggiornare**.
Questo evita anche di sovrascrivere modifiche concorrenti a campi nascosti e di
attivare inutilmente trigger `UPDATE OF` su FK non modificate. Se una validazione
incrociata dipende dal record letto, mantenere i vincoli DB e prevedere confronto
di versione/updated_at per rifiutare un aggiornamento basato su dati superati.

Creazione: hidden opzionale e nullable usa null, oppure il default dichiarato;
non un valore arbitrario inviato dal client. Readonly obbligatorio usa il default
certo della sezione 5. Booleani, date e selezioni richiedono adapter dedicati:
l'assenza di un checkbox non significa false se il campo non e' editable.

Quando un campo nascosto rende incoerente la modifica di un altro, usare un
messaggio di incompatibilita' con la configurazione e una procedura di revisione
per super_admin; non esporre il valore nascosto nell'errore. Le combinazioni
prevedibilmente impossibili vanno gia' bloccate al salvataggio delle policy.

### 12.2 Confine delle garanzie

M10 deve garantire readonly/hidden negli ingressi applicativi Next.js, nei
service/action e nei payload delle schermate integrate. **Le RLS attuali sono
per riga e consentono agli admin attivi aggiornamenti business: non applicano
di per se' restrizioni per campo.** Un admin che chiama direttamente la Data API
con la propria sessione ha ancora i diritti DB previsti dalle policy esistenti.

Non presentare quindi hidden come protezione assoluta del dato rispetto a
quell'admin o readonly come divieto SQL universale. Per usare in futuro queste
policy come autorizzazioni di colonna servira' un progetto aggiuntivo: accesso
a scritture tramite RPC controllate o enforcement DB, proiezioni di lettura e
privilegi coerenti su tutti i canali. La semplice presenza di permission_group
nello schema non soddisfa quel requisito. Se viene richiesto questo livello
di protezione gia' in M10, rivedere il piano prima dell'implementazione.

Riferimento: [Supabase RLS e privilegi](https://supabase.com/docs/guides/database/postgres/row-level-security).
Nessuna service role deve essere introdotta per aggirare questi controlli.

## 13. Compatibilita' e rollout progressivo

| Modulo | Impatto e regressioni da prevenire |
| --- | --- |
| Members | Sostituire update completo con patch, proiettare dettagli/lista/opzioni, preservare campi opzionali e validazioni anagrafiche. |
| Roles / member_roles | Non confondere ruoli soci con gruppi permessi; preservare unicita', periodi e azioni di fine assegnazione. |
| Membership plans | Preservare minimi, durata, attivazione e ordinamento; default UI non diventano automaticamente default server. |
| Memberships | Nessun editor dello storico; nuova riga per ogni rinnovo, stessi controlli su creazione normale e rapida, note per quota zero. |
| Payments | Solo create/list e archiviazione esistenti; importo valido, trigger paid_amount/payment_status invariati. Nessuna nuova contabilita'. |
| Sponsors | Patch anagrafica, email/website validi, archiviazione separata dalle policy dei campi. |
| Sponsor contributions | Money > 0, non monetario >= 0 e description richiesta. event_id nascosto su record esistente si conserva; non scollegare eventi implicitamente o riscrivere FK immutate. |
| Events / event_sponsors | Date canoniche coerenti, sponsor validi, evento senza sponsor ammesso; relazione e contributo evento restano distinti. |
| Email templates | Campi necessari al template sempre validi. Nessun cambio Resend o salvataggio di segreti. |
| Email campaigns | Edit solo draft; preview, snapshot, deduplica e conferma restano obbligatori. Hidden non elimina consensi, non implica opt-out e non avvia invii. |
| Reports | Policy filtri condivisa tra GET preview e POST export; rimozione degli hidden input relativi a campi policy-hidden, default server espliciti e RLS invariata. |

Nei report una richiesta con un filtro diventato hidden va rifiutata prima
della query, non eseguita ignorandolo e ampliando silenziosamente l'estrazione.
Una nuova preview usa i default server previsti e mostra il perimetro effettivo.
Date from/to sono validate insieme, cosi' come i filtri specifici per tipo.
I campi nascosti in un'anagrafica non vengono automaticamente rimossi da CSV/XLSX:
le colonne export non sono configurabili in M10. Il limite attuale di 5.000 righe
e la preview fino a 10 righe restano invariati.

Gli usi server legittimi di un dato restano validi: ad esempio nascondere email
in un form socio non deve cancellarla, disiscrivere il destinatario o cambiare
la segmentazione. I dati non vengono pero' serializzati nella schermata che
li nasconde. I workflow email devono continuare a mostrare la propria anteprima
obbligatoria; non consentire una campagna "alla cieca".

### 13.1 Suddivisione raccomandata

Una sola PR su tutti i form, schema e serializzazioni e' troppo rischiosa.
Prevedere PR separate e verificabili:

1. **A1, motore:** registro, resolver, modello/RLS, salvataggio atomico, pagina
   Impostazioni e test. Nessuna schermata modificabile finche' non integrata.
2. **A2, anagrafiche:** members, sponsors, events, con create/edit/list/detail
   completi e proiezione server verificata. Primo rilascio limitato esplicito.
3. **B1, relazioni e quote:** roles, member_roles, membership_plans, memberships,
   payments, expirations, sponsor_contributions ed event_sponsors.
4. **B2, comunicazioni e filtri:** email_templates, email_campaigns e reports,
   con prove provider simulate, nessun invio reale.
5. **Chiusura M10:** regressione completa, documentazione, prove ruoli/RLS e
   verifica mobile. Non dichiarare M10 completata dopo la sola fase A.

Durante il rollout non mostrare come operative policy di form non integrati.
Per un campo duplicato in piu' componenti della stessa schermata applicare
sempre la stessa policy. Una sotto-schermata riusata in piu' route mantiene
la propria chiave e non introduce un bypass.

## 14. Compatibilita' dati e rilascio

- Nessun dato business esistente e' cancellato o normalizzato dal cambio policy.
- Editable -> readonly e readonly -> hidden cambiano interazione e proiezione,
  non il valore memorizzato.
- Reset archivia solo override e riattiva il default del registro.
- Assenza di override preserva la UI attuale, inclusi stati derivati e vincoli.
- Le impostazioni non trasformano campi opzionali in obbligatori o viceversa,
  non cambiano tipi, label o schema delle tabelle business.
- Versione registro e compatibilita' DB sono controllate al deploy e al submit.

Rilascio: schema additivo prima, codice compatibile e test poi, abilitazione
schermate/configurazioni per ultima. Una nuova chiave deve essere ammessa nel
validatore DB prima di essere salvabile. Non attivare impostazioni mentre
vecchie istanze applicative ignorano ancora l'enforcement.

Rollback: ripristinare una versione applicativa che comprende le policy gia'
attivate; tornare a una versione precedente che le ignora sarebbe un rollback
permissivo. Nessun DROP automatico della tabella o cancellazione dei dati.
Eventuale reset globale richiede decisione e conferma del super_admin.

Quando sara' implementata la migration, aggiornare anche
`MIGRATION_AND_BACKUP.md`, `DATABASE_DESIGN.md`, setup/checklist pertinenti e
ordine di restore. Includere override e compatibilita' registro nel backup;
verificare autore/FK admin al restore. Questo piano non modifica tali procedure
come se M10 fosse gia' live e non richiede nuovi seed business.

## 15. RLS e sicurezza Supabase proposte

RLS obbligatoria su `ui_field_policies`. Privilegi minimi espliciti: nessun grant
a PUBLIC/anon, niente DELETE/TRUNCATE per authenticated; SELECT e sole mutazioni
necessarie al percorso approvato. Non assumere che i default privilege siano
gia' restrittivi. Service role non usata da pagina, resolver, save o reset.

Policy proposte:

- SELECT: `app_private.is_active_admin()`; il resolver richiede inoltre override
  attivi e scope global. La sola conoscenza delle policy non conferisce diritti.
- INSERT: super_admin attivo, scope global, scope_id null, autore corrente,
  archivio inizialmente null e coppia/stato ammessi.
- UPDATE: USING e WITH CHECK per super_admin attivo e scope global; trigger di
  validazione impedisce modifica delle chiavi/created_at, autore falso e
  riattivazione impropria di una riga archiviata.
- DELETE: nessuna policy, nessun controllo UI che la usi.

Nuovo helper proposto `app_private.is_super_admin()` senza parametri utente:
verifica admin_users.id = auth.uid(), role super_admin, status active,
archived_at null. Se SECURITY DEFINER per evitare dipendenze ricorsive dalle
RLS, owner controllato, `search_path = ''`, oggetti qualificati, nessun SQL
dinamico, EXECUTE solo ai ruoli strettamente necessari. Non rendere pubblico
uno schema privato tramite Data API.

`updated_at` usa `public.set_updated_at()` gia' hardened. Il controllo autore
assegna/verifica updated_by dalla sessione corrente. Funzioni di salvataggio
preferibilmente invoker: se la scelta finale richiede definer per chiudere
gli accessi diretti, limitare privilegi e superficie alla sola tabella policy
e ripetere i controlli senza affidarsi al bypass RLS. Mai un helper generico
capace di aggiornare tabelle/colonne arbitrarie.

La coerenza registro/DB non e' risolta dalla sola RLS. Servono anche CHECK,
allowlist derivata, vincoli di scope e test di parita'. Le policy delle 14
tabelle correnti non vengono ampliate per introdurre questa configurazione.

## 16. Performance e cache

Prima implementazione: **memoizzazione limitata alla richiesta**, non cache
persistente globale. Una query policy per l'insieme di screen_key della pagina,
zero query aggiuntive per campo; una lettura fresca per la Server Action.
I fetch business restano separati e sotto sessione/RLS.

Server Components condividono il loader memoizzato; Client Components ricevono
la sola mappa risolta e DTO filtrati. Non caricare l'intero catalogo di tutte
le schermate su ogni pagina. Non memorizzare client Supabase/sessioni/record
personali in singleton condivisi fra utenti.

Dopo save/reset invalidare i percorsi interessati, refresh della pagina
Impostazioni e delle viste riaperte. Un form gia' aperto non e' aggiornabile
istantaneamente senza un canale dedicato: al submit la revisione fresca lo
blocca se necessario. Non aggiungere Realtime per questa milestone.

Solo dopo misure reali valutare cache persistente di metadati/override, con
chiave progetto + registry_version + scope/revisione e invalidazione atomica
dopo commit. Le future appartenenze ai gruppi richiederanno anche isolamento
per contesto autorizzativo e invalidazione su revoca; non riusare una cache
globale di stati risolti per utenti di gruppi diversi.

Misurare numero query, latenza loader e dimensione payload RSC. Non introdurre
una SELECT per ogni componente Field. In caso di errore non usare una cache
vecchia piu' permissiva per sbloccare una scrittura.

## 17. Test previsti e verifiche della fase di piano

I test M10 seguenti sono **da implementare ed eseguire in ambiente isolato**,
non prove effettuate sul live. Il repository non ha attualmente uno script
test dedicato: scegliere un runner compatibile o i runner gia' disponibili
nell'ambiente di CI quando si avvia l'implementazione, documentando eventuali
sole dipendenze dev. Nessuna installazione introdotta da questo documento.

### 17.1 Database

- State invalido, chiave ignota, coppia screen/field inesistente e stato vietato rifiutati.
- Global con scope_id non null rifiutato; gruppo senza scope_id rifiutato;
  ogni scope permission_group rifiutato dal gate M10.
- Duplicati globali con NULL bloccati; duplicati di gruppo previsti dal contratto
  futuro; storia archiviata compatibile con un solo override attivo.
- RLS: anon e Auth non admin negati; admin attivo SELECT ma non mutazioni;
  super_admin attivo salva/reset; inactive/archived negati anche se super_admin.
- Nessuna policy/grant DELETE o TRUNCATE per ruoli applicativi della nuova tabella.
- Autore falsificato, modifica chiavi e ripristino improprio di righe archiviate negati.
- RPC atomica: un campo invalido annulla tutto; due save concorrenti generano
  conflitto controllato, non stato misto. Parita' registro/allowlist SQL.
- updated_at e updated_by coerenti; helper con search_path sicuro.

### 17.2 Resolver e proiezione

- Default senza override, override globale, override archiviato ignorato.
- Errori di rete, registry mismatch e righe invalide: blocco sicuro, mai editable implicito.
- Una query per set schermate, non per campo; nessuna fuga fra sessioni.
- Precedenza futura gruppo/global/default e piu' gruppi con criterio restrittivo;
  gruppo senza override non annulla un altro gruppo.
- Valori hidden assenti da HTML, payload RSC, props, option list, errori e log.
- Le schermate di sola lettura non abilitano editing passando una policy editable.

### 17.3 Funzionali e regressioni

- Editable salvabile solo dopo validazione; readonly visibile ma non modificabile.
- Request manuale con readonly cambiato o hidden, compreso valore vuoto, rifiutata.
- Valori hidden/readonly esistenti preservati, inclusi booleani, nullable e FK;
  nessuna sovrascrittura concorrente causata dal record completo ricostruito.
- Campo obbligatorio non nascondibile; readonly create senza default certo rifiutato.
- Default create applicato dal server anche manipolando il form; nessuna fiducia
  in status/data/metodo provenienti da controlli disabled o input nascosti.
- Dipendenze quota zero/note, tipo contributo/description/amount e date valide;
  impossibilita' di salvare una configurazione che impedisce casi business validi.
- Rinnovo rapido e normale creano nuove memberships, preservano la precedente;
  calcoli di quota/pagamento e trigger restano invariati.
- Collegamento evento non perso quando il selettore contributo e' hidden;
  contribuzione senza evento ancora valida.
- Campagne sent/failed non editabili con policy; snapshot e conferma richiesti;
  test con provider simulato e numero invii reali uguale a zero.
- Preview/export condividono policy filtri; URL vecchi e form manomessi non
  ampliano silenziosamente risultati; CSV/XLSX e limite righe invariati.
- Reset solo override; admin non salva; super_admin salva; revoca admin fra GET
  e POST bloccata; nessuna guard sostituita da visibilita' di un pulsante.

### 17.4 UI

- Desktop 1280px e mobile 360/375/390px, anche Safari iPhone con toolbar e tastiera.
- Nessun overflow orizzontale, azioni finali raggiungibili, zoom consentito e
  input mobile almeno 16px per non reintrodurre l'auto-zoom gia' corretto.
- Navigazione tastiera, focus visibile, radio group con nome accessibile, label
  e motivazione degli stati disabilitati, contrasto e lettura senza solo colore.
- Modulo/schermata/ricerca, default/override chiari, salvataggio della schermata
  completa anche con elenco filtrato, conferma, pending, errore, conflitto.
- Modifiche non salvate, reset singolo/schermata, empty state e errore distinti.
- Coerenza delle stesse colonne tra tabelle desktop e card mobile.

### 17.5 Baseline della pianificazione

Verifiche locali richieste: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
Gli esiti riguardano il codice esistente, non un'implementazione M10.

| Verifica | Esito di questa fase |
| --- | --- |
| Documentazione, schema/migration, route/form/service/validazioni/UI/admin | Analizzati prima della stesura del piano. |
| Supabase | Sola lettura di metadati e migration sul solo progetto indicato; snapshot sezione 2.2. |
| `npm run lint` | PASS, exit 0. |
| `npx tsc --noEmit` | PASS, exit 0. |
| `npm run build` | PASS, exit 0 nel secondo tentativo autorizzato fuori sandbox. Il primo aveva compilato ma si era fermato al subprocess TypeScript con `Error: spawn EPERM` (errno -4048); nessun fix applicativo necessario. |
| Test M10, browser e test RLS impersonati | Non eseguiti: funzionalita' non implementata; nessun dato live alterato per simulare utenti. |

Il controllo cataloghi dimostra presenza delle RLS e definizione delle policy,
non una prova end-to-end con ogni ruolo. Non confondere questa lettura con i
test di autorizzazione previsti per l'implementazione.

### 17.6 Tracciabilita' tecnica

Punti di integrazione letti nel repository, da usare come riferimento nella
successiva implementazione (nessuno di questi file e' modificato dal piano):

- Guard/sessione: `src/services/admin-auth.service.ts`,
  `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`,
  `src/app/(admin)/layout.tsx` e `src/types/admin.ts`.
- Entry point: pagine e action sotto `src/app/(admin)/members`, `memberships`,
  `sponsors`, `events`, `email`, `settings`; pagina `reports` e
  `src/app/(admin)/reports/export/route.ts`.
- Dati business: `src/services/members.service.ts`, `roles.service.ts`,
  `member-roles.service.ts`, `membership-plans.service.ts`,
  `memberships.service.ts`, `payments.service.ts`, `sponsors.service.ts`,
  `events.service.ts` e `expirations.service.ts`.
- Email: `src/services/email-templates.service.ts`, `email-campaigns.service.ts`,
  `email-recipients.service.ts`, `email-provider.service.ts`.
- Report: `src/services/reports.service.ts`, `report-filters.service.ts`,
  `report-export.service.ts`, `src/components/reports/ReportFilterPanel.tsx`
  e `ReportExportActions.tsx`.
- Form e proiezione: componenti nelle cartelle `src/components/members`,
  `memberships`, `payments`, `roles`, `sponsors`, `events`, `email`; relativi
  helper FormData sotto `src/utils`, validazioni nei service e componenti base
  sotto `src/components/ui`.
- Schema: `database/migrations/001_extensions.sql` fino a `010_email.sql`,
  placeholder successivi e seed esistenti. La proposta non sostituisce
  lo schema corrente documentato in `DATABASE_DESIGN.md`.

## 18. Acceptance criteria della futura implementazione

- [ ] `/settings/field-visibility` esiste e usa registro versionato, non campi arbitrari.
- [ ] Solo super_admin attivi possono salvare/reset; admin attivi consultano/applicano.
- [ ] Tre stati funzionano dove ammessi; liste/dettagli non acquistano editing.
- [ ] Obbligatori mai hidden; create readonly solo con default server certo.
- [ ] Dipendenze condizionali non rendono impossibile creare un record valido.
- [ ] Readonly e hidden sono verificati server-side, non solo con attributi HTML.
- [ ] Payload client non contengono valori hidden e update non li cancella.
- [ ] Assenza di override usa il default; errore di lettura non usa fallback permissivi.
- [ ] Global operativo; permission_group predisposto ma bloccato in M10.
- [ ] Nessuna N+1 query per campo; caricamento condiviso per schermata/richiesta.
- [ ] Save/reset atomici, conflitti e moduli aperti con policy vecchie gestiti.
- [ ] RLS, grant minimi, assenza DELETE e search_path sicuri verificati.
- [ ] Nessuna regressione di rinnovi, pagamenti, relazioni, email o report.
- [ ] Rollout completato per tutte le schermate approvate; esclusioni chiaramente documentate.
- [ ] Test desktop/mobile e azioni finali su Safari superati.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build` passano.
- [ ] Schema, backup/restore, manuali e changelog aggiornati all'implementazione reale.
- [ ] Limite tra policy UI/applicative e autorizzazioni DB descritto senza promesse di privacy globale.

## 19. Rischi, priorita' e decisioni da confermare

| Priorita' | Rischio | Mitigazione / criterio di arresto |
| --- | --- | --- |
| Blocker | Form reso inutilizzabile da required/default/condizioni | Validazione configurazione su tutti i casi raggiungibili; opzioni bloccate, default solo server. |
| Blocker | Sicurezza soltanto disabled/CSS | Guard, enforcement action, DTO filtrati, test request manuali e payload RSC. |
| Blocker | Perdita valori hidden o false involontari | Candidato completo separato dalla patch editable; test nullable/checkbox/relazioni. |
| Blocker | Chiavi/stati sconosciuti o schema/registro divergenti | Registro tipizzato, allowlist DB derivata, versioni e test di parita'; blocco schermata in errore. |
| Blocker | Vecchio deploy ignora policy attivate | Attivazione dopo codice compatibile; rollback compatibile, non semplicemente codice pre-M10. |
| Important | RLS di riga scambiata per autorizzazione di colonna | Dichiarare il confine; nessuna garanzia su accesso Data API diretto basata solo sulle policy UI. |
| Important | Save parziale o concorrenza | Transazione per schermata, revisione attesa, lock e conflitto esplicito. |
| Important | Troppe query/cache autorizzative obsolete | Lettura batched, memoizzazione request, fresh read in action, misure prima di cache persistente. |
| Important | Permission group con precedenze ambigue | Contratto gruppo/global/default, piu' gruppi restrittivo, gate DB finche' manca il sistema completo. |
| Important | Email/report continuano a usare campi nascosti altrove | Non confondere visualizzazione con consenso/export privacy; anteprima e workflow invariati. |
| Important | Regressioni su mapper attuali, trigger o readonly in edit | Rollout per moduli, patch minima, test dipendenze e concorrenza. |
| Minor | UI Impostazioni troppo complessa | Raggruppamenti, ricerca, salvataggio per schermata e motivazioni concise; niente gruppi operativi. |
| Minor | Eccessiva promessa di storico configurazioni | updated_by non sostituisce audit log; nessuna nuova tabella audit in questa milestone. |

Prima di iniziare il codice confermare il perimetro applicativo della sezione
12.2. La proposta segue l'esigenza di configurare schermate, non di revocare
diritti DB agli admin. Se hidden deve significare "dato inaccessibile anche
via API o export", e' un requisito diverso e bloccante per questo progetto.

Confermare inoltre il rollout in piu' PR e la scelta conservativa sui campi
condizionali. Non serve decidere ora l'interfaccia dei gruppi: resta esclusa.

## 20. Out of scope

- CRUD permission group, assegnazione admin ai gruppi, pagina gestione gruppi.
- Policy per singolo utente, permessi record-level e nuovo sistema completo di ACL.
- Personalizzazione libera del layout, drag-and-drop, label modificabili da UI.
- Nuovi campi business, campi custom o nuove tabelle di dati dell'associazione.
- Nuove route CRUD come memberships.edit o payments.edit.
- Cancellazione dati, DELETE fisico da UI, riscrittura dello storico rinnovi.
- Configurazione delle colonne export, revoca globale della visibilita' di un dato,
  invii automatici, cambi a Resend, dashboard avanzate.
- Contabilita', fatturazione, IVA, prima nota, area soci e app mobile nativa.
- Nuove tabelle gruppi/audit, provider, variabili ambiente o modifiche hosting.
- Qualsiasi implementazione, migration operativa, applicazione SQL o modifica
  live durante questa PR: **il deliverable attuale e' solo il piano**.
