# CHANGELOG.md

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
