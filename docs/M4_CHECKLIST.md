# PonteNext Management Portal - M4 Checklist

## Scope

M4 implementa una dashboard operativa e non direzionale basata solo sui dati gia'
disponibili dopo M1, M2 e M3.

Project ref Supabase:

```text
uhxfpsamenjhyrfgwckw
```

## Incluso

- [x] Route protetta `/dashboard` aggiornata dal placeholder M0
- [x] Service layer read-only `dashboard.service.ts`
- [x] Tipi dashboard `dashboard.ts`
- [x] KPI soci attivi
- [x] KPI scadenze entro 30 giorni
- [x] KPI membership scadute
- [x] KPI quote non completamente pagate
- [x] KPI nuovi soci ultimi 30 giorni
- [x] KPI rinnovi ultimi 30 giorni
- [x] Widget `Da gestire subito`
- [x] Widget `Prossime scadenze`
- [x] Widget `Ultimi rinnovi`
- [x] Azione rapida `Nuovo socio`
- [x] Azione rapida `Nuova membership`
- [x] Azione rapida `Rinnovo rapido`
- [x] Empty states per dashboard senza dati operativi
- [x] Tabella desktop per elenchi dashboard
- [x] Card mobile per elenchi dashboard
- [x] Card KPI responsive

## Escluso

- [x] Nessuna nuova tabella
- [x] Nessuna migration M4
- [x] Nessuna vista SQL o materialized view
- [x] Nessuna modifica al database Supabase
- [x] Nessuno sponsor
- [x] Nessun evento
- [x] Nessuna email
- [x] Nessun report
- [x] Nessun export
- [x] Nessuna dashboard direzionale
- [x] Nessuna contabilita'

## Regole M4

- [x] `members.status` usato solo come stato anagrafico
- [x] Scadenze derivate da `memberships.end_date`
- [x] Conteggi scadenza basati sull'ultima membership rinnovabile per socio
- [x] Membership archiviate escluse dai KPI operativi
- [x] Membership annullate escluse dai KPI operativi
- [x] Soci archiviati esclusi dai KPI operativi
- [x] Quote aperte derivate da `payment_status in ('unpaid', 'partial')`
- [x] Rinnovi recenti derivati da nuove righe `memberships`
- [x] Nessuna membership precedente modificata o estesa
- [x] Rinnovo rapido come link al flusso M3/M2 esistente

## Componenti M4

- [x] `DashboardKpiGrid.tsx`
- [x] `DashboardSection.tsx`
- [x] `QuickActionsPanel.tsx`
- [x] `DashboardActionItems.tsx`
- [x] `UpcomingExpirations.tsx`
- [x] `RecentRenewals.tsx`

## Service layer

- [x] `getDashboardPageData()`
- [x] Conteggi soci attivi e nuovi soci ultimi 30 giorni
- [x] Query membership non archiviate e non annullate
- [x] Derivazione ultima membership rinnovabile per socio
- [x] Derivazione scadenze e scaduti
- [x] Derivazione quote non completamente pagate
- [x] Derivazione rinnovi ultimi 30 giorni
- [x] Liste limitate per widget dashboard

## Validazione live Supabase

- [x] Progetto `PonteNext` verificato
- [x] Project ref `uhxfpsamenjhyrfgwckw` verificato
- [x] Migration list verificata
- [x] Confermate solo migration fino a M2 (`001`-`006`)
- [x] Tabelle public verificate
- [x] RLS attiva sulle tabelle operative
- [x] Nessuna vista public presente
- [x] Nessuna tabella sponsor/eventi/email/report/dashboard presente
- [x] Conteggi live dashboard verificati in sola lettura

Conteggi live al momento della validazione M4:

```text
members: 0
active_members: 0
roles: 7
membership_plans: 3
memberships: 0
payments: 0
new_members_last_30_days: 0
renewals_last_30_days: 0
incomplete_payments: 0
expired_memberships: 0
within_30_memberships: 0
```

## Verifiche locali

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [ ] Verifica browser locale `/login`
- [ ] Verifica browser locale `/dashboard` senza sessione
- [ ] Verifica rendering mobile dashboard

## Note

Il database live non contiene ancora soci, membership o pagamenti operativi. La
dashboard M4 e' quindi validata principalmente su KPI a zero, seed ruoli/piani
presenti ed empty states.

La verifica browser locale non e' stata completata in questa sessione per blocco
ambientale del bind del dev server:

```text
listen UNKNOWN: unknown error 127.0.0.1:3000
listen UNKNOWN: unknown error 127.0.0.1:3001
listen UNKNOWN: unknown error 0.0.0.0:3002
```

La build Next.js conferma comunque la route dinamica `/dashboard`.
