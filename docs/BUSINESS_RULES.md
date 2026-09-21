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

Regole M7:

- creare una campagna non invia email;
- generare destinatari non invia email;
- l'invio richiede conferma esplicita di un admin;
- ogni campagna salva lo snapshot storico dei destinatari;
- ogni destinatario salva l'email effettivamente usata;
- gli stati campagna M7 sono `draft`, `sent`, `failed`;
- l'invio usa Resend esclusivamente lato server;
- `RESEND_API_KEY` non deve essere salvata nel database, esposta al browser,
  stampata nei log o committata;
- i soci non hanno account e non accedono al sistema;
- nessun invio automatico, scheduled send o cron viene introdotto in M7.

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

## BR-012 - Visibilita' globale dei campi, prevista M10-A

La configurazione dei campi e' una preferenza UI globale, non un permesso:
soltanto visible/hidden e soltanto per campi facoltativi. Obbligatori e
controlli condizionalmente necessari al workflow non possono essere nascosti.
Admin attivi leggono/applicano; solo super_admin attivi modificano/reset.

Ordine operativo M10: **B -> A1 -> A2 -> C**. M10-A Field Visibility e'
suddivisa in A1 Field Visibility Foundation (tabella/RLS/helper, registro,
resolver e Impostazioni, nessuna schermata business modificata) e A2 Field
Visibility Rollout (integrazione progressiva e adeguamento mapper/update).
L'applicazione alle schermate inizia soltanto in A2, dopo i test di non perdita
dati per il relativo modulo; la sola foundation non nasconde alcun campo business.

Un campo nascosto mantiene il valore nel DB. Negli update i campi assenti non
diventano null, false, zero o FK scollegate. Le create usano esclusivamente
default gia' previsti/null per facoltativi. Le impostazioni di visibilita' non
cambiano report, export, email, segmentazioni o il formato import soci.

## BR-013 - Portabilita' Excel e soli nuovi soci, prevista M10-B/C

Piano: [M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md](M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md).
M10-B completata e verificata post-merge; M10-C non implementata.
Precedente import multi-tabella annullato.

M10-B Complete Excel Export precede A1/A2 per rendere disponibile uno snapshot
read-only prima delle modifiche ai form; M10-C New Members Excel Import viene
implementata per ultima, essendo l'unica fase che inserisce nuove anagrafiche
business. Lo snapshot non costituisce autorizzazione a modificare o ripristinare dati.

- Export completo e import soci sono operazioni distinte riservate a super_admin
  attivi, con verifica server-side e RLS.
- `pontenext-full-export-v1` esporta le tabelle business previste anche archiviate,
  non segreti/Auth; non e' un dump o un file di restore.
- `pontenext-new-members-import-v1` contiene solo README e members. Il workbook
  completo e' rifiutato dall'import, non elaborato parzialmente.
- L'import crea solo nuove righe members mediante un unico INSERT atomico.
  Mai UPDATE, UPSERT, DELETE, MERGE, archiviazione o riattivazione di soci.
- Nome e cognome obbligatori; UUID/timestamp dal DB, status active dal server,
  country vuoto -> Italia, archived_at null. Campi tecnici dal file vietati.
- Un errore o duplicato certo blocca tutto; un possibile duplicato richiede
  presa visione. Email non considerata univoca; fiscale normalizzato uguale
  trattato come conflitto anche per record inattivi/archiviati.
- Dry-run senza scritture, preview normalizzata, hash/ricevuta verificati e
  conferma sono obbligatori; nessun inserimento parziale o retry automatico.
- Non crea ruoli, assegnazioni, iscrizioni, quote, pagamenti, account o email.
  Le relazioni vengono gestite successivamente con le funzioni ordinarie.
- Test separati prima del live. Codex richiede `IMPORT NUOVI SOCI LIVE APPROVATO`
  riferito allo stesso file/hash validato prima del primo import reale.
