# M0_5_CHECKLIST.md

# PonteNext Management Portal - M0.5 Checklist

## Scope

M0.5 verifica Supabase prima di iniziare M1.

## Incluso

- [x] Documentazione aggiornata in `/docs` letta integralmente
- [x] Migration `admin_users` verificata rispetto a `DATABASE_DESIGN.md`
- [x] RLS iniziale su `admin_users` verificata staticamente
- [x] `.env.example` verificato e documentato
- [x] README aggiornato con configurazione `.env.local`
- [x] Bootstrap primo `super_admin` documentato
- [x] `docs/SUPABASE_SETUP.md` creato
- [x] Login Supabase Auth verificato a livello di codice
- [x] Middleware route protette verificato a livello di codice
- [x] Layout admin protetto verificato a livello di codice

## Escluso

- [x] Nessun avvio M1
- [x] Nessun CRUD soci
- [x] Nessuna dashboard completa
- [x] Nessun modulo sponsor
- [x] Nessun modulo eventi
- [x] Nessun modulo email
- [x] Nessun modulo report
- [x] Nessuna modifica al modello dati

## Esito verifica Supabase

- [x] `admin_users` contiene i campi minimi richiesti da `DATABASE_DESIGN.md`
- [x] `auth_user_id` collega `admin_users` a `auth.users(id)`
- [x] `role` limita i valori a `super_admin` e `admin`
- [x] `status` limita i valori a `active` e `inactive`
- [x] `archived_at` supporta soft delete
- [x] RLS e' abilitata su `admin_users`
- [x] La policy SELECT consente lettura al proprio record o ad admin attivi
- [x] Insert/update/delete restano senza policy in M0.5
- [x] Bootstrap primo `super_admin` passa da owner/service role
- [x] Login e route protette richiedono Supabase Auth e admin attivo

## Verifica live

- [ ] Connessione live a Supabase verificata con `.env.local`

Nota: in questa checkout `.env.local` non e' presente. La verifica live deve essere eseguita in un ambiente di sviluppo con credenziali Supabase reali, seguendo `docs/SUPABASE_SETUP.md`.

## Verifiche richieste

- [x] `npm run lint`
- [x] `npm run build`

Nota build: nel sandbox la build Next.js 16 compila ma fallisce durante TypeScript con `spawn EPERM`; la verifica e' stata completata rieseguendo `npm run build` fuori sandbox.
