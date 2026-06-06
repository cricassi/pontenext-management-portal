# M0_CHECKLIST.md

# PonteNext Management Portal - M0 Checklist

## Scope

M0 prepara l'infrastruttura tecnica e la base minima di sicurezza amministrativa.

## Incluso

- [x] Progetto Next.js con App Router
- [x] TypeScript strict
- [x] Tailwind CSS
- [x] shadcn/ui configurato con `components.json`, CSS variables e componenti UI base
- [x] Struttura `src/` coerente con la documentazione
- [x] Supabase client browser
- [x] Supabase client server
- [x] Login amministratori con Supabase Auth
- [x] Middleware di protezione route amministrative
- [x] Layout amministrativo protetto
- [x] Migration minima `admin_users`
- [x] RLS iniziale su `admin_users`
- [x] Strategia bootstrap primo `super_admin` documentata
- [x] `.env.example` aggiornato
- [x] README aggiornato con setup locale

## Escluso

- [x] Nessun CRUD soci
- [x] Nessuna dashboard completa
- [x] Nessun modulo sponsor
- [x] Nessun modulo eventi
- [x] Nessun modulo email
- [x] Nessun modulo report
- [x] Nessuna area soci
- [x] Nessuna contabilita'

## Route M0

- `/login`
- `/dashboard`

Le altre voci di navigazione sono visibili come struttura futura ma disabilitate.

## Bootstrap primo super_admin

1. Creare l'utente in Supabase Auth.
2. Applicare `001_extensions.sql` e `002_admin_users.sql`.
3. Inserire il record in `public.admin_users` con ruolo `super_admin` usando SQL editor, CLI o script con service role.
4. Accedere da `/login`.

## Verifiche richieste

- [x] `npm install`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Avvio locale con `npm run dev`
- [x] Verifica shadcn/ui con `npx shadcn@latest info`
- [x] Verifica HTTP `/login` con risposta `200`
- [x] Verifica HTTP `/dashboard` senza sessione con redirect `307` verso `/login`
- [ ] Verifica browser desktop
- [ ] Verifica browser mobile

Nota: il Browser plugin non era disponibile in questa sessione. Il fallback Playwright bundled non e' stato utilizzabile per assenza di `playwright-core`; la verifica visuale resta da completare quando uno strumento browser e' disponibile.
