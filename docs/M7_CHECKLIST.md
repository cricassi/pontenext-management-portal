# PonteNext Management Portal - M7 Checklist

## Scope

M7 implementa template email, campagne, destinatari e invio confermato tramite
Resend.

Project ref Supabase:

```text
uhxfpsamenjhyrfgwckw
```

## Incluso

- [x] Migration `010_email.sql`
- [x] Tabella `email_templates`
- [x] Tabella `email_campaigns`
- [x] Tabella `email_campaign_recipients`
- [x] Template email attivi/archiviati
- [x] Campagne con stati `draft`, `sent`, `failed`
- [x] Snapshot destinatari separato dalla creazione campagna
- [x] Invio separato dalla generazione destinatari
- [x] Invio con conferma admin esplicita
- [x] Provider Resend usato solo lato server
- [x] Variabili ambiente `RESEND_API_KEY` ed `EMAIL_FROM` documentate senza valori reali
- [x] Segmento tutti i soci
- [x] Segmento soci attivi derivato da `memberships`
- [x] Segmento soci scaduti derivato da `memberships`
- [x] Segmento sponsor
- [x] Segmento custom/manuale
- [x] Deduplica destinatari per campagna
- [x] Storico email effettivamente usata
- [x] Stato destinatario `pending`, `sent`, `failed`, `skipped`
- [x] Salvataggio `provider_message_id` quando disponibile
- [x] UI responsive desktop/mobile per template
- [x] UI responsive desktop/mobile per campagne
- [x] UI responsive desktop/mobile per destinatari

## Escluso

- [x] Nessun report
- [x] Nessuna dashboard avanzata
- [x] Nessuna area soci
- [x] Nessun pagamento online
- [x] Nessuna contabilita'
- [x] Nessuna fatturazione
- [x] Nessuna IVA
- [x] Nessuna prima nota
- [x] Nessuna automazione schedulata
- [x] Nessun cron job
- [x] Nessun uso di Gmail personale
- [x] Nessuna API key salvata nel database
- [x] Nessuna API key esposta al browser

## Database live PonteNext

- [x] Applicata migration `010_email`
- [x] Verificata presenza `public.email_templates`
- [x] Verificata presenza `public.email_campaigns`
- [x] Verificata presenza `public.email_campaign_recipients`
- [x] Verificate colonne M7 principali
- [x] Verificati vincoli M7 principali
- [x] Verificati indici M7
- [x] Verificati trigger `updated_at`
- [x] Verificata assenza tabelle report

## RLS

- [x] RLS attiva su `email_templates`
- [x] RLS attiva su `email_campaigns`
- [x] RLS attiva su `email_campaign_recipients`
- [x] Policy `SELECT` solo per admin attivi
- [x] Policy `INSERT` solo per admin attivi
- [x] Policy `UPDATE` solo per admin attivi
- [x] Nessuna policy `DELETE`

## Applicazione

- [x] Implementato service layer template email
- [x] Implementato service layer campagne email
- [x] Implementato service layer destinatari email
- [x] Implementato service provider Resend server-side
- [x] Implementata route `/email`
- [x] Implementata route `/email/templates`
- [x] Implementata route `/email/campaigns`
- [x] Nessuna route `/email/templates/new`
- [x] Nessuna route `/email/campaigns/new`
- [x] Nessuna route `/email/campaigns/[id]`
- [x] Route email protette con `requireActiveAdmin()`
- [x] Abilitata voce navigazione `Email`
- [x] Voce `Report` lasciata fuori scope

## Verifiche

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [x] Validazione live Supabase dopo applicazione migration
- [x] Browser/HTTP check route protette

## Note operative

L'invio reale richiede `RESEND_API_KEY` ed `EMAIL_FROM` configurati in
`.env.local` o nelle variabili ambiente di deploy. La chiave non deve essere
committata, stampata nei log o esposta al client.

L'opt-out self-service pubblico non viene introdotto in M7. La tabella
`email_campaign_recipients` contiene i campi necessari per gestire opt-out
tokenizzati o manuali in modo evolutivo, ma nessuna route pubblica e' stata
aggiunta in questa milestone.

`npm run build` nel sandbox ha compilato correttamente ma si e' fermato su
`spawn EPERM`, limite ambientale gia' osservato nelle milestone precedenti. La
build rieseguita fuori sandbox e' passata e l'output include `/email`,
`/email/templates` e `/email/campaigns`.

Browser check: il controller Browser diretto non era esposto in questa sessione.
Il dev server locale e' stato avviato fuori sandbox su `http://127.0.0.1:3017`
per superare `spawn EPERM`; via HTTP sono stati verificati `/login` con status
`200` e le route `/email`, `/email/templates`, `/email/campaigns` con redirect
`307` a `/login` senza sessione.
