# M2 Review Report - Memberships & Payments

## Esito

Review tecnica della PR #13 eseguita su branch `codex/m2-memberships-payments`, senza modificare codice applicativo, senza applicare migration e senza modificare Supabase.

Esito complessivo:

```text
APPROVATA PER MERGE
```

La PR M2 rispetta lo scope dichiarato:

- migration operative limitate a `membership_plans`, `memberships`, `payments`;
- rinnovi rappresentati come nuove righe `memberships`;
- pagamenti non contabili collegati alla singola membership;
- `paid_amount` e `payment_status` mantenuti dai trigger sui pagamenti;
- route M2 protette dal layout admin e da server action con controllo admin;
- nessuna introduzione di dashboard completa, sponsor, eventi, email o report.

## Controlli Eseguiti

### 1. Scope migration M2

Le migration M2 creano solo:

```text
public.membership_plans
public.memberships
public.payments
```

Non risultano `create table`, `create view` o migration operative per sponsor, eventi, email, report, audit log o dashboard.

### 2. Regola rinnovi storici

La regola e' rispettata.

Evidenze:

- `memberships` e' modellata come tabella storica;
- `renewMembership()` delega a `createMembership()`;
- la creazione/rinnovo usa `insert` su `memberships`;
- non risultano update di `start_date`, `end_date`, quote o durata per estendere una membership esistente;
- la UI usa `/memberships/new?memberId=...` per rinnovo, coerente con nuova riga storica.

### 3. Trigger `paid_amount` e `payment_status`

La logica e' coerente.

`refresh_membership_payment_totals()`:

- si attiva dopo `insert`, `update`, `delete` su `payments`;
- somma solo `payments.amount` con `archived_at is null`;
- aggiorna `memberships.paid_amount`;
- gestisce anche lo spostamento di un pagamento tra membership diverse.

`set_membership_payment_status()`:

- si attiva su insert/update di `memberships`;
- ricalcola `payment_status` a partire da `expected_fee` e `paid_amount`;
- non lascia il valore al controllo manuale della UI.

### 4. Soft delete payment

La soft delete del payment e' coerente.

L'action applicativa archivia un pagamento con:

```text
payments.archived_at = now()
```

Questo e' un `update` su `payments`, quindi attiva `refresh_membership_payment_totals()`. La funzione esclude i pagamenti archiviati dalla somma e aggiorna la membership collegata.

### 5. Stati pagamento

La gestione degli stati e' corretta:

- `unpaid`: `paid_amount = 0` e `expected_fee > 0`;
- `partial`: `paid_amount > 0` e `paid_amount < expected_fee`;
- `paid`: `paid_amount = expected_fee`;
- `overpaid`: `paid_amount > expected_fee`;
- caso `expected_fee = 0` e `paid_amount = 0`: trattato come `paid`, documentato in checklist/report M2.

### 6. Assenza dati contabili/fiscali

La PR non introduce contabilita', fatturazione, IVA, prima nota o bilanci.

`payments` contiene solo dati operativi non contabili:

- `payment_date`;
- `amount`;
- `method`;
- `reference`;
- `notes`;
- `created_by`.

Non risultano campi fiscali o contabili in M2.

### 7. RLS e policy

RLS e policy sono coerenti con M0/M1:

- RLS attiva su `membership_plans`, `memberships`, `payments`;
- policy `SELECT`, `INSERT`, `UPDATE` solo per `authenticated`;
- controllo tramite `app_private.is_active_admin()`;
- nessuna policy `DELETE`;
- `anon` revocato;
- funzioni M2 con `search_path` esplicito vuoto e privilegi revocati a `public`, `anon`, `authenticated`.

### 8. UI e out of scope

La UI M2 introduce solo:

- `/memberships`;
- `/memberships/new`;
- `/memberships/[id]`;
- `/settings/membership-plans`;
- storico iscrizioni in `/members/[id]`.

