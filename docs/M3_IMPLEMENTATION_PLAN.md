# M3 Implementation Plan - Expirations & Renewals

## Stato del documento

Questo documento prepara la milestone M3 richiesta come "Expirations & Renewals" senza avviarla operativamente.

Questa PR e' solo documentale:

- non scrive codice applicativo;
- non crea migration operative;
- non modifica il database;
- non applica nulla al progetto Supabase live.

Regola vincolante:

- ogni rinnovo crea una nuova riga in `memberships`;
- nessuna membership esistente deve essere modificata, estesa o riutilizzata per rappresentare un rinnovo successivo.

Nota di allineamento: la documentazione storica cita M3 come dashboard parziale e M4 come scadenze. Questo piano recepisce la richiesta corrente di preparare M3 come "Expirations & Renewals"; la dashboard completa resta fuori scope.

## Stato reale del database verificato

Verifica live eseguita in sola lettura sul progetto Supabase:

- nome progetto: `PonteNext`;
- project ref: `uhxfpsamenjhyrfgwckw`;
- regione: `eu-central-1`;
- stato progetto: `ACTIVE_HEALTHY`;
- PostgreSQL: `17`.

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

| Tabella | RLS | Righe |
| --- | --- | ---: |
| `admin_users` | attiva | 1 |
| `members` | attiva | 0 |
| `roles` | attiva | 7 |
| `member_roles` | attiva | 0 |
| `membership_plans` | attiva | 3 |
| `memberships` | attiva | 0 |
| `payments` | attiva | 0 |

Non risultano presenti tabelle fuori scope M3 come `sponsors`, `events`, `sponsor_contributions`, `event_sponsors`, `email_templates`, `email_campaigns`, `email_campaign_recipients`, `audit_logs` o `reports`.

Non risultano presenti viste o materialized view nello schema `public`.

Policy M2 live:

- `membership_plans`, `memberships` e `payments` hanno policy `SELECT`, `INSERT`, `UPDATE` per ruolo `authenticated`;
- tutte le policy usano l'helper hardened `app_private.is_active_admin()`;
- non risultano policy `DELETE`.

Trigger M2 live:

- `set_membership_plans_updated_at` su `membership_plans`;
- `set_memberships_updated_at` su `memberships`;
- `set_membership_payment_status` su `memberships`;
- `set_payments_updated_at` su `payments`;
- `refresh_membership_payment_totals` su `payments`.

Seed `membership_plans` live:

| Piano | Quota minima | Durata | Attivo | Sort |
| --- | ---: | ---: | --- | ---: |
| `Ordinaria` | `30.00` | 12 mesi | si | 10 |
| `Agevolata` | `15.00` | 6 mesi | si | 20 |
| `Sostenitore` | `30.00` | 12 mesi | si | 30 |

## 1. Scope M3

M3 implementa solo la gestione operativa di scadenze e rinnovi derivata dalle tabelle M2.

Incluso:

- route protetta `/expirations`;
- elenco soci con ultima membership rinnovabile;
- filtri scadenza: scaduti, entro 30 giorni, entro 60 giorni, entro 90 giorni;
- evidenza dello stato pagamento della membership in scadenza o scaduta;
- link/azione di rinnovo verso il flusso M2 di creazione nuova membership;
- UI responsive desktop/mobile;
- service layer dedicato alle scadenze;
- eventuali query o viste di supporto, senza nuove tabelle;
- test manuali delle route M3 e dei filtri.

M3 parte da M2 gia' applicata:

- `members` e `roles` da M1;
- `membership_plans`, `memberships` e `payments` da M2;
- trigger M2 per `paid_amount` e `payment_status`;
- `renewMembership()` gia' inteso come creazione di nuova membership;
- navigazione con voce `Scadenze` gia' presente ma disabilitata.

## 2. Regole scadenza

La scadenza associativa e' derivata esclusivamente da `memberships.end_date`.

Regole:

- `members.status` resta solo stato anagrafico e non indica lo stato associativo;
- una membership archiviata (`archived_at is not null`) non partecipa alle scadenze operative;
- una membership con `status = 'cancelled'` non partecipa alle scadenze operative;
- una membership e' scaduta se `end_date < current_date`;
- una membership e' in scadenza se `end_date >= current_date` ed `end_date <= current_date + N giorni`;
- il confronto usa date (`date`), non timestamp;
- la data corrente deve essere calcolata in modo coerente tra service e database.

Per evitare falsi positivi dovuti allo storico rinnovi, i filtri M3 devono lavorare sulla sola ultima membership non archiviata e non annullata per ciascun socio.

