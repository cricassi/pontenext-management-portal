# M2 Implementation Plan - Memberships & Payments

## Stato del documento

Questo documento prepara la milestone M2 senza avviarla operativamente.

Questa PR e' solo documentale:

- non scrive codice applicativo;
- non crea migration operative;
- non modifica Supabase;
- non applica nulla al progetto Supabase live.

Decisione vincolante gia' formalizzata:

- ogni rinnovo crea una nuova riga nella tabella `memberships`;
- le righe `memberships` esistenti non devono essere modificate, estese o riutilizzate per rappresentare un rinnovo.

## 1. Scope M2

M2 implementa esclusivamente iscrizioni, piani iscrizione e pagamenti non contabili.

Incluso:

- tabella `membership_plans`;
- tabella `memberships`;
- tabella `payments`;
- gestione piani iscrizione;
- creazione nuova iscrizione per un socio;
- rinnovo come nuova riga `memberships`;
- storico iscrizioni del socio;
- registrazione pagamenti parziali e totali;
- calcolo e aggiornamento di `paid_amount`;
- calcolo e aggiornamento di `payment_status`;
- stato iscrizione derivabile da periodo, importi e campi della riga;
- UI responsive desktop/mobile per piani, iscrizioni e pagamenti;
- service layer M2;
- validazioni form M2;
- RLS sulle tre tabelle M2;
- trigger tecnici e di ricalcolo necessari a mantenere coerenti importi e stati.

M2 parte dalla base gia' completata:

- Supabase Auth funzionante;
- `admin_users` presente;
- helper RLS `app_private.is_active_admin()` disponibile;
- `public.set_updated_at()` hardened e disponibile;
- M1 applicata con `members`, `roles`, `member_roles`;
- nessuna tabella M2 ancora presente nel database live alla verifica post-merge M1.

## 2. Tabelle coinvolte

### `membership_plans`

Piani base di iscrizione configurabili.

Campi da modello documentato:

- `id`;
- `name`;
- `description`;
- `minimum_fee`;
- `default_duration_months`;
- `is_active`;
- `sort_order`;
- `created_at`;
- `updated_at`;
- `archived_at`.

Regole:

- il piano definisce default operativi, non blocca personalizzazioni sulla singola iscrizione;
- `minimum_fee` deve essere maggiore o uguale a `0`;
- `default_duration_months` deve essere maggiore di `0`;
- i piani archiviati o non attivi non sono selezionabili per nuove iscrizioni;
- i piani archiviati restano referenziabili nello storico delle iscrizioni gia' create.

### `memberships`

Riga storica di iscrizione o rinnovo.

Campi da modello documentato:

- `id`;
- `member_id`;
- `membership_plan_id`;
- `start_date`;
- `end_date`;
- `minimum_fee`;
- `expected_fee`;
- `paid_amount`;
- `payment_status`;
- `status`;
- `notes`;
- `created_at`;
- `updated_at`;
- `archived_at`.

Regole:

- ogni nuova iscrizione crea una riga;
- ogni rinnovo crea una nuova riga;
- una riga precedente non viene estesa;
- `end_date >= start_date`;
- `minimum_fee >= 0`;
- `expected_fee >= 0`;
- `paid_amount >= 0`;
- `payment_status` ammette solo `unpaid`, `partial`, `paid`, `overpaid`;
- `status` ammette solo `active`, `expired`, `cancelled`;
- lo stato associativo del socio deriva da `memberships`, non da `members.status`.

### `payments`

Versamenti non contabili collegati a una iscrizione.

Campi da modello documentato:

- `id`;
- `membership_id`;
- `payment_date`;
- `amount`;
- `method`;
- `reference`;
- `notes`;
- `created_by`;
- `created_at`;
- `updated_at`;
- `archived_at`.

Regole:

