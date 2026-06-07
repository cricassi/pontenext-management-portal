# M4 Implementation Plan - Dashboard

## Stato del documento

Questo documento prepara la milestone M4 richiesta come "Dashboard" senza
avviarla operativamente.

Questa PR e' solo documentale:

- non scrive codice applicativo;
- non crea migration operative;
- non modifica il database;
- non applica nulla al progetto Supabase live.

M4 deve essere una dashboard parziale e operativa, basata solo sui dati gia'
disponibili dopo M1, M2 e M3.

Nota di allineamento: alcuni documenti storici citavano M3 come dashboard
parziale e M4 come scadenze. La sequenza effettiva aggiornata ha gia'
implementato M3 come "Expirations & Renewals"; questo piano recepisce la
richiesta corrente di preparare M4 come "Dashboard".

## Stato reale del database verificato

Verifica live eseguita in sola lettura sul progetto Supabase:

- nome progetto: `PonteNext`;
- project ref: `uhxfpsamenjhyrfgwckw`;
- regione: `eu-central-1`;
- stato progetto: `ACTIVE_HEALTHY`;
- PostgreSQL: `17.6.1.127`.

Migration applicate:

| Versione | Nome |
| --- | --- |
| `20260606113953` | `001_extensions` |
| `20260606114014` | `002_admin_users` |
| `20260606115133` | `003_harden_admin_functions` |
| `20260606124849` | `004_members_roles` |
| `20260606221810` | `005_membership_plans` |
| `20260606221954` | `006_memberships_payments` |

Tabelle `public` presenti:

| Tabella | RLS | Righe operative |
| --- | --- | ---: |
| `admin_users` | attiva | 1 |
| `members` | attiva | 0 |
| `roles` | attiva | 7 |
| `member_roles` | attiva | 0 |
| `membership_plans` | attiva | 3 |
| `memberships` | attiva | 0 |
| `payments` | attiva | 0 |

Non risultano presenti viste o materialized view nello schema `public`.

Non risultano presenti tabelle fuori scope M4, tra cui:

- `sponsors`;
- `events`;
- `sponsor_contributions`;
- `event_sponsors`;
- `email_templates`;
- `email_campaigns`;
- `email_campaign_recipients`;
- `reports`;
- `audit_logs`;
- `dashboard_stats`;
- `dashboard_kpis`.

Policy live sulle tabelle M1-M2:

- `SELECT`, `INSERT`, `UPDATE` per ruolo `authenticated`;
- helper RLS: `app_private.is_active_admin()`;
- nessuna policy `DELETE`;
- RLS attiva su tutte le tabelle operative.

Conteggi derivati live per scadenze M3:

| Metrica | Valore |
| --- | ---: |
| Ultime membership rinnovabili | 0 |
| Membership scadute | 0 |
| Membership entro 30 giorni | 0 |
| Membership entro 60 giorni | 0 |
| Membership entro 90 giorni | 0 |
| Membership associative attive | 0 |
| Membership `unpaid` | 0 |
| Membership `partial` | 0 |
| Membership `paid` | 0 |
| Membership `overpaid` | 0 |

La dashboard M4 deve quindi gestire correttamente il caso reale attuale di
database quasi vuoto, con soli seed ruoli e piani iscrizione.

## 1. Scope M4

M4 implementa la prima dashboard amministrativa operativa del portale.

Incluso:

- sostituzione della pagina placeholder `/dashboard` con una dashboard parziale;
- route protetta sotto layout admin esistente;
- KPI derivati solo da dati M1-M3;
- pannelli operativi sintetici su soci, iscrizioni, scadenze e pagamenti;
- link rapidi verso route gia' disponibili;
- empty states coerenti con il database inizialmente vuoto;
- service layer read-only dedicato alla dashboard;
- UI responsive desktop, tablet e mobile;
- nessuna scrittura dati dalla dashboard;
- nessuna nuova tabella o vista, salvo necessita' reale motivata durante
  l'implementazione.

M4 usa solo:

- `members`;
- `roles`;
- `member_roles`;
- `membership_plans`;
- `memberships`;
- `payments`;
- scadenze M3 derivate da `memberships.end_date`.

La dashboard deve essere parziale:

- mostra lo stato operativo essenziale disponibile oggi;
- non anticipa moduli non ancora implementati;
- non prova a diventare un sistema di reportistica;
- non usa dati simulati per riempire widget non supportati dal database.