La "ultima membership rinnovabile" e' definita cosi':

- stesso `member_id`;
- `memberships.archived_at is null`;
- `memberships.status <> 'cancelled'`;
- socio non archiviato;
- ordinamento per `end_date desc`, poi `start_date desc`, poi `created_at desc`;
- in caso di parita', usare `id` come ordinamento stabile.

Le membership storiche piu' vecchie restano visibili nello storico socio/iscrizioni, ma non devono rendere il socio "scaduto" se esiste una membership successiva valida.

## 3. Regole rinnovo

Il rinnovo non estende una membership esistente.

Regole:

- l'azione "Rinnova" apre il flusso di nuova membership gia' previsto da M2;
- la nuova membership deve avere un nuovo `id`;
- il `member_id` resta quello del socio rinnovato;
- `start_date` proposta: giorno successivo alla maggiore `end_date` non archiviata e non annullata del socio;
- se il socio non ha membership precedenti, `start_date` proposta: data corrente;
- `end_date` proposta: calcolata dal piano selezionato o da durata personalizzata;
- `minimum_fee`, `expected_fee`, `paid_amount` e `payment_status` seguono le regole M2;
- i pagamenti non sono creati automaticamente dal rinnovo;
- eventuale pagamento iniziale resta una registrazione separata in `payments`.

M3 puo' aggiungere parametri di navigazione per rendere il flusso piu' esplicito, ad esempio:

- `/memberships/new?memberId=<member_id>`;
- opzionale futuro: `/memberships/new?memberId=<member_id>&renewFrom=<membership_id>`.

Il parametro `renewFrom`, se introdotto in implementazione, serve solo a precompilare il contesto UI e non deve creare una relazione obbligatoria o modificare la membership precedente.

## 4. Regole storico rinnovi

Lo storico rinnovi e' rappresentato da piu' righe in `memberships`.

Regole:

- ogni riga `memberships` rappresenta un periodo associativo autonomo;
- i rinnovi successivi non modificano `start_date`, `end_date`, `expected_fee`, `minimum_fee`, `paid_amount` o `payment_status` delle righe precedenti;
- lo storico e' ordinato per `end_date desc`, poi `created_at desc`;
- le righe storiche annullate restano storiche ma sono escluse dai filtri scadenze;
- le righe archiviate restano fuori dagli elenchi operativi standard;
- la scheda socio continua a mostrare lo storico iscrizioni M2;
- M3 aggiunge solo una vista operativa sulle scadenze, non un nuovo modello di storico.

Se esistono periodi sovrapposti per lo stesso socio, M3 deve:

- non correggerli automaticamente;
- selezionare comunque la membership con `end_date` maggiore come ultima membership rinnovabile;
- segnalare nel piano di implementazione o nella UI un possibile warning operativo, se il caso diventa rilevante.

## 5. Filtri

I filtri sono cumulativi per finestra temporale.

### Scaduti

Mostra soci la cui ultima membership rinnovabile ha:

- `end_date < current_date`;
- `archived_at is null`;
- `status <> 'cancelled'`.

Esempio semantico:

```text
ultima membership valida del socio gia' terminata
```

### Entro 30 giorni

Mostra soci la cui ultima membership rinnovabile ha:

- `end_date >= current_date`;
- `end_date <= current_date + 30 giorni`;
- `archived_at is null`;
- `status <> 'cancelled'`.

### Entro 60 giorni

Mostra soci la cui ultima membership rinnovabile ha:

- `end_date >= current_date`;
- `end_date <= current_date + 60 giorni`;
- `archived_at is null`;
- `status <> 'cancelled'`.

Il filtro entro 60 giorni include anche i risultati entro 30 giorni.

### Entro 90 giorni

Mostra soci la cui ultima membership rinnovabile ha:

- `end_date >= current_date`;
- `end_date <= current_date + 90 giorni`;
- `archived_at is null`;
- `status <> 'cancelled'`.

Il filtro entro 90 giorni include anche i risultati entro 30 e 60 giorni.

Filtri non previsti in M3:

- invio promemoria email;
- report/export;
- sponsor;
- eventi;
- dashboard completa;
- stato anagrafico come proxy dello stato associativo.

## 6. Route previste

Route principale:

- `/expirations`: elenco scadenze e rinnovi.

Query string previste:

- `/expirations?filter=expired`;
- `/expirations?window=30`;
- `/expirations?window=60`;
- `/expirations?window=90`;
- `/expirations?q=<testo>` per ricerca socio, se implementata nella stessa milestone.

