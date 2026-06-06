# RESPONSIVE_RULES.md

# PonteNext Management Portal – Responsive Rules

Versione: 1.0

---

# 1. Obiettivo

La piattaforma deve essere realmente utilizzabile da:

- smartphone
- tablet
- desktop

Non deve limitarsi a ridurre la larghezza delle tabelle.

---

# 2. Breakpoint

Usare i breakpoint Tailwind standard:

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

# 3. Comportamento per dispositivo

## Mobile < 768px

- header superiore
- menu hamburger
- contenuto a card
- un campo form per riga
- bottoni principali grandi
- niente sidebar fissa
- niente tabelle larghe non gestibili

## Tablet 768px – 1023px

- menu collassabile
- layout 1 o 2 colonne
- tabelle con scroll se necessario
- filtri comprimibili

## Desktop >= 1024px

- sidebar fissa
- tabelle complete
- filtri visibili
- layout a più colonne dove utile

---

# 4. Tabelle adattive

Su desktop usare tabelle.

Su mobile convertire in card.

Non affidarsi solo a `overflow-x-auto` per le viste principali.

`overflow-x-auto` è accettabile solo per report o tabelle secondarie.

---

# 5. Form adattivi

## Desktop

Form a 2 colonne quando utile.

## Mobile

Form a 1 colonna.

Pulsanti principali:

```text
width: 100%
```

---

# 6. Dialog e Sheet

Su desktop:

- usare Dialog per modali brevi

Su mobile:

- usare Sheet o pagine dedicate
- evitare modali troppo alte

---

# 7. Filtri

Su desktop:

- filtri visibili sopra tabella

Su mobile:

- ricerca sempre visibile
- filtri avanzati dentro Sheet

---

# 8. Azioni

Su desktop:

- azioni in dropdown menu nella riga tabella

Su mobile:

- azioni principali visibili nella card
- azioni secondarie in menu

---

# 9. Dashboard

## Desktop

Grid KPI a 4 colonne.

## Tablet

Grid KPI a 2 colonne.

## Mobile

Grid KPI a 1 colonna.

---

# 10. Regole per Codex

- Ogni pagina deve essere testata mentalmente su 360px di larghezza.
- Non creare sidebar fissa su mobile.
- Non creare tabelle ingestibili su mobile.
- Preferire card e sezioni verticali su smartphone.
- Ogni pulsante importante deve essere facile da toccare.