## 2. KPI dashboard previsti

KPI principali:

| KPI | Fonte | Regola |
| --- | --- | --- |
| Soci totali | `members` | `archived_at is null` |
| Soci anagraficamente attivi | `members` | `archived_at is null` e `status = 'active'` |
| Soci con iscrizione attiva | `memberships` | ultima membership rinnovabile per socio con periodo corrente |
| Iscrizioni scadute | scadenze M3 | ultima membership rinnovabile con `end_date < today` |
| Scadenze entro 30 giorni | scadenze M3 | ultima membership rinnovabile entro finestra inclusiva 30 giorni |
| Pagamenti da completare | `memberships` | `payment_status in ('unpaid', 'partial')` su membership non archiviate |
| Piani iscrizione attivi | `membership_plans` | `is_active = true` e `archived_at is null` |
| Ruoli attivi | `roles` | `archived_at is null` |

KPI secondari valutabili se restano leggibili:

- assegnazioni ruolo attive da `member_roles`;
- iscrizioni create negli ultimi 30 giorni da `memberships.created_at`;
- soci inseriti negli ultimi 30 giorni da `members.created_at`;
- membership `overpaid` come anomalia operativa, senza trattarla come dato
  contabile.

Regole importanti:

- `members.status` indica solo lo stato anagrafico;
- lo stato associativo deve essere derivato dalle `memberships`;
- le vecchie membership storiche non devono far risultare scaduto un socio che
  ha una membership successiva valida;
- ogni rinnovo resta una nuova riga in `memberships`;
- i pagamenti sono registrazioni gestionali non contabili o fiscali.

La dashboard non deve includere KPI per sponsor, eventi, email o report.

## 3. Dati disponibili da M1-M3

Dati M1:

- anagrafica soci in `members`;
- stato anagrafico del socio in `members.status`;
- ruoli configurabili in `roles`;
- assegnazioni ruolo in `member_roles`;
- soft delete tramite `archived_at`;
- RLS admin attiva.

Dati M2:

- piani iscrizione in `membership_plans`;
- storico iscrizioni in `memberships`;
- pagamenti gestionali in `payments`;
- `paid_amount` e `payment_status` aggiornati dai trigger sui pagamenti;
- seed piani iscrizione base:
  - `Ordinaria`;
  - `Agevolata`;
  - `Sostenitore`.

Dati M3:

- route `/expirations`;
- filtri scadenze:
  - scaduti;
  - entro 30 giorni;
  - entro 60 giorni;
  - entro 90 giorni;
- rinnovo rapido;
- logica di ultima membership rinnovabile per socio;
- scadenza canonica derivata da `memberships.end_date`;
- nessuna vista SQL o tabella dedicata alle scadenze.

Stato live attuale:

- il database non contiene ancora soci, membership o pagamenti operativi;
- ruoli e piani iscrizione seed sono presenti;
- questo impone empty states chiari e KPI a zero corretti.

## 4. Query/service layer previsti

Servizio principale previsto:

- `src/services/dashboard.service.ts`.

Tipi previsti:

- `src/types/dashboard.ts`.

Funzioni previste:

- `getDashboardPageData()`;
- `getDashboardKpis()`;
- `getDashboardExpirationsPreview(limit)`;
- `getLatestMembersPreview(limit)`;
- `getPaymentAttentionPreview(limit)`;
- `getDashboardQuickLinks()`, se si preferisce centralizzare i link.

Regole service:

- usare `getSupabaseServerClientOrThrow()`;
- rispettare RLS esistente;
- eseguire solo query `select`;
- filtrare sempre `archived_at is null` dove previsto;
- escludere membership con `status = 'cancelled'` dai conteggi associativi e
  scadenze operative;
- non usare `members.status` per lo stato associativo;
- riusare o estrarre in helper condivisi la logica M3 di ultima membership
  rinnovabile;
- evitare N+1 query caricando dati aggregati o liste limitate;
- limitare le preview a pochi record, ad esempio 5 o 10 elementi;
- ordinare in modo stabile per date e nome socio;
- gestire il database vuoto senza errori.

Query concettuali previste:

- conteggio soci non archiviati;
- conteggio soci anagraficamente attivi;
- conteggio ruoli non archiviati;
- conteggio piani iscrizione attivi;
- elenco ultime membership rinnovabili per socio;
- conteggio scaduti e finestre 30/60/90 sulla membership piu' recente;
- conteggio membership con `payment_status` da completare;
- elenco ultime anagrafiche create;
- elenco prossime scadenze operative.

Query concettuale per ultima membership rinnovabile:

```sql
with latest_memberships as (
  select distinct on (memberships.member_id)
    memberships.id,
    memberships.member_id,
    memberships.start_date,
    memberships.end_date,
    memberships.payment_status,
    memberships.status,
    memberships.created_at
  from public.memberships as memberships
  join public.members as members
    on members.id = memberships.member_id
  where memberships.archived_at is null
    and memberships.status <> 'cancelled'
    and members.archived_at is null
  order by
    memberships.member_id,
    memberships.end_date desc,
    memberships.start_date desc,
    memberships.created_at desc,
    memberships.id desc
)
select *
from latest_memberships;
```

Lo snippet e' indicativo e non e' una migration.

Indicazione tecnica:

- M4 non richiede nuove migration nello stato attuale;
- viste SQL o materialized view non sono necessarie con dataset attuale;
- eventuali viste future dovranno essere motivate da complessita' o performance,
  mantenendo RLS chiara e senza anticipare reportistica.

## 5. Componenti UI previsti

Componenti dashboard:

- `DashboardKpiGrid.tsx`;
- `DashboardKpiCard.tsx`;
- `DashboardSection.tsx`;
- `UpcomingExpirationsPanel.tsx`;
- `LatestMembersPanel.tsx`;
- `PaymentAttentionPanel.tsx`;
- `QuickLinksPanel.tsx`;
- `DashboardEmptyState.tsx`, se l'empty state generico esistente non basta.

Componenti riutilizzati:

- `PageHeader`;
- `Card`;
- `Button`;
- `Badge`;
- `EmptyState`;
- `PaymentStatusBadge`;
- `ExpirationStatusBadge`;
- `MembershipStatusBadge`;
- eventuali pattern gia' presenti in tabelle/card M1-M3.

Regole UI:

- file React in formato `PascalCase.tsx`;
- pagina admin operativa, non landing page;
- copy sintetico e orientato all'azione;
- badge sempre con testo leggibile;
- niente card annidate;
- niente sezioni decorative;
- nessun widget finto per moduli non presenti;
- nessun grafico complesso se non aggiunge valore immediato;
- icone solo se gia' coerenti con il sistema UI disponibile.

La dashboard puo' usare pannelli a lista invece di tabelle quando il contenuto e'
di anteprima.

## 6. Layout responsive

Desktop:

- header pagina con titolo e descrizione breve;
- griglia KPI a 4 colonne;
- corpo principale a 2 colonne:
  - colonna ampia per scadenze e pagamenti da completare;
  - colonna secondaria per ultimi soci e link rapidi;
- larghezze e spaziature coerenti con layout admin esistente.

Tablet:

- griglia KPI a 2 colonne;
- pannelli in una o due colonne in base allo spazio disponibile;
- link rapidi visibili senza scroll orizzontale.

Mobile:

- griglia KPI a 1 colonna;
- pannelli impilati;
- liste in formato card, non tabelle compresse;
- azioni come pulsanti/link a larghezza adeguata;
- nessun testo troncato in modo ambiguo;
- tap target coerenti con le regole responsive.

Regole generali:

- evitare overflow orizzontale;
- mantenere dimensioni stabili per KPI e azioni;
- non sovrapporre badge, importi e link;
- testare almeno desktop e mobile dopo l'implementazione.

## 7. Empty states

Empty state database iniziale:

- KPI a zero;
- pannello soci con messaggio operativo e link `Nuovo socio`;
- pannello scadenze con messaggio "Nessuna scadenza disponibile";
- pannello pagamenti con messaggio "Nessun pagamento da completare";
- link rapidi comunque visibili.

Empty state scadenze:

- se non ci sono scadenze entro 30 giorni, mostrare uno stato neutro;
- mantenere link a `/expirations`;
- non proporre invio email o promemoria.

Empty state pagamenti:

- se non ci sono membership `unpaid` o `partial`, mostrare stato positivo;
- non mostrare riepiloghi fiscali o contabili.

Empty state soci:

