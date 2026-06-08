# M7 - Email & Campaigns Review Report

Data review: 2026-06-08

Branch/PR verificata:

- PR: `#30 - M7 - Email & Campaigns`
- Branch: `codex/m7-email-campaigns`
- Commit iniziale review: `60f77e1`
- Progetto Supabase: `PonteNext`
- Project ref: `uhxfpsamenjhyrfgwckw`

## Esito

La review tecnica finale della PR `#30` ha esito positivo.

Decisione finale: **merge si**.

Non sono stati rilevati problemi bloccanti.

Durante la review:

- non sono state inviate email reali;
- non sono state applicate migration;
- non e' stato modificato Supabase;
- non sono state apportate modifiche al codice applicativo;
- e' stato aggiunto solo questo report documentale.

## Scope M7

Esito: OK.

La PR introduce solo lo scope M7 previsto:

- `email_templates`;
- `email_campaigns`;
- `email_campaign_recipients`;
- template email;
- campagne email in stato `draft`, `sent`, `failed`;
- destinatari campagna;
- segmenti iniziali;
- invio tramite Resend solo dopo conferma admin.

Non risultano introdotti:

- report;
- dashboard avanzata;
- area soci;
- contabilita';
- fatturazione;
- IVA;
- prima nota.

La migration `database/migrations/010_email.sql` crea solo le tre tabelle email
M7 e non contiene tabelle report, audit log, dashboard o contabilita'.

## Resend

Esito: OK.

Controlli effettuati:

- `resend` e' importato solo in `src/services/email-provider.service.ts`;
- `new Resend(process.env.RESEND_API_KEY)` e' usato solo lato server;
- `RESEND_API_KEY` non usa prefisso `NEXT_PUBLIC_`;
- nessun valore reale di `RESEND_API_KEY` risulta committato;
- `.env.local` non risulta tracciato da Git;
- `.env.example` contiene le variabili Resend vuote:
  - `RESEND_API_KEY=`
  - `EMAIL_FROM=`
- `EMAIL_FROM` e' letto da `process.env.EMAIL_FROM`;
- non risultano `console.log` o `console.error` che stampano la API key.

Nota: `.env.example` contiene commenti descrittivi e un esempio testuale di
formato mittente, ma le variabili Resend sono vuote e non contengono valori reali.

## Sicurezza Invio

Esito: OK.

La creazione campagna e l'invio sono separati:

- `createEmailCampaignAction` crea una bozza;
- `updateEmailCampaignAction` modifica solo bozze;
- `generateCampaignRecipientsAction` genera lo snapshot destinatari senza
  inviare email;
- `sendEmailCampaignAction` invia solo se il form contiene `confirmSend`;
- `sendEmailCampaign` blocca l'invio se `confirmed` e' falso;
- la UI mostra anteprima, conteggi destinatari e checkbox obbligatoria prima
  del submit di invio.

La review non ha eseguito alcuna chiamata al provider Resend e non ha attivato
alcuna server action di invio.

## Storico

Esito: OK.

La PR salva lo storico richiesto:

- `email_campaigns.subject` e `email_campaigns.body` sono snapshot della
  campagna;
- ogni destinatario in `email_campaign_recipients` salva l'email effettivamente
  usata;
- gli stati campagna ammessi sono `draft`, `sent`, `failed`;
- gli stati destinatario ammessi sono `pending`, `sent`, `failed`, `skipped`;
- `provider_message_id`, `sent_at` ed `error_message` sono previsti per lo
  storico invio per destinatario.

La campagna diventa `sent` se almeno un destinatario viene inviato con successo;
se tutti i destinatari falliscono viene marcata `failed`.

## Segmenti

Esito: OK.

Segmenti implementati:

- tutti i soci;
- soci attivi;
- soci scaduti;
- sponsor;
- custom/manuale.

Controlli principali:

- soci attivi e scaduti sono derivati da `memberships`, non da `members.status`;
- soci archiviati sono esclusi dai segmenti derivati;
- sponsor archiviati e sponsor non `active` sono esclusi dal segmento sponsor;
- destinatari senza email valida non vengono inseriti nello snapshot;
- deduplica su email normalizzata;
- indice unico live su `(campaign_id, lower(email))`;
- opt-out pregressi esclusi tramite `opted_out_at`.

Nota non bloccante: i record sorgente senza email o con email invalida vengono
esclusi prima della deduplica; di conseguenza il conteggio `skippedCount` mostra
gli esclusi intercettati dalla fase di deduplica/opt-out, non necessariamente
tutti i record sorgente privi di email.

## RLS

Esito: OK.

Validazione Supabase live eseguita in sola lettura.

Risultati:

