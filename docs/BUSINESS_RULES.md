# BUSINESS_RULES.md

# PonteNext Management Portal – Business Rules

## BR-001 – Accesso

Solo Super Admin e Admin accedono al sistema.

I soci non hanno login.

## BR-002 – Soci

Un socio può esistere anche senza iscrizione attiva.

## BR-003 – Iscrizioni

Un socio può avere più iscrizioni nel tempo.

Ogni iscrizione deve avere:

- data inizio
- data fine
- quota minima
- quota prevista
- stato pagamento

## BR-004 – Quote

La quota minima è configurabile.

La quota effettiva può essere diversa dalla minima.

La durata può essere personalizzata.

## BR-005 – Pagamenti

Un pagamento appartiene sempre a una iscrizione.

Un'iscrizione può avere più pagamenti.

I pagamenti non hanno valore di contabilità fiscale.

## BR-006 – Scadenze

La scadenza deriva da `memberships.end_date`.

Non deve essere salvata nella tabella `members`.

## BR-007 – Sponsor

Uno sponsor è indipendente dai soci.

## BR-008 – Eventi

Uno sponsor può essere collegato a più eventi.

Un evento può avere più sponsor.

## BR-009 – Email

Ogni invio email deve salvare:

- campagna
- destinatari
- stato invio

## BR-010 – Soft delete

I record principali non devono essere cancellati fisicamente.

Usare `archived_at`.

## BR-011 – Contabilità

Non implementare:

- fatture
- IVA
- prima nota
- bilanci
- partita doppia