- se non ci sono soci, mostrare link a `/members/new`;
- evitare copy marketing;
- chiarire che la dashboard iniziera' a popolarsi con i dati M1-M3.

## 8. Link rapidi

Link rapidi previsti:

| Label | Route | Note |
| --- | --- | --- |
| Nuovo socio | `/members/new` | Creazione anagrafica M1 |
| Soci | `/members` | Lista soci M1 |
| Nuova iscrizione | `/memberships/new` | Creazione membership M2 |
| Iscrizioni | `/memberships` | Lista membership M2 |
| Scadenze | `/expirations` | Route M3 |
| Piani iscrizione | `/settings/membership-plans` | Configurazione M2 |
| Ruoli | `/settings/roles` | Configurazione M1 |
| Impostazioni | `/settings` | Hub impostazioni esistente |

Link non previsti:

- sponsor;
- eventi;
- email;
- report;
- export;
- automazioni promemoria.

## 9. Acceptance criteria

M4 e' accettabile quando:

- `/dashboard` e' protetta dal layout admin esistente;
- la pagina non mostra piu' il placeholder M0;
- tutti i KPI usano solo dati M1-M3;
- i KPI restano corretti con database vuoto;
- `members.status` viene usato solo per stato anagrafico;
- lo stato associativo e' derivato dalle `memberships`;
- le scadenze derivano da `memberships.end_date`;
- ogni conteggio scadenza usa solo l'ultima membership rinnovabile per socio;
- membership archiviate o annullate sono escluse dai conteggi operativi;
- pagamenti archiviati non alterano direttamente la dashboard, che legge
  `paid_amount` e `payment_status` gia' ricalcolati dai trigger M2;
- la dashboard non crea, aggiorna o archivia dati;
- non sono introdotte tabelle, migration o viste senza necessita' documentata;
- sponsor, eventi, email e report non compaiono come moduli attivi;
- UI desktop, tablet e mobile e' leggibile e senza overflow;
- empty states sono presenti;
- link rapidi puntano solo a route gia' implementate;
- `npm run lint` passa;
- `npx tsc --noEmit` passa;
- `npm run build` passa;
- test manuale documenta almeno:
  - apertura `/dashboard` senza sessione con redirect a `/login`;
  - apertura `/dashboard` con admin attivo;
  - dashboard con dataset vuoto;
  - link rapidi principali;
  - rendering mobile.

## 10. Rischi

Rischi principali:

- confondere `members.status` con stato associativo;
- contare membership storiche scadute invece della sola ultima membership
  rinnovabile per socio;
- rendere la dashboard troppo simile a un report anticipando funzionalita'
  future;
- presentare dati di pagamento come contabilita' o fiscalita';
- introdurre widget per sponsor, eventi, email o report senza dati disponibili;
- creare viste o migration non necessarie;
- duplicare la logica M3 delle scadenze in modo divergente;
- avere KPI tutti a zero nel database live attuale e una percezione di pagina
  vuota;
- eseguire troppe query in sequenza e rallentare la dashboard con l'aumento dei
  dati;
- differenze di timezone nel confronto tra date lato server e database;
- naming milestone ancora potenzialmente ambiguo nei documenti storici.

Mitigazioni:

- centralizzare la logica di ultima membership rinnovabile;
- mantenere i KPI pochi, leggibili e operativi;
- dichiarare chiaramente gli empty states;
- usare solo query read-only;
- mantenere M4 senza migration salvo evidenza tecnica;
- documentare nei test manuali i casi con piu' rinnovi per lo stesso socio;
- rinviare grafici avanzati, export e report alle milestone dedicate.

## 11. Out of scope

M4 non include:

- sponsor;
- eventi;
- email;
- route `/email`, `/email/templates`, `/email/campaigns`;
- invio promemoria;
- automazioni;
- report;
- export CSV/XLSX/PDF;
- dashboard completa;
- nuovi CRUD;
- CRUD soci oltre ai link esistenti;
- CRUD ruoli oltre ai link esistenti;
- modifiche a `membership_plans`, `memberships` o `payments`;
- nuove tabelle;
- nuove migration, salvo necessita' reale documentata;
- nuove policy RLS;
- modifiche ai trigger M2;
- contabilita';
- fiscalita';
- fatturazione;
- pagamenti online;
- area riservata soci;
- dati simulati o placeholder per moduli futuri.