- migration `010_email` applicata;
- `public.email_templates` presente con RLS attiva;
- `public.email_campaigns` presente con RLS attiva;
- `public.email_campaign_recipients` presente con RLS attiva;
- policy `SELECT`, `INSERT`, `UPDATE` presenti per ruolo `authenticated`;
- policy basate su `app_private.is_active_admin()`;
- nessuna policy `DELETE`;
- nessuna tabella `reports`, `report_definitions` o `audit_logs`;
- trigger `updated_at` presenti sulle tre tabelle email.

Advisor Supabase:

- security: nessun warning specifico M7 su tabelle email o policy; resta un
  warning globale Auth `Leaked Password Protection Disabled`, gia' fuori scope
  M7;
- performance: advisor segnala alcune FK non indicizzate su campi admin M7
  (`email_templates.created_by`, `email_campaigns.created_by`,
  `email_campaigns.sent_by`) come `INFO`, non bloccanti per M7.

## Privacy

Esito: OK con raccomandazioni.

La PR evita duplicazioni e invii a record operativi non validi:

- deduplica destinatari per email normalizzata;
- unique index per email per campagna;
- esclusione destinatari senza email valida;
- esclusione soci/sponsor archiviati nei segmenti derivati;
- gestione errori per destinatario;
- storico email effettivamente usata.

Raccomandazioni non bloccanti:

- valutare in una milestone successiva una UI/processo operativo per impostare
  opt-out manuali o endpoint tokenizzato;
- valutare sanitizzazione/troncamento degli errori provider prima di salvarli
  in `error_message`, per ridurre il rischio di dettagli tecnici o dati non
  necessari nello storico.

## Route Guard

Esito: OK.

Analisi statica:

- `/email`: `requireActiveAdmin()` chiamato prima di `getEmailTemplates()` e
  `getEmailCampaigns()`;
- `/email/templates`: `requireActiveAdmin()` chiamato prima dei fetch template;
- `/email/campaigns`: `requireActiveAdmin()` chiamato prima dei fetch campagne,
  template, destinatari e stato provider;
- tutte le server action M7 chiamano `requireActiveAdmin()` prima di mutazioni o
  invio.

## Verifiche Eseguite

Verifiche locali:

- `npm run lint`: OK;
- `npx tsc --noEmit`: OK;
- `npm run build`: OK fuori sandbox.

Dettaglio build:

- in sandbox `npm run build` compila correttamente ma fallisce nella fase
  successiva con `Error: spawn EPERM`;
- rieseguito fuori sandbox con autorizzazione, `npm run build` passa;
- output build conferma le route:
  - `/email`;
  - `/email/campaigns`;
  - `/email/templates`.

Verifiche statiche alternative:

- route guard M7 controllate staticamente;
- uso Resend controllato staticamente;
- env controllato staticamente;
- scope migration controllato staticamente;
- nessuna email reale inviata durante la review.

## Browser / Dev Server

Esito: non completato per limite ambientale.

La verifica browser/dev-server non e' stata completata in questa review per
limiti dell'ambiente locale:

- `npm run build` in sandbox cade con `spawn EPERM` dopo la compilazione;
- i tentativi di avvio processo per il server locale hanno incontrato limite
  PowerShell/ambiente su `Start-Process` con errore:
  `Chiave nel dizionario: 'Path'. Chiave aggiunta: 'PATH'`;
- su richiesta dell'utente, non e' stato piu' usato `Start-Process` e la review
  e' proseguita senza browser/dev-server.

Verifiche alternative completate:

- build produzione passata fuori sandbox;
- output build conferma le route M7;
- analisi statica route guard completata;
- analisi statica Resend/env completata;
- validazione Supabase read-only completata.

## Problemi Bloccanti

Nessuno.

## Problemi Non Bloccanti

1. Advisor performance Supabase segnala FK admin M7 non indicizzate su:
   - `email_templates.created_by`;
   - `email_campaigns.created_by`;
   - `email_campaigns.sent_by`.

   Non blocca M7 perche' lo scope attuale non prevede query operative su questi
   campi, ma puo' essere valutato in futuro se servono audit o filtri per admin.

2. Gli errori provider sono salvati come messaggio operativo. Non risultano
   chiavi stampate o esposte, ma in produzione conviene sanitizzare/troncare i
   messaggi provider prima di persisterli.

3. La gestione opt-out e' predisposta a livello schema/query, ma resta da
   formalizzare un flusso operativo o self-service dedicato.

## Raccomandazioni

- Mantenere Resend esclusivamente nel service server-side.
- Non introdurre invii automatici o scheduled send senza nuova milestone.
- Valutare una migration futura per gli indici FK admin solo se emergono query
  reali su `created_by`/`sent_by`.
- Valutare un follow-up privacy per opt-out manuale/tokenizzato.

## Decisione Finale

**Merge si.**

La PR `#30` rispetta lo scope M7, non introduce funzionalita' fuori scope, non
espone la API key Resend, mantiene l'invio separato dalla creazione campagna,
salva lo storico destinatari e supera lint, typecheck, build e validazione
Supabase read-only.
