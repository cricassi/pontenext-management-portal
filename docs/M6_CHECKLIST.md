# M6_CHECKLIST.md

# M6 - Events Checklist

## Scope

- [x] Creata migration M6 per `events`
- [x] Creata migration M6 per `event_sponsors`
- [x] Aggiunto `sponsor_contributions.event_id` nullable
- [x] Mantenuto valido il contributo sponsor senza evento
- [x] Esclusi email, report, dashboard avanzata, pagamenti online e contabilita'

## Database live PonteNext

- [x] Applicata `database/migrations/008_events.sql`
- [x] Applicata `database/migrations/009_sponsor_contributions.sql`
- [x] Verificata presenza `public.events`
- [x] Verificata presenza `public.event_sponsors`
- [x] Verificata colonna nullable `public.sponsor_contributions.event_id`
- [x] Verificati vincoli FK verso `events`, `sponsors` ed `event_sponsors`
- [x] Verificati indici M6
- [x] Verificati trigger `updated_at`
- [x] Verificato trigger `validate_sponsor_contribution_event_link`

## RLS

- [x] RLS attiva su `events`
- [x] RLS attiva su `event_sponsors`
- [x] Policy `SELECT` solo per admin attivi
- [x] Policy `INSERT` solo per admin attivi
- [x] Policy `UPDATE` solo per admin attivi
- [x] Nessuna policy `DELETE`

## Applicazione

- [x] Implementato service layer eventi
- [x] Implementate route `/events`
- [x] Implementata route `/events/new`
- [x] Implementata route `/events/[id]`
- [x] Implementata route `/events/[id]/edit`
- [x] Implementato CRUD eventi con soft delete
- [x] Implementato collegamento sponsor-eventi
- [x] Implementata visualizzazione contributi collegati a evento
- [x] Integrata scheda sponsor con eventi collegati
- [x] Integrato `event_id` nullable nel form contributi sponsor
- [x] Abilitata voce navigazione `Eventi`

## UI responsive

- [x] Lista eventi con tabella desktop
- [x] Lista eventi con card mobile
- [x] Sponsor evento con tabella desktop
- [x] Sponsor evento con card mobile
- [x] Contributi evento con tabella desktop
- [x] Contributi evento con card mobile
- [x] Empty state per eventi, sponsor evento e contributi evento

## Verifiche

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [x] Validazione live Supabase dopo applicazione migration
- [x] Browser check route protette

## Note

`npm run build` ha richiesto esecuzione fuori sandbox per errore ambientale
`spawn EPERM` durante la fase TypeScript di Next.js. Fuori sandbox la build e'
stata completata con successo e l'output include le route M6.

Browser check completato su dev server locale `http://127.0.0.1:3011`.
Senza sessione, `/events`, `/events/new`, `/events/[id]` e `/events/[id]/edit`
reindirizzano correttamente a `/login` e non producono console error.
