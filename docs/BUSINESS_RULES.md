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

Ogni iscrizione deve avere:

- data inizio
- data fine
- quota minima
- quota prevista
- stato pagamento

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

M4 gestisce monitoraggio e rinnovo delle scadenze, ma non invia email. I promemoria email vengono introdotti solo in M7.

## BR-007 - Sponsor

Uno sponsor e' indipendente dai soci.

## BR-008 - Eventi

Uno sponsor puo' essere collegato a piu' eventi.

Un evento puo' avere piu' sponsor.

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