- un pagamento appartiene sempre a una `membership`;
- una `membership` puo' avere piu' pagamenti;
- `amount` deve essere maggiore di `0`;
- `method` ammette solo `cash`, `bank_transfer`, `pos`, `other`;
- i pagamenti non hanno valore di contabilita' fiscale;
- l'archiviazione di un pagamento deve ricalcolare `paid_amount` e `payment_status` della membership collegata.

## 3. Relazioni

Relazioni M2:

- `members` 1:N `memberships`;
- `membership_plans` 1:N `memberships`;
- `memberships` 1:N `payments`;
- `admin_users` 1:N `payments` tramite `payments.created_by`.

Dettaglio:

- `memberships.member_id` punta a `members.id`;
- `memberships.membership_plan_id` punta a `membership_plans.id` ed e' nullable per conservare storico anche se il piano non e' applicabile o viene archiviato;
- `payments.membership_id` punta a `memberships.id`;
- `payments.created_by` punta a `admin_users.id` ed e' nullable per tollerare import o bootstrap operativi controllati.

Regole relazionali:

- non cancellare fisicamente membri, piani, iscrizioni o pagamenti;
- usare `archived_at` per soft delete;
- non consentire delete fisico via policy applicativa;
- una iscrizione storica deve restare leggibile anche se il piano o il socio sono archiviati.

## 4. Regole quote minime

La quota minima rappresenta la soglia di riferimento del piano o della specifica iscrizione.

Regole:

- `membership_plans.minimum_fee` definisce il default del piano;
- quando si crea una `membership`, `minimum_fee` viene copiato dal piano selezionato;
- se non viene selezionato un piano, `minimum_fee` deve essere inserito manualmente;
- `minimum_fee` della riga `memberships` resta snapshot storico;
- modificare un piano non cambia le membership gia' create;
- `minimum_fee` non puo' essere negativa;
- la UI deve mostrare chiaramente quando la quota prevista differisce dalla quota minima.

Nota:

- `minimum_fee` non deve essere salvato in `members`;
- i report futuri useranno lo snapshot in `memberships`, non il valore corrente del piano.

## 5. Regole quote personalizzate

La quota personalizzata e' rappresentata da `memberships.expected_fee`.

Regole:

- `expected_fee` puo' essere uguale, maggiore o minore di `minimum_fee`;
- `expected_fee` non puo' essere negativa;
- il sistema deve permettere quote agevolate e quote sostenitore;
- il motivo della personalizzazione puo' essere annotato in `memberships.notes`;
- `expected_fee` e' lo snapshot storico della quota prevista per quel periodo;
- la quota prevista di una riga esistente non deve essere cambiata per simulare un rinnovo.

Validazioni UI:

- se `expected_fee < minimum_fee`, mostrare un avviso operativo non bloccante, salvo diversa decisione futura;
- se `expected_fee = 0`, richiedere conferma esplicita o nota;
- formattare sempre gli importi come valuta con due decimali.

## 6. Regole durata personalizzata

La durata e' definita da `start_date` e `end_date`.

Regole:

- `membership_plans.default_duration_months` fornisce il default per il calcolo della scadenza;
- la singola `membership` puo' usare durata diversa dal piano;
- `end_date` deve essere maggiore o uguale a `start_date`;
- `start_date` e `end_date` della membership sono snapshot storici;
- la durata non viene salvata in `members`;
- un rinnovo con durata diversa crea comunque una nuova riga.

Comportamento consigliato:

- selezionando un piano, il form propone `end_date` calcolata da `default_duration_months`;
- l'admin puo' modificare `end_date` prima della creazione;
- dopo la creazione, la correzione di date deve essere trattata come operazione eccezionale e non come flusso di rinnovo.

## 7. Regole rinnovo

Il rinnovo e' il punto piu' vincolante di M2.

Regole obbligatorie:

- ogni rinnovo crea una nuova riga in `memberships`;
- la membership precedente non viene estesa;
- la membership precedente non viene riutilizzata;
- la membership precedente resta nello storico;
- pagamenti del nuovo periodo appartengono alla nuova membership;
- pagamenti del periodo precedente restano collegati alla membership precedente.

