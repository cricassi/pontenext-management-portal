# M0_9_CHECKLIST.md

# PonteNext Management Portal - M0.9 Checklist

## Scope

M0.9 completa la validazione end-to-end di Supabase Auth e autorizzazione admin prima di M1.

Project ref:

```text
uhxfpsamenjhyrfgwckw
```

## Vincoli rispettati

- [x] Nessun avvio M1
- [x] Nessuna tabella soci creata
- [x] Nessun CRUD creato
- [x] Nessuna modifica al modello dati oltre auth/admin
- [x] Nessuna funzionalita' non necessaria aggiunta

## Procedura operativa

- [x] Documentata creazione primo utente Supabase Auth
- [x] Documentata query bootstrap `public.admin_users`
- [x] Documentata sostituzione/rotazione dell'utente di validazione con super_admin reale

## Validazione live Supabase

- [x] Progetto `PonteNext` verificato
- [x] Migration list verificata
- [x] Security Advisor Supabase rieseguito
- [x] Warning funzioni M0.8 non piu' presenti
- [x] Warning Auth `auth_leaked_password_protection` documentato come residuo operativo
- [x] Utente Auth-only di validazione creato
- [x] Utente `super_admin` di validazione creato
- [x] `admin_users` bootstrap verificato
- [x] Login Auth-only verificato
- [x] Auth-only negato dal guard admin
- [x] Login `super_admin` attivo verificato
- [x] `super_admin` attivo consentito dal guard admin
- [x] `super_admin` con `status = 'inactive'` negato dal guard admin
- [x] `super_admin` con `archived_at` valorizzato negato dal guard admin
- [x] `super_admin` di validazione ripristinato ad active/non archiviato

## Correzione login/admin guard

- [x] `LoginForm` verifica `admin_users` attivo dopo `signInWithPassword`
- [x] `LoginForm` esegue sign out se l'utente Auth non e' admin attivo
- [x] Middleware admin invariato come protezione server-side
- [x] Layout admin invariato come protezione server-side

## Verifiche

- [x] `npm run lint`
- [x] `npm run build`
- [x] Validazione live Supabase REST/Auth
- [x] Validazione live Supabase SQL/RLS
