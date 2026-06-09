# M7 - Post-Merge Verification Report

Data verifica: 2026-06-09

Contesto:

- PR verificata: `#30 - M7 - Email & Campaigns`
- Stato PR: mergiata su `main`
- Merge commit: `e6d2d85`
- Branch report: `codex/m7-post-merge-verification`
- Progetto Supabase: `PonteNext`
- Project ref: `uhxfpsamenjhyrfgwckw`

## Esito

La verifica post-merge M7 ha esito positivo.

Decisione: `main` risulta allineato con Supabase live per M7.

Durante questa verifica:

- non e' stato modificato codice applicativo;
- non sono state create migration;
- non sono state applicate migration;
- non e' stato modificato Supabase;
- non e' stata avviata M8;
- non sono state inviate email reali.

## Repository

La verifica e' stata eseguita dopo il merge effettivo di PR `#30` su `main`.

Route M7 presenti nel repository:

- `/email` tramite `src/app/(admin)/email/page.tsx`;
- `/email/templates` tramite `src/app/(admin)/email/templates/page.tsx`;
- `/email/campaigns` tramite `src/app/(admin)/email/campaigns/page.tsx`.

## Supabase Live

Validazione eseguita in sola lettura sul progetto Supabase `PonteNext`
(`uhxfpsamenjhyrfgwckw`).

Migration applicata:

- `010_email`: presente nella lista migration live.

Tabelle email presenti:

- `public.email_templates`;
- `public.email_campaigns`;
- `public.email_campaign_recipients`.

RLS:

| Tabella | RLS |
| --- | --- |
| `public.email_templates` | attiva |
| `public.email_campaigns` | attiva |
| `public.email_campaign_recipients` | attiva |

Policy:

- `SELECT`, `INSERT`, `UPDATE` presenti sulle tre tabelle email;
- policy limitate al ruolo `authenticated`;
- policy basate su `app_private.is_active_admin()`;
- nessuna policy `DELETE` rilevata.

Conteggio policy DELETE M7:

```text
0
```

## Route Protette

Analisi statica completata.

Le pagine M7 chiamano `requireActiveAdmin()` prima dei fetch sensibili:

- `src/app/(admin)/email/page.tsx`;
- `src/app/(admin)/email/templates/page.tsx`;
- `src/app/(admin)/email/campaigns/page.tsx`.

Le server action M7 in `src/app/(admin)/email/actions.ts` chiamano
`requireActiveAdmin()` prima di mutazioni, generazione destinatari o invio.

## Resend

Analisi statica completata.

Esito: OK.

- Resend e' importato solo in `src/services/email-provider.service.ts`;
- `new Resend(process.env.RESEND_API_KEY)` e' usato solo nel service server-side;
- `resend.emails.send` e' chiamato solo dal service server-side;
- non risultano variabili `NEXT_PUBLIC_RESEND_*`;
- non risultano log di `RESEND_API_KEY`;
- non e' stata effettuata alcuna chiamata reale a Resend durante questa verifica.

## API Key Ed Env

Esito: OK.

File tracciati da Git con riferimenti env:

- solo `.env.example` e documentazione;
- nessun `.env.local` tracciato;
- nessuna API key Resend committata.

`.env.example` contiene le variabili previste e vuote:

```env
RESEND_API_KEY=
EMAIL_FROM=
```

`EMAIL_FROM` e' configurabile tramite variabile ambiente.

## Segmenti

Esito: OK.

Segmenti M7 presenti in `src/types/email.ts` e nel service destinatari:

- `all_members` per tutti i soci;
- `active_members` per soci attivi;
- `expired_members` per soci scaduti;
- `sponsors` per sponsor;
- `custom` per custom/manuale.

I segmenti soci attivi e soci scaduti sono derivati da `memberships`, non da
`members.status`.

## Storico Destinatari

Esito: OK.

Lo storico destinatari e' presente tramite `email_campaign_recipients`.

Campi/stati rilevanti presenti:

- email effettivamente usata per destinatario;
- `recipient_name`;
- `recipient_type`;
- `status`;
- `provider_message_id`;
- `error_message`;
- `sent_at`;
- `consent_basis_snapshot`;
- `opted_out_at`.

La campagna salva snapshot di `subject` e `body` direttamente in
`email_campaigns`.

## Stati

Esito: OK.

Stati campagna M7 presenti:

- `draft`;
- `sent`;
- `failed`.

Stati destinatario presenti:

- `pending`;
- `sent`;
- `failed`;
- `skipped`.

## Verifiche Locali

### npm run lint

Esito: OK.

Nota ambientale:

- una prima esecuzione nel sandbox e' andata in timeout senza produrre errori
  ESLint;
- la verifica e' stata ripetuta fuori sandbox ed e' passata.

### npx tsc --noEmit

Esito: OK.

### npm run build

Esito: OK fuori sandbox.

Nota ambientale:

- nel sandbox la build compila correttamente ma fallisce nella fase successiva
  con `Error: spawn EPERM`;
- la build e' stata ripetuta fuori sandbox ed e' passata.

L'output build conferma le route M7:

- `/email`;
- `/email/campaigns`;
- `/email/templates`.

## Browser / Dev Server

La verifica browser/dev-server non e' stata eseguita in questa PR documentale.

Motivo:

- la richiesta post-merge richiede verifiche locali, analisi statica e
  validazione Supabase read-only;
- nelle review M7 precedenti l'ambiente aveva gia' mostrato limiti su
  `Start-Process`/`spawn`;
- per questa verifica non e' stato avviato alcun dev server e non e' stata
  inviata alcuna email reale.

Le route protette sono state verificate tramite analisi statica e confermate
dall'output di build.

## Out Of Scope

Non sono stati rilevati:

- M8;
- report;
- dashboard avanzata;
- area soci;
- contabilita';
- fatturazione;
- IVA;
- prima nota;
- nuove migration;
- modifiche Supabase.

## Rischi Residui

Rischi non bloccanti gia' documentati in `docs/M7_REVIEW_REPORT.md`:

- opt-out operativo/self-service da formalizzare in milestone futura;
- eventuale sanitizzazione/troncamento degli errori provider prima della
  persistenza;
- advisor performance Supabase su FK admin M7 non indicizzate, non bloccante
  finche' non emergono query operative su quei campi.

## Conclusione

M7 risulta correttamente mergiata su `main`, applicata su Supabase live e
verificata post-merge.

La verifica finale e' positiva.