Flusso rinnovo consigliato:

1. l'admin apre il socio o una membership in scadenza;
2. seleziona azione `Rinnova`;
3. il form propone piano, data inizio, data fine, quota minima e quota prevista;
4. alla conferma viene creata una nuova riga `memberships`;
5. eventuale primo pagamento viene registrato come riga `payments` collegata alla nuova membership;
6. `paid_amount` e `payment_status` della nuova membership vengono calcolati sui soli pagamenti della nuova riga.

Regole date rinnovo:

- default `start_date` consigliato: giorno successivo alla `end_date` piu' recente del socio;
- se non esistono iscrizioni precedenti, default `start_date` consigliato: data corrente;
- permettere override manuale se necessario;
- valutare warning in caso di sovrapposizione con una membership non cancellata dello stesso socio.

Vincoli da decidere in implementazione M2:

- bloccare completamente iscrizioni sovrapposte dello stesso socio oppure consentirle con warning operativo;
- se si blocca, usare vincolo o controllo transazionale coerente con soft delete e stato `cancelled`;
- se si consente, documentare che lo stato associativo corrente sceglie la riga piu' recente valida.

## 8. Regole `payment_status`

`payment_status` rappresenta lo stato dei pagamenti collegati alla singola membership.

Valori:

- `unpaid`;
- `partial`;
- `paid`;
- `overpaid`.

Regola di calcolo:

- se `paid_amount = 0`, allora `unpaid`;
- se `paid_amount > 0` e `paid_amount < expected_fee`, allora `partial`;
- se `paid_amount = expected_fee`, allora `paid`;
- se `paid_amount > expected_fee`, allora `overpaid`.

Regole operative:

- `payment_status` deve dipendere dai pagamenti non archiviati collegati alla membership;
- l'admin non dovrebbe impostare manualmente `payment_status`;
- `overpaid` e' ammesso come stato operativo, non come errore tecnico;
- modifiche/archiviazioni di pagamenti devono aggiornare il valore;
- se `expected_fee = 0`, una membership senza pagamenti puo' essere considerata `paid` solo se questa regola viene esplicitamente confermata prima dell'implementazione.

Rischio da risolvere prima del codice:

- definire formalmente il comportamento con `expected_fee = 0`.

## 9. Regole `paid_amount`

`paid_amount` e' la somma dei pagamenti validi collegati alla singola membership.

Regole:

- calcolare da `payments.amount`;
- considerare solo pagamenti con `archived_at is null`;
- aggiornare dopo insert, update o archiviazione di un pagamento;
- non permettere modifica manuale diretta da UI;
- mantenere `paid_amount >= 0`;
- usare `numeric(10,2)`;
- non usare `float`.

Strategia consigliata:

- usare trigger database per garantire coerenza anche se i pagamenti sono modificati da piu' percorsi applicativi;
- il service layer puo' ricalcolare o rileggere la membership dopo la mutazione per mostrare stato aggiornato;
- evitare duplicazione di formule tra molte action.

## 10. Scadenze

La scadenza deriva da `memberships.end_date`.

Regole:

- non salvare la scadenza in `members`;
- non duplicare la scadenza in campi applicativi paralleli;
- una membership e' scaduta quando `end_date < current_date` e `status` non e' `cancelled`;
- una membership puo' essere in scadenza quando `end_date` cade entro una finestra futura;
- M2 puo' mostrare la scadenza nello storico e nelle liste iscrizioni;
- M4 resta la milestone dedicata al monitoraggio scadenze 30/60/90 giorni;
- M2 non invia email e non crea promemoria.

Stato associativo del socio:

- socio con iscrizione attiva: esiste almeno una membership valida alla data corrente;
- socio con iscrizione scaduta: non esiste membership attiva ma esiste almeno una membership passata;
- socio senza iscrizione: non esistono membership non archiviate;
- questi stati sono derivati e non devono modificare `members.status`.