Non vengono rese operative route o UI per:

- sponsor;
- eventi;
- email;
- report;
- dashboard completa;
- scadenze M4.

Le voci fuori scope restano disabilitate nella navigazione.

### 9. Protezione route M2

Le route M2 sono sotto `src/app/(admin)` e quindi passano da `AdminLayout`, che esegue `requireActiveAdmin()`.

Inoltre le server action M2 eseguono `requireActiveAdmin()` prima di ogni mutazione:

- creazione/rinnovo/annullamento/archiviazione membership;
- creazione/archiviazione payment;
- creazione/modifica/archiviazione membership plan.

### 10. Seed membership plans

Il seed e' coerente con `DATABASE_DESIGN.md`:

```text
Ordinaria    30.00  12 mesi
Agevolata    15.00   6 mesi
Sostenitore  30.00  12 mesi
```

Il seed e' idempotente tramite `on conflict (name) do update`.

## Problemi Bloccanti

Nessun problema bloccante rilevato.

## Problemi Non Bloccanti

### NB-1 - `paid_amount` resta aggiornabile via policy `UPDATE` ampia

La UI e il service layer non espongono una modifica manuale di `paid_amount`, e i trigger sui `payments` funzionano correttamente.

Tuttavia, a livello database, la policy `memberships_update_active_admin` consente update generico agli admin attivi. Un admin autenticato con accesso diretto alle API Supabase potrebbe aggiornare `memberships.paid_amount` senza passare da `payments`.

Valutazione:

```text
non bloccante per M2
```

Motivo: il flusso applicativo M2 non espone questa operazione e la regola richiesta sui trigger payment e' rispettata.

### NB-2 - Sovrapposizione tra membership dello stesso socio non bloccata

M2 propone il rinnovo con `start_date` pari al giorno successivo alla membership piu' recente non annullata, ma non impone un vincolo database contro sovrapposizioni tra membership dello stesso socio.

Valutazione:

```text
non bloccante per M2
```

Motivo: il piano M2 lasciava questa scelta come decisione futura; la regola vincolante sul rinnovo come nuova riga e' rispettata.

### NB-3 - `archivePaymentAction` non verifica l'accoppiata `membershipId`/`paymentId`

L'action riceve `membershipId` e `paymentId`, archivia il payment per id e poi revalida i path della membership passata.

Il trigger database ricalcola comunque la membership reale del pagamento archiviato, quindi la consistenza dati resta corretta. In caso di chiamata manuale con parametri non coerenti, il rischio e' soprattutto di revalidazione UI incompleta.

Valutazione:

```text
non bloccante per M2
```

## Raccomandazioni

1. Valutare in una milestone successiva una protezione piu' forte del campo `memberships.paid_amount`, ad esempio con privilegi colonna, RPC controllata o trigger che ripristini il totale dai pagamenti su update diretto.
2. Decidere formalmente se bloccare o solo segnalare sovrapposizioni tra membership dello stesso socio.
3. Rendere `archivePaymentAction` piu' difensiva recuperando il payment prima dell'archiviazione o validando che appartenga alla membership corrente.
4. Mantenere esplicita nella documentazione la decisione `expected_fee = 0` + `paid_amount = 0` => `paid`.
5. Rieseguire gli advisor Supabase dopo traffico reale: gli `unused_index` su tabelle appena create sono attesi ma vanno rivalutati quando l'uso cresce.

## Decisione Finale

```text
MERGE: SI
```

La PR #13 puo' essere portata a review finale/merge dal punto di vista tecnico M2.

Motivazione:

- nessun blocker sui requisiti richiesti;
- scope M2 rispettato;
- regola storica dei rinnovi rispettata;
- trigger pagamento coerenti;
- RLS coerente con M0/M1;
- nessuna funzionalita' fuori scope introdotta;
- i rilievi residui sono miglioramenti difensivi non bloccanti.
