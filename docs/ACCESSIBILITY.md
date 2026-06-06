# ACCESSIBILITY.md

# PonteNext Management Portal – Accessibility Guidelines

Versione: 1.0

---

# 1. Obiettivo

Garantire che la piattaforma sia usabile anche da utenti con esigenze di accessibilità base.

---

# 2. Regole generali

- usare HTML semantico
- label sempre associate agli input
- focus visibile
- contrasto adeguato
- navigazione da tastiera funzionante
- non basare informazioni solo sul colore

---

# 3. Form

Ogni input deve avere:

- label
- stato errore
- messaggio errore leggibile

Esempio:

```text
Email
[ campo input ]
Inserisci un indirizzo email valido.
```

---

# 4. Bottoni

- testo chiaro
- evitare solo icone senza label accessibile
- dimensione minima consigliata su mobile: 44px

---

# 5. Tabelle

Le tabelle devono usare:

- header corretti
- celle leggibili
- azioni con label accessibili

---

# 6. Colori e stati

Ogni badge deve avere testo esplicito.

Esempio corretto:

```text
Pagato
```

Esempio insufficiente:

```text
solo pallino verde
```

---

# 7. Modali

Le modali devono:

- avere titolo
- avere descrizione se l'azione è critica
- poter essere chiuse
- mantenere il focus interno

---

# 8. Regole per Codex

- Non generare input senza label.
- Non generare bottoni solo con icona senza aria-label.
- Non usare colore come unico indicatore.
- Usare componenti accessibili di shadcn/ui dove possibile.