## 11. Route previste

Route piani iscrizione:

- `/settings/membership-plans`: elenco, creazione e modifica piani iscrizione.

Route iscrizioni:

- `/memberships`: elenco iscrizioni;
- `/memberships/new`: nuova iscrizione, con eventuale `member_id` precompilato da query string;
- `/memberships/[id]`: dettaglio iscrizione con pagamenti collegati;
- `/members/[id]`: sezione storico iscrizioni integrata nella scheda socio gia' M1;
- `/members/[id]/memberships`: opzionale come vista dedicata se la scheda socio diventa troppo densa.

Route pagamenti:

- nessuna route top-level obbligatoria;
- registrazione pagamento preferibilmente dentro `/memberships/[id]`;
- eventuale edit/archiviazione pagamento tramite server action o dialog nella pagina membership.

Route non previste in M2:

- `/expirations`, salvo link disabilitato o placeholder gia' esistente;
- `/sponsors`;
- `/events`;
- `/email`;
- `/reports`;
- dashboard completa.

## 12. Componenti UI previsti

Componenti piani iscrizione:

- `MembershipPlanTable.tsx`;
- `MembershipPlanCardList.tsx`;
- `MembershipPlanForm.tsx`;
- `MembershipPlanStatusBadge.tsx`;
- `ArchiveMembershipPlanDialog.tsx`.

Componenti iscrizioni:

- `MembershipTable.tsx`;
- `MembershipCardList.tsx`;
- `MembershipForm.tsx`;
- `MembershipDetail.tsx`;
- `MembershipHistoryPanel.tsx`;
- `MembershipStatusBadge.tsx`;
- `RenewMembershipForm.tsx`;
- `MembershipFilters.tsx`.

Componenti pagamenti:

- `PaymentTable.tsx`;
- `PaymentCardList.tsx`;
- `PaymentForm.tsx`;
- `PaymentStatusBadge.tsx`;
- `PaymentMethodBadge.tsx`;
- `ArchivePaymentDialog.tsx`.

Componenti riutilizzabili utili:

- `CurrencyField.tsx`;
- `DateField.tsx`;
- `SummaryStat.tsx`;
- `EmptyState.tsx`, gia' presente;
- `FormSubmitButton.tsx`, gia' presente.

Regole UI:

- file componenti React in `PascalCase.tsx`;
- desktop con tabelle compatte e filtri visibili;
- mobile con card e azioni principali accessibili;
- label sempre visibili;
- badge con testo esplicito, non solo colore;
- nessuna UI per email, sponsor, eventi o report in M2.

## 13. Service layer previsto

Servizi di dominio:

- `src/services/membership-plans.service.ts`;
- `src/services/memberships.service.ts`;
- `src/services/payments.service.ts`.

Tipi:

- `src/types/membership.ts`;
- `src/types/payment.ts`;
- eventuale aggiornamento dei tipi Supabase generati solo nella PR operativa M2.

Funzioni piani:

- `getMembershipPlans()`;
- `getActiveMembershipPlans()`;
- `getMembershipPlanById()`;
- `createMembershipPlan()`;
- `updateMembershipPlan()`;
- `archiveMembershipPlan()`.

Funzioni memberships:

- `getMemberships()`;
- `getMembershipById()`;
- `getMembershipsByMemberId()`;
- `createMembership()`;
- `renewMembership()`;
- `cancelMembership()`;
- `archiveMembership()`;
- `getCurrentMembershipForMember()`;
- `getMembershipStatusForMember()`.

Funzioni pagamenti:

- `getPaymentsByMembershipId()`;
- `createPayment()`;
- `updatePayment()`, solo se ammessa come correzione operativa;
- `archivePayment()`;
- `calculatePaidAmount()`;
- `calculatePaymentStatus()`.

Regole service:

- nessun delete fisico;
- query standard filtrano `archived_at is null`;
- rinnovo sempre tramite `createMembership` o `renewMembership`, mai update della riga precedente;
- dopo ogni mutazione pagamento, rileggere la membership per restituire importo e stato aggiornati;
- ogni server action riesegue controllo admin server-side.

