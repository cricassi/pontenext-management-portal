# BUSINESS_RULES.md

# PonteNext Management Portal - Business Rules

## BR-001 - Accesso

Solo Super Admin e Admin accedono al sistema.

I soci non hanno login.

M0 deve includere `admin_users` minimo, bootstrap del primo `super_admin`, route protette e RLS iniziale.

## BR-002 - Soci

Un socio puo' esistere anche senza iscrizione attiva.

`members.status` indica solo lo stato anagrafico del socio:

- `active`
- `inactive`
- `archived`

Lo stato associativo del socio e' derivato dalle iscrizioni presenti in `memberships`.

## BR-003 - Iscrizioni

Un socio puo' avere piu' iscrizioni nel tempo.

Ogni rinnovo crea una nuova riga nella tabella `memberships`.

Le iscrizioni esistenti non devono essere modificate, estese o riutilizzate per rappresentare un rinnovo successivo.

Ogni iscrizione deve avere:

- data inizio
- data fine
- quota minima
- quota prevista
- stato pagamento

La storia associativa del socio si ricostruisce leggendo le righe `memberships` ordinate per periodo di validita'.

## BR-004 - Quote

La quota minima e' configurabile.

La quota effettiva puo' essere diversa dalla minima.

La durata puo' essere personalizzata.

## BR-005 - Pagamenti

Un pagamento appartiene sempre a una iscrizione.

Un'iscrizione puo' avere piu' pagamenti.

I pagamenti non hanno valore di contabilita' fiscale.

## BR-006 - Scadenze

La scadenza deriva da `memberships.end_date`.

Non deve essere salvata nella tabella `members`.

Alla scadenza, il rinnovo non prolunga la riga esistente: deve essere registrata una nuova iscrizione con proprio periodo, quota e stato pagamento.

M4 gestisce monitoraggio e rinnovo delle scadenze, ma non invia email. I promemoria email vengono introdotti solo in M7.

## BR-007 - Sponsor

Uno sponsor e' indipendente dai soci.

Uno sponsor puo' esistere senza contributi.

Uno sponsor puo' avere zero, uno o piu' contributi.

Un contributo appartiene sempre a uno sponsor.

I contributi possono essere monetari o non monetari.

Regole contributi:

- i contributi monetari richiedono `amount > 0`;
- i contributi non monetari possono avere `amount = 0`;
- i contributi non monetari richiedono `description`;
- i contributi non generano contabilita';
- i contributi non generano fatturazione;
- i contributi non generano IVA;
- i contributi non generano prima nota.

Da M6 `sponsor_contributions.event_id` e' ammesso solo come campo nullable.

Un contributo senza evento resta valido.

Un contributo con `event_id` rappresenta un contributo specifico collegato a un evento, ma non genera logica contabile, fiscale o di fatturazione.

## BR-008 - Eventi

Un evento puo' esistere senza sponsor.

Uno sponsor puo' essere collegato a piu' eventi.

Un evento puo' avere piu' sponsor.

`event_sponsors` rappresenta il legame operativo sponsor-evento.

`sponsor_contributions.event_id` rappresenta un contributo specifico collegato a un evento.

Un collegamento sponsor-evento non implica automaticamente un contributo.

Un contributo collegato a un evento deve appartenere a uno sponsor valido e gia' collegato a quell'evento.

Per gli eventi, `start_datetime` e `end_datetime` sono i campi canonici. La data evento mostrata in UI deve derivare da `start_datetime`.

## BR-009 - Email

Ogni invio email deve salvare:

- campagna
- destinatari
- stato invio

I promemoria scadenze via email appartengono alla milestone M7.

## BR-010 - Soft delete

I record principali non devono essere cancellati fisicamente.

Usare `archived_at`.

## BR-011 - Contabilita'

Non implementare:

- fatture
- IVA
- prima nota
- bilanci
- partita doppia
