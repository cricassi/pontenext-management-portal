# COMPONENTS_GUIDE.md

# PonteNext Management Portal – Components Guide

Versione: 1.0

---

# 1. Obiettivo

Definire i componenti ricorrenti da usare nella piattaforma.

Codex deve preferire componenti riutilizzabili invece di duplicare codice nelle pagine.

---

# 2. Layout Components

## AppShell

Contiene:

- sidebar desktop
- header mobile
- area contenuto

## Sidebar

Menu principale desktop.

## MobileNav

Menu hamburger mobile.

## PageHeader

Usato in ogni pagina.

Contiene:

- titolo pagina
- descrizione breve
- azione primaria

---

# 3. Data Components

## DataTable

Per viste desktop.

Funzioni:

- colonne configurabili
- loading state
- empty state
- azioni riga

## MobileRecordCard

Base per card mobile.

## SearchInput

Campo ricerca standard.

## FilterBar

Filtri desktop.

## MobileFiltersSheet

Filtri mobile.

---

# 4. Domain Components

## MemberCard

Card mobile socio.

## MemberStatusBadge

Badge stato socio/iscrizione.

## MembershipStatusBadge

Badge stato iscrizione.

## PaymentStatusBadge

Badge stato pagamento.

## SponsorCard

Card sponsor.

## EventCard

Card evento.

---

# 5. Form Components

## FormSection

Sezione logica di un form.

## FormActions

Azioni finali del form.

## ConfirmArchiveDialog

Conferma archiviazione record.

---

# 6. Feedback Components

## EmptyState

Per elenchi vuoti.

Props:

- title
- description
- actionLabel
- actionHref/actionCallback

## LoadingState

Per caricamento dati.

## ErrorState

Per errore recupero dati.

---

# 7. Naming Convention

Componenti React:

```text
PascalCase
```

File componenti:

```text
kebab-case.tsx
```

Esempio:

```text
member-card.tsx
payment-status-badge.tsx
```

---

# 8. Regole per Codex

- Creare componenti riutilizzabili.
- Non duplicare badge e card tra moduli.
- Ogni componente deve avere props tipizzate TypeScript.
- Separare componenti generici e componenti di dominio.
