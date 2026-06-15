# M9 Hardening Report

Data verifica: 2026-06-16

## Scopo

Milestone M9 - Final Hardening.

Obiettivo: verificare lo stato finale pre-uso operativo reale di PonteNext Management Portal dopo M0-M8, Brand Refresh e deploy Vercel.

Vincoli rispettati:

- nessuna nuova funzionalita';
- nessuna migration creata;
- nessuna modifica a Supabase;
- nessuna modifica a Vercel;
- nessun dato live modificato;
- nessuna email reale inviata.

## Esito complessivo

Esito: **approvato con raccomandazioni**.

Non sono stati rilevati blocker. Sono stati corretti gap documentali a basso rischio:

- creata `docs/MIGRATION_AND_BACKUP.md`;
- creata `docs/POST_DEPLOY_VERIFICATION_REPORT.md`;
- aggiornata la sezione di manutenzione documentale in `docs/CODEX_INSTRUCTIONS.md`;
- aggiornato `README.md` da M7 a stato M9;
- aggiornato `docs/CHANGELOG.md`.

## Stato repository

- Branch audit: `codex/m9-final-hardening`
- Base main verificata: `dcdfb12efc73fb3f5373e9bdacd18107879c5133`
- Commit breve: `dcdfb12`
- Messaggio: `Merge pull request #39 from cricassi/codex/brand-refresh-verification`

## Sicurezza applicativa

Esito: **OK**.

Verifiche:

- layout admin `src/app/(admin)/layout.tsx` chiama `requireActiveAdmin()`;
- route/action sensibili usano `requireActiveAdmin()` prima dei fetch o mutazioni;
- `/reports/export` chiama `requireActiveAdmin()` prima di leggere `formData`;
- nessun uso di `SUPABASE_SERVICE_ROLE_KEY` in `src`;
- nessun valore reale di API key rilevato nel repository;
- `RESEND_API_KEY` usata solo server-side in `src/services/email-provider.service.ts`;
- nessuna chiamata `.delete()` applicativa rilevata nei service;
- export con `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.

Nota minor: il middleware aggiunge `reason=inactive_admin` quando un utente Auth non passa il controllo admin. Non espone dati personali, ma in futuro si puo' valutare un messaggio unico per ridurre ulteriormente segnali diagnostici lato URL.

## Supabase

Esito: **OK con raccomandazioni**.

Progetto verificato:

```text
PonteNext
project ref: uhxfpsamenjhyrfgwckw
```

Migration live:

```text
001_extensions
002_admin_users
003_harden_admin_functions
004_members_roles
005_membership_plans
006_memberships_payments
007_sponsors
008_events
009_sponsor_contributions
010_email
```

Tabelle applicative verificate con RLS attiva:

- `admin_users`
- `members`
- `roles`
- `member_roles`
- `membership_plans`
- `memberships`
- `payments`
- `sponsors`
- `sponsor_contributions`
- `events`
- `event_sponsors`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`

Policy:

- policy solo per `authenticated`;
- accesso basato su `app_private.is_active_admin()`;
- nessuna policy `DELETE` rilevata.

Funzioni SQL verificate:

- `app_private.is_active_admin`: `security definer`, `search_path=""`;
- `public.set_updated_at`: `search_path=""`;
- `public.refresh_membership_payment_totals`: `search_path=""`;
- `public.set_membership_payment_status`: `search_path=""`;
- `public.validate_sponsor_contribution_event_link`: `search_path=""`.

Security Advisor:

- `auth_leaked_password_protection`: warning. Leaked password protection disabilitata in Supabase Auth.
- Remediation Supabase: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Performance Advisor:

- foreign key senza indice dedicato:
  - `public.email_campaigns.email_campaigns_created_by_fkey`;
  - `public.email_campaigns.email_campaigns_sent_by_fkey`;
  - `public.email_templates.email_templates_created_by_fkey`.
- diversi `unused_index` informativi su tabelle nuove o poco popolate.

Decisione: nessuna modifica database in M9. Gli indici mancanti richiedono migration futura e non sono blocker operativi con i volumi attuali.

## Auth

Esito: **OK con verifica parziale read-only**.

Verifiche statiche/live:

- `/login` raggiungibile su Vercel;
- route admin senza sessione reindirizzano a `/login?next=...`;
- middleware verifica utente Auth e riga `admin_users` attiva/non archiviata;
- `requireActiveAdmin()` usa `status = active` e `archived_at is null`;
- bootstrap `super_admin` documentato in README, `SUPABASE_SETUP.md` e `MIGRATION_AND_BACKUP.md`.

Non sono stati modificati utenti live per testare stati `inactive` o `archived`.