## 14. RLS previste

RLS deve essere abilitata su:

- `public.membership_plans`;
- `public.memberships`;
- `public.payments`.

Policy baseline:

- `SELECT` consentito solo ad admin attivi;
- `INSERT` consentito solo ad admin attivi;
- `UPDATE` consentito solo ad admin attivi;
- nessuna policy `DELETE`;
- nessun accesso anonimo;
- nessuna tabella pubblica.

Helper:

- usare `app_private.is_active_admin()`;
- non creare funzioni security definer nello schema `public`;
- eventuali nuove funzioni devono avere `search_path` esplicito e privilegi minimi.

Nota su soft delete:

- archiviazione tramite `UPDATE archived_at`;
- RLS deve consentire update ad admin attivi;
- la UI non deve esporre delete fisico.

## 15. Trigger previsti

Trigger tecnici:

- `set_membership_plans_updated_at`;
- `set_memberships_updated_at`;
- `set_payments_updated_at`.

Trigger di coerenza pagamenti:

- ricalcolo `memberships.paid_amount` dopo insert/update/archiviazione di `payments`;
- ricalcolo `memberships.payment_status` insieme a `paid_amount`;
- considerare solo pagamenti non archiviati;
- mantenere lo stato coerente anche in caso di pagamenti multipli.

Trigger o funzione stato iscrizione:

- opzione A: mantenere `memberships.status` aggiornabile da service layer e validato da job/manuale;
- opzione B: calcolare lo stato associativo da date e `cancelled`, evitando refresh automatici;
- prima della PR operativa M2 va confermata la scelta.

Scelta consigliata:

- usare `status = cancelled` come stato persistito manuale;
- derivare `active`/`expired` nelle query applicative dalla data corrente;
- evitare trigger dipendenti da `current_date` che diventano obsoleti senza update.

## 16. Seed previsti

Seed piani iscrizione:

- `Ordinaria`: `minimum_fee = 30.00`, `default_duration_months = 12`;
- `Agevolata`: `minimum_fee = 15.00`, `default_duration_months = 6`;
- `Sostenitore`: `minimum_fee = 30.00`, `default_duration_months = 12`.

Regole seed:

- seed idempotente;
- non creare soci;
- non creare membership;
- non creare pagamenti;
- non modificare seed ruoli M1;
- non creare dati sponsor/eventi/email/report.

## 17. Test previsti

Verifiche locali:

- `npm run lint`;
- `npm run build`;
- eventuale `npm test` se M2 introduce test runner.

Test unitari:

- calcolo `payment_status`;
- calcolo `paid_amount`;
- calcolo `end_date` da piano e durata;
- validazione importi;
- validazione range date;
- creazione rinnovo come nuova riga;
- derivazione stato associativo del socio.

Test service/integration:

- creazione piano iscrizione;
- archiviazione piano e non selezionabilita' per nuove membership;
- creazione membership da piano;
- creazione membership con quota personalizzata;
- creazione membership con durata personalizzata;
- rinnovo che crea nuova riga;
- verifica che la membership precedente resta invariata;
- registrazione pagamento parziale;
- registrazione pagamento totale;
- registrazione pagamento eccedente;
- archiviazione pagamento con ricalcolo importi.

Test RLS:

- anon non legge e non scrive;
- Auth-only non legge e non scrive;
- admin inattivo non legge e non scrive;
- admin archiviato non legge e non scrive;
- admin attivo legge e scrive secondo policy M2;
- nessuna policy DELETE presente.

Test UI/manuali:

- `/settings/membership-plans` protetta;
- `/memberships` protetta;
- creazione piano;
- creazione iscrizione;
- rinnovo da socio o membership;
- registrazione pagamento;
- storico iscrizioni visibile nella scheda socio;
- mobile con card e form usabili a 360px;
- badge pagamento leggibili;
- messaggi errore chiari.