Link operativi:

- `/members/<member_id>` per aprire la scheda socio;
- `/memberships/<membership_id>` per aprire la membership corrente/scaduta;
- `/memberships/new?memberId=<member_id>` per avviare rinnovo come nuova membership.

Protezione route:

- `/expirations` deve stare sotto il layout admin protetto;
- le action server-side eventuali devono chiamare `requireActiveAdmin()`;
- nessuna route pubblica o area soci deve essere introdotta.

Route non previste:

- nessuna route email;
- nessuna route sponsor;
- nessuna route eventi;
- nessuna route report;
- nessuna dashboard completa.

## 7. Componenti UI previsti

Componenti M3:

- `ExpirationFilters.tsx`;
- `ExpirationSummary.tsx`;
- `ExpirationTable.tsx`;
- `ExpirationCardList.tsx`;
- `ExpirationStatusBadge.tsx`;
- `RenewalActionButton.tsx`.

Componenti riutilizzati:

- `Button`;
- `Badge`;
- `Card`;
- `EmptyState`;
- `Input`;
- `PageHeader`;
- eventuali pattern gia' usati da `MembershipTable`, `MembershipCardList` e `MembershipFilters`.

Regole UI:

- file componenti React in formato `PascalCase.tsx`;
- desktop: tabella con colonne socio, piano, periodo, giorni alla scadenza, pagamento, azioni;
- mobile: card, non tabella compressa;
- azione primaria: `Rinnova`;
- azioni secondarie: `Apri socio`, `Apri iscrizione`;
- empty state differenziato per filtro;
- nessun pulsante "Invia promemoria";
- nessun export;
- nessun widget sponsor/eventi/email/report.

La pagina `/expirations` deve essere un'interfaccia operativa, non una landing page o una dashboard completa.

## 8. Service layer previsto

Servizio principale:

- `src/services/expirations.service.ts`.

Tipi previsti:

- `src/types/expiration.ts`.

Funzioni previste:

- `getExpirations(filters)`;
- `getExpirationSummary()`;
- `getLatestRenewableMemberships()`;
- `getExpirationWindow(endDate, today)`;
- `getDaysUntilExpiration(endDate, today)`;
- `buildRenewalHref(memberId, membershipId)`;

Tipi di filtro:

- `filter: 'expired' | 'upcoming'`;
- `windowDays: 30 | 60 | 90`;
- `query?: string`.

Regole service:

- usare Supabase server client;
- applicare sempre `archived_at is null`;
- escludere `status = 'cancelled'`;
- escludere soci archiviati;
- non scrivere su `memberships` per calcolare scadenze;
- non duplicare la logica di creazione membership gia' presente in M2;
- il rinnovo deve passare da `renewMembership()` o da `createMembership()` secondo il pattern M2;
- gli errori devono essere messaggi operativi per la UI.

Server action previste:

- M3 puo' non avere action proprie se il rinnovo e' solo link verso `/memberships/new`;
- se vengono introdotte action per prefill o revalidate, devono essere route-scoped e protette con `requireActiveAdmin()`;
- nessuna action deve inviare email o generare report.

## 9. Query e viste previste

Implementazione consigliata per M3 iniziale:

- query service-side senza creare viste, sfruttando le tabelle M2 gia' presenti;
- eventuale vista SQL solo se la query diventa troppo complessa o serve uniformare la semantica tra piu' pagine.

Query concettuale per ultima membership rinnovabile:

```sql
with latest_memberships as (
  select distinct on (memberships.member_id)
    memberships.id,
    memberships.member_id,
    memberships.membership_plan_id,
    memberships.start_date,
    memberships.end_date,
    memberships.expected_fee,
    memberships.paid_amount,
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

Nota: lo snippet e' indicativo e non e' una migration da applicare in questa PR.

Query concettuale per filtro scaduti:

```sql
where latest_memberships.end_date < current_date
```

Query concettuale per filtro entro N giorni:

```sql
where latest_memberships.end_date >= current_date
  and latest_memberships.end_date <= current_date + make_interval(days => :window_days)
