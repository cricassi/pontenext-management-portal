# CHANGELOG.md

## 0.3.0

- Avviata milestone M1 - Members & Roles
- Applicata migration `004_members_roles` al progetto Supabase live `PonteNext`
- Create tabelle `members`, `roles` e `member_roles` con vincoli, indici, RLS e trigger `updated_at`
- Aggiunto seed ruoli base idempotente
- Implementati CRUD soci, CRUD ruoli e assegnazione ruoli ai soci
- Abilitate route `/members`, `/members/new`, `/members/[id]`, `/members/[id]/edit`, `/settings` e `/settings/roles`
- Aggiunti service layer e validazioni form M1
- Aggiunta checklist `M1_CHECKLIST.md`
- Documentata validazione live Supabase M1

## 0.2.5

- Avviata milestone M0.9 - Bootstrap primo `super_admin` e login reale
- Documentata la procedura operativa di creazione utente Supabase Auth e bootstrap `admin_users`
- Validato login live per Auth-only, `super_admin` attivo, admin inattivo e admin archiviato
- Aggiornato `LoginForm` per bloccare subito utenti Auth non presenti come admin attivi
- Documentato warning Auth residuo `auth_leaked_password_protection`
- Aggiunta checklist `M0_9_CHECKLIST.md`

## 0.2.4

- Avviata milestone M0.8 - Supabase Function Security Hardening
- Aggiunta migration `003_harden_admin_functions.sql`
- Hardened `set_updated_at` e helper admin con `search_path` esplicito e privilegi ridotti
- Spostato helper admin RLS in schema non esposto `app_private`
- Aggiornata la policy SELECT di `admin_users` per usare l'helper hardened
- Validato Security Advisor Supabase senza warning residui
- Riallineata la numerazione dei placeholder migration futuri per inserire `003_harden_admin_functions.sql`

## 0.2.3

- Applicate al progetto Supabase live `PonteNext` le migration M0 `001_extensions` e `002_admin_users`
- Validata la presenza di `public.admin_users`, dei vincoli, del trigger, della RLS e della policy SELECT iniziale
- Aggiornato `SUPABASE_VALIDATION_REPORT.md` con esito M0.7 e warning security advisor
- Aggiunta checklist `M0_7_CHECKLIST.md`

## 0.2.2

- Avviata milestone intermedia M0.5 - Supabase Verification
- Documentata la configurazione reale di `.env.local` per Supabase
- Documentata la procedura di bootstrap del primo `super_admin`
- Aggiunte checklist e guida Supabase per verifica di Auth, route protette e RLS iniziale

## 0.2.1

- Allineata la configurazione lint a Next.js 16 usando ESLint CLI
- Aggiornati README e checklist M0 con la command lint effettiva

## 0.2.0

- Avviata milestone M0 - Setup Infrastruttura
- Aggiunto scaffold Next.js App Router con TypeScript strict
- Configurati Tailwind CSS e shadcn/ui
- Aggiunta configurazione Supabase client/server
- Aggiunta pagina login amministratori e layout admin protetto
- Aggiunto middleware di protezione route amministrative
- Aggiunte migration M0 per estensione tecnica e `admin_users` minimo con RLS iniziale
- Aggiornati `.env.example`, README e checklist M0

## 0.1.1

- Recepita analisi progettuale in `ANALYSIS.md`
- Aggiornato M0 con `admin_users` minimo, bootstrap primo `super_admin`, route protette e RLS iniziale
- Chiarito che M3 Dashboard e' parziale e basata sui dati disponibili dopo M2
- Chiarito che M4 Scadenze non invia email e che i promemoria sono rimandati a M7
- Uniformata la convenzione dei componenti React a `PascalCase.tsx`
- Uniformate le route email definitive a `/email`, `/email/templates`, `/email/campaigns`
- Chiarito che `members.status` indica solo lo stato anagrafico e che lo stato associativo deriva da `memberships`
- Chiarito che `start_datetime` e `end_datetime` sono i campi canonici per gli eventi

## 0.1.0

- Creata struttura iniziale progetto
- Aggiunti documenti PRD, MD, ADR, database design, business rules, screen flow e UI guidelines