Verifiche Supabase:

- migration list dopo apply M2 nella futura PR operativa;
- presenza sole tabelle M0 + M1 + M2;
- assenza tabelle sponsor/eventi/email/report;
- RLS attiva su tutte le tabelle M2;
- policy attese presenti;
- trigger `updated_at` presenti;
- trigger ricalcolo pagamento validati;
- Security Advisor senza nuovi warning SQL/RLS.

## 18. Acceptance criteria

M2 sara' accettabile quando:

- il progetto resta avviabile in locale;
- `membership_plans`, `memberships` e `payments` sono presenti e coerenti con la documentazione;
- non sono state introdotte tabelle sponsor, eventi, email, report o dashboard completa;
- i piani iscrizione sono gestibili da admin attivi;
- i piani archiviati/non attivi non sono selezionabili per nuove iscrizioni;
- un socio puo' avere storico di piu' membership;
- ogni rinnovo crea una nuova riga `memberships`;
- la membership precedente non viene estesa o riutilizzata;
- quote minime e quote personalizzate funzionano;
- durate personalizzate funzionano;
- pagamenti parziali, totali ed eccedenti aggiornano `paid_amount` e `payment_status`;
- `members.status` resta solo anagrafico;
- lo stato associativo e la scadenza derivano da `memberships`;
- nessun pagamento ha valore contabile/fiscale;
- RLS blocca anon, Auth-only, admin inattivi e admin archiviati;
- RLS consente accesso ad admin attivi;
- nessuna policy DELETE esiste sulle tabelle M2;
- UI desktop usa tabelle;
- UI mobile usa card;
- lint e build passano;
- documentazione e checklist M2 risultano aggiornate nella PR operativa.

## 19. Rischi

- Incoerenza tra `payments`, `paid_amount` e `payment_status` se non si usa un meccanismo centralizzato di ricalcolo.
- Ambiguita' con `expected_fee = 0`, da definire prima dell'implementazione.
- Rinnovi implementati come update della riga precedente: vietato dalla decisione documentata.
- Sovrapposizioni tra membership dello stesso socio non gestite o non segnalate.
- Confusione tra `members.status` e stato associativo.
- Piani modificati retroattivamente invece di usare snapshot sulla membership.
- Archiviazione pagamenti senza ricalcolo della membership.
- UI troppo densa nella scheda socio se storico iscrizioni e pagamenti vengono mostrati senza struttura.
- RLS incompleta sulle nuove tabelle.
- Nuove funzioni SQL senza hardening `search_path`.
- Introduzione accidentale di scadenze M4, dashboard M3 completa o report M8 durante M2.

## 20. Out of scope

M2 non deve includere:

- sponsor;
- eventi;
- email;
- report;
- dashboard completa;
- monitoraggio scadenze M4;
- invio promemoria;
- export elenco scadenze;
- contabilita';
- fatture;
- IVA;
- prima nota;
- bilanci;
- pagamenti online;
- area soci;
- app mobile nativa.

Tabelle fuori scope da non creare in M2:

- `sponsors`;
- `events`;
- `sponsor_contributions`;
- `event_sponsors`;
- `email_templates`;
- `email_campaigns`;
- `email_campaign_recipients`;
- `audit_logs`;
- viste o report di dashboard completa.

Route fuori scope da non rendere operative in M2:

- `/expirations`;
- `/sponsors`;
- `/events`;
- `/email`;
- `/reports`.

## Definition of Done documentale per avvio M2

Prima di iniziare codice o migration M2:

- rileggere questo documento;
- confermare regola `expected_fee = 0`;
- confermare gestione di membership sovrapposte;
- confermare se `memberships.status` persiste solo `cancelled` come eccezione o se viene mantenuto anche per `active`/`expired`;
- confermare se e come sono ammesse correzioni amministrative su membership gia' create;
- creare una PR operativa M2 separata da questa PR documentale.