Raccomandazione: verificare in Supabase dashboard che gli Auth redirect URLs includano il dominio Vercel live e gli eventuali domini futuri.

## Email

Esito: **OK**.

Verifiche:

- Resend usato solo lato server;
- `RESEND_API_KEY` non ha prefisso `NEXT_PUBLIC_`;
- `.env.example` contiene solo nomi variabili vuoti;
- invio campagna separato dalla creazione;
- invio richiede conferma admin;
- destinatari deduplicati tramite service layer;
- storico destinatari e email effettivamente usata presenti nel modello M7;
- nessuna email reale inviata durante M9.

## Export

Esito: **OK**.

Verifiche:

- route `/reports` protetta dal layout admin e da `requireActiveAdmin()`;
- route `/reports/export` protetta con `requireActiveAdmin()`;
- nessun uso service role per export;
- nessun PDF;
- CSV e XLSX soltanto;
- nessun file scritto su disco;
- limite `REPORT_ROW_LIMIT = 5_000`;
- CSV con mitigazione formula injection;
- XLSX generato in memoria.

## UI/UX

Esito: **OK**.

Verifiche:

- Brand Refresh presente;
- login brandizzata;
- sidebar/header brandizzati;
- contenuto gestionale chiaro;
- browser smoke test su `/login` desktop senza overflow orizzontale;
- browser smoke test mobile 390px su `/login` senza overflow orizzontale;
- browser smoke test mobile 390px su redirect `/reports` verso login senza overflow;
- nessun errore console nel browser smoke test.

## Performance

Esito: **OK con raccomandazioni**.

Build Next.js completata.

Route dinamiche principali presenti:

- `/dashboard`
- `/members`
- `/memberships`
- `/expirations`
- `/sponsors`
- `/events`
- `/email`
- `/reports`
- `/reports/export`

Raccomandazioni:

- valutare indici sulle foreign key email segnalate dal Performance Advisor;
- rivalutare `REPORT_ROW_LIMIT = 5_000` dopo dati reali;
- non rimuovere indici `unused_index` ora: lo schema e' recente e i volumi live sono minimi.

## Backup e migrazione

Esito iniziale: **gap documentale**.

Problema rilevato:

- `docs/MIGRATION_AND_BACKUP.md` assente;
- `docs/CODEX_INSTRUCTIONS.md` non includeva regola di manutenzione backup/migration.

Fix M9:

- creata `docs/MIGRATION_AND_BACKUP.md`;
- aggiornata `docs/CODEX_INSTRUCTIONS.md` con sezione `Migration and Backup Documentation Maintenance`.

## Documentazione operativa

Esito: **corretta in M9**.

Problemi rilevati:

- `README.md` ancora fermo a M7;
- `docs/POST_DEPLOY_VERIFICATION_REPORT.md` assente;
- `docs/MIGRATION_AND_BACKUP.md` assente.

Fix M9:

- README aggiornato a M9/M8/Brand Refresh;
- post-deploy report creato;
- changelog aggiornato.

## Verifiche tecniche

| Verifica | Esito |
| --- | --- |
| `npm run lint` | OK |
| `npx tsc --noEmit` | OK |
| `npm run build` | OK fuori sandbox |
| Build sandbox | fallita con `spawn EPERM`, limite ambientale |
| Supabase Security Advisor | 1 warning Auth non bloccante |
| Supabase Performance Advisor | info su FK email e unused index |
| Vercel live read-only | OK |
| Browser check read-only | OK |

## Problemi bloccanti

Nessuno.

## Problemi important

1. Supabase Auth leaked password protection disabilitata.
   - Tipo: configurazione Supabase Auth.
   - Stato: non modificata per vincolo M9.
   - Azione consigliata: abilitare da Supabase Dashboard prima dell'uso operativo reale.

2. Foreign key email senza indice dedicato.
   - Tipo: performance.
   - Stato: non modificato per vincolo no schema/migration.
   - Azione consigliata: creare migration futura per indici su `email_templates.created_by`, `email_campaigns.created_by`, `email_campaigns.sent_by` se confermato dal carico reale.

## Problemi minor

- `unused_index` multipli: informativi, coerenti con schema recente e dati live minimi.
- Redirect Auth URLs non ispezionabili direttamente via MCP: da verificare manualmente se cambiano domini.
- Parametro `reason=inactive_admin` nel redirect: accettabile, ma si puo' rendere piu' generico in hardening futuro.

## Decisione finale

M9 approvata: **si**, con raccomandazioni non bloccanti.

Uso operativo reale: possibile dopo abilitazione consigliata della leaked password protection e verifica manuale Auth redirect URLs in dashboard Supabase.