```

Viste candidate, se M3 implementativa decide di introdurre una migration tecnica:

- `public.latest_renewable_memberships_view`;
- `public.expired_memberships_view`;
- `public.expiring_memberships_view`.

Indicazione prudenziale:

- per M3 e' preferibile partire dal service layer, dato che non esistono viste live e i volumi attuali sono nulli;
- se si crea una vista, deve essere solo una vista di lettura e non deve introdurre nuove tabelle;
- eventuali indici aggiuntivi devono essere valutati solo se necessari, per esempio un indice parziale su membership non archiviate/non annullate ordinate per `member_id` ed `end_date`.

Indici live gia' utili:

- `memberships_member_id_idx`;
- `memberships_member_period_idx`;
- `memberships_status_end_date_idx`;
- `memberships_archived_at_idx`;
- `membership_plans_active_sort_idx`.

RLS:

- le query service-side devono rispettare le policy RLS esistenti;
- eventuali viste devono evitare `security definer` non necessario;
- se una vista richiede `security_invoker`, la scelta va documentata nella migration M3 implementativa.

## 10. Trigger/eventuali automazioni

M3 non deve introdurre trigger per rendere scadute le membership.

Motivo:

- lo stato di scadenza dipende da `current_date`;
- un trigger non si attiva al passare del tempo;
- aggiornare periodicamente `memberships.status` a `expired` rischia incoerenze con la regola derivata da `end_date`.

Trigger M2 da mantenere:

- `set_membership_payment_status`;
- `refresh_membership_payment_totals`;
- trigger `updated_at`.

Automazioni non previste:

- nessun invio email;
- nessun promemoria automatico;
- nessun job schedulato;
- nessun report automatico;
- nessuna sincronizzazione esterna.

Se in futuro servira' un promemoria, dovra' essere gestito in M7 Email, non in M3.

## 11. Acceptance criteria

M3 e' accettabile quando:

- `/expirations` e' protetta come route admin;
- la navigazione abilita `Scadenze` solo dopo implementazione effettiva;
- il filtro `scaduti` mostra solo soci la cui ultima membership rinnovabile e' scaduta;
- i filtri entro 30/60/90 giorni usano finestre inclusive e cumulative;
- una membership storica scaduta non rende scaduto il socio se esiste una membership successiva valida;
- i record con `archived_at is not null` sono esclusi dagli elenchi operativi;
- i record con `status = 'cancelled'` sono esclusi dagli elenchi operativi;
- `members.status` non viene usato come stato associativo;
- l'azione `Rinnova` crea una nuova membership tramite il flusso M2;
- nessun rinnovo modifica `start_date` o `end_date` della membership precedente;
- UI desktop e mobile sono entrambe usabili;
- non vengono introdotti email, sponsor, eventi, report o dashboard completa;
- lint, TypeScript e build passano;
- la validazione manuale documenta almeno i quattro filtri e un rinnovo;
- Supabase live resta limitato alle migration M0-M2 e alle eventuali migration M3 espressamente approvate.

## 12. Rischi

Rischi principali:

- vecchie membership scadute possono produrre falsi positivi se i filtri non considerano solo l'ultima membership rinnovabile per socio;
- periodi sovrapposti possono rendere ambigua la membership "corrente";
- usare `members.status` per decidere se un socio e' attivo associativamente violerebbe la documentazione;
- `memberships.status = 'expired'` puo' divergere da `end_date` se trattato come sorgente dati invece che come stato derivato;
- confronti data basati su timezone diverse possono creare errori al cambio giorno;
- una vista SQL non ben progettata potrebbe aggirare o rendere meno chiara la RLS;
- l'azione rinnovo potrebbe sembrare una modifica della riga precedente se il copy UI non e' chiaro;
- introdurre export o promemoria in M3 anticiperebbe report/email;
- gli indici live sono sufficienti per volumi iniziali, ma la query "latest per member" potrebbe richiedere ottimizzazione con volumi alti;
- la milestone naming M3/M4 va riallineata nei documenti generali se la roadmap ufficiale cambia.

Mitigazioni:

- definire una sola funzione service per calcolare l'ultima membership rinnovabile;
- tenere le date come stringhe `YYYY-MM-DD`/`date`;
- non salvare scadenze duplicate in `members`;
- riusare il flusso M2 di creazione membership;
- documentare test manuali con casi storici e rinnovi multipli;
- rimandare email e report alle milestone dedicate.

## 13. Out of scope

M3 non include:

- email;
- invio promemoria;
- automazioni email;
- sponsor;
- eventi;
- report;
- export CSV/XLSX;
- dashboard completa;
- CRUD soci;
- CRUD ruoli;
- modifica dei piani iscrizione oltre l'uso dei dati M2 esistenti;
- contabilita';
- fatturazione;
- IVA;
- pagamenti online;
- area riservata soci;
- nuove tabelle applicative;
- modifiche al modello dati fuori da eventuali viste/indici tecnici espressamente approvati per M3 implementativa.
