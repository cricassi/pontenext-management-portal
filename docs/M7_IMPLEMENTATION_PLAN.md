# M7 - Email & Campaigns Implementation Plan

## Stato del documento

Questo documento prepara la milestone M7 senza avviarla operativamente.

Questa PR e' solo documentale:

- non scrive codice applicativo;
- non crea migration operative;
- non modifica Supabase;
- non applica nulla al progetto Supabase live.

## Stato reale del database verificato

Validazione Supabase PonteNext eseguita in sola lettura sul progetto
`uhxfpsamenjhyrfgwckw`.

Migration applicate:

- `001_extensions`
- `002_admin_users`
- `003_harden_admin_functions`
- `004_members_roles`
- `005_membership_plans`
- `006_memberships_payments`
- `007_sponsors`
- `008_events`
- `009_sponsor_contributions`

Tabelle `public` presenti:

- `admin_users`
- `members`
- `roles`
- `member_roles`
- `membership_plans`
- `memberships`
- `payments`
- `sponsors`
- `sponsor_contributions`
- `events`
- `event_sponsors`

Tutte le tabelle presenti hanno RLS attiva.

Non risultano presenti:

- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`
- `reports`
- `report_definitions`
- `audit_logs`

Conteggi live rilevanti:

| Tabella | Righe |
| --- | ---: |
| `members` | 0 |
| `memberships` | 0 |
| `membership_plans` | 3 |
| `sponsors` | 0 |
| `events` | 0 |
| `event_sponsors` | 0 |
| `sponsor_contributions` | 0 |

`database/migrations/010_email.sql` e' ancora placeholder e non e' stata
modificata da questo piano.

## Fonti provider consultate

Per la scelta provider sono state verificate fonti ufficiali Resend il
2026-06-07:

- [Resend per Next.js](https://resend.com/nextjs)
- [Resend pricing](https://resend.com/docs/knowledge-base/what-is-resend-pricing)
- [Resend unsubscribe link](https://resend.com/docs/knowledge-base/should-i-add-an-unsubscribe-link)
- [Resend email consent](https://resend.com/docs/knowledge-base/what-counts-as-email-consent)
- [Resend API keys](https://resend.com/docs/knowledge-base/how-to-handle-api-keys)

## 1. Scope M7

M7 introduce il sistema di comunicazioni email amministrative del portale.

In scope:

- template email;
- campagne email;
- destinatari campagna con snapshot storico;
- segmenti destinatari iniziali;
- creazione campagne in bozza;
- generazione destinatari separata dalla creazione campagna;
- invio email solo dopo conferma esplicita admin;
- storico invii per destinatario;
- gestione errori per destinatario e campagna;
- provider email esterno configurato server-side;
- privacy, consenso e opt-out almeno a livello operativo iniziale;
- route amministrative `/email`, `/email/templates`, `/email/campaigns`;
- service layer dedicato;
- UI responsive desktop/mobile;
- RLS admin-only sulle nuove tabelle.

M7 deve includere:

- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`

Regole vincolanti:

- nessun invio automatico senza conferma admin;
- ogni campagna salva lo storico destinatari;
- ogni destinatario salva l'email effettivamente usata;
- i soci non hanno account e non accedono al sistema;
- l'invio email e' separato dalla creazione campagna;
- le campagne possono restare in bozza;
- le campagne possono essere marcate come `draft`, `sent` o `failed`;
- evitare spam e duplicazioni destinatari;
- non usare Gmail personale per invii massivi;
- non committare API key;
- configurare solo variabili ambiente in `.env.example` nella futura PR
  operativa M7.

Nota su `scheduled`:

`DATABASE_DESIGN.md` cita anche `scheduled` tra gli stati campagna. La richiesta
M7 corrente non prevede invio pianificato o automatico. Il piano M7 deve quindi
implementare solo `draft`, `sent` e `failed`; eventuale `scheduled` resta fuori
scope e andra' reintrodotto solo con una milestone dedicata ad automazioni/cron.

## 2. Tabelle coinvolte

### Nuove tabelle M7

#### `email_templates`

Template riutilizzabili.

Campi previsti:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `subject text not null`
- `body text not null`
- `audience text not null check in ('members', 'sponsors', 'both')`
- `is_active boolean not null default true`
- `created_by uuid null references admin_users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz null`

#### `email_campaigns`

Campagna email creata da un amministratore.

Campi previsti:

- `id uuid primary key default gen_random_uuid()`
- `template_id uuid null references email_templates(id) on delete restrict`
- `subject text not null`
- `body text not null`
- `audience_type text not null check in ('all_members', 'active_members', 'expired_members', 'sponsors', 'custom')`
- `status text not null default 'draft' check in ('draft', 'sent', 'failed')`
- `provider text not null default 'resend'`
- `recipient_snapshot_generated_at timestamptz null`
- `send_confirmed_at timestamptz null`
- `sent_at timestamptz null`
- `failed_at timestamptz null`
- `error_message text null`
- `created_by uuid null references admin_users(id)`
- `sent_by uuid null references admin_users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz null`

#### `email_campaign_recipients`

Snapshot storico dei destinatari di una campagna.

Campi previsti:

- `id uuid primary key default gen_random_uuid()`
- `campaign_id uuid not null references email_campaigns(id) on delete restrict`
- `recipient_type text not null check in ('member', 'sponsor', 'custom')`
- `member_id uuid null references members(id) on delete restrict`
- `sponsor_id uuid null references sponsors(id) on delete restrict`
- `email text not null`
- `recipient_name text null`
- `status text not null default 'pending' check in ('pending', 'sent', 'failed', 'skipped')`
- `skip_reason text null`
- `provider_message_id text null`
- `error_message text null`
- `sent_at timestamptz null`
- `opt_out_token_hash text null`
- `opted_out_at timestamptz null`
- `consent_basis_snapshot text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Vincoli consigliati:

- `email` non vuota dopo trim;
- `subject` e `body` non vuoti dopo trim;
- per `recipient_type = 'member'`, `member_id` valorizzato e `sponsor_id` nullo;
- per `recipient_type = 'sponsor'`, `sponsor_id` valorizzato e `member_id` nullo;
- per `recipient_type = 'custom'`, `member_id` e `sponsor_id` nulli;
- indice unico su `(campaign_id, lower(email))` per evitare duplicati nella
  stessa campagna;
- nessuna policy `DELETE`.

### Tabelle sorgente usate da M7

M7 legge dati gia' disponibili da:

- `members`
- `memberships`
- `sponsors`
- `admin_users`

Regole:

- `members.status` indica solo stato anagrafico;
- lo stato associativo dei soci attivi/scaduti deriva da `memberships`;
- sponsor e soci archiviati sono esclusi dai segmenti operativi;
- record senza email valida sono esclusi o marcati `skipped`;
- nessuna modifica alle tabelle soci, sponsor, membership o eventi e' prevista
  dal piano M7.

## 3. Template email

I template sono modelli riutilizzabili per campagne future.

Regole template:

- `name` obbligatorio e non vuoto;
- `subject` obbligatorio e non vuoto;
- `body` obbligatorio e non vuoto;
- `audience` limita l'uso previsto del template a soci, sponsor o entrambi;
- `is_active = false` rende il template non selezionabile per nuove campagne;
- `archived_at` esclude il template dagli elenchi operativi;
- l'archiviazione non deve cancellare campagne storiche che hanno usato quel
  template.

Uso template:

- una campagna puo' partire da un template;
- al momento della creazione campagna, `subject` e `body` vengono copiati nella
  campagna come snapshot modificabile;
- modificare un template non modifica campagne gia' create;
- eliminazione fisica vietata.

Variabili template iniziali:

- `{{recipient_name}}`
- `{{campaign_subject}}`
- `{{association_name}}`

M7 iniziale non deve introdurre un motore template complesso. Le variabili devono
essere poche, validate e sostituite server-side prima dell'invio. Le variabili
non riconosciute devono essere segnalate in anteprima.

Formato body:

- il piano iniziale puo' usare `body` come HTML semplice o testo con conversione
  controllata;
- non introdurre editor visuale complesso in M7;
- evitare script, iframe e contenuti potenzialmente pericolosi;
- valutare sanitizzazione HTML se si consente markup.

## 4. Campagne email

Una campagna rappresenta una comunicazione da inviare a un segmento o a una lista
custom.

Stati campagna M7:

- `draft`: campagna creata/modificabile, non inviata;
- `sent`: invio confermato ed eseguito;
- `failed`: invio non completato per errore bloccante o tutti i destinatari
  falliti.

Regole:

- creare una campagna non invia email;
- modificare una campagna non invia email;
- generare destinatari non invia email;
- inviare richiede un'azione separata e una conferma esplicita admin;
- una campagna `sent` non deve essere reinviata;
- per reinviare una comunicazione, creare una nuova campagna o duplicare la
  campagna in bozza;
- `template_id` e' opzionale, per consentire campagne create da zero;
- `subject` e `body` sono snapshot della campagna;
- `audience_type` definisce il segmento iniziale o `custom`;
- `created_by` e `sent_by` collegano le operazioni ad admin applicativi.

Sequenza operativa consigliata:

1. Admin crea campagna in bozza.
2. Admin seleziona template o scrive subject/body manualmente.
3. Admin seleziona segmento.
4. Sistema mostra anteprima destinatari stimata.
5. Admin genera snapshot destinatari.
6. Sistema crea righe in `email_campaign_recipients`.
7. Admin rivede numero destinatari, duplicati/skipped e anteprima email.
8. Admin conferma invio.
9. Service invia email ai destinatari `pending`.
10. Service aggiorna stato per destinatario e stato campagna.

La generazione del destinatario e l'invio restano due azioni diverse.

## 5. Destinatari campagna

Ogni destinatario deve essere salvato come riga storica in
`email_campaign_recipients`.

Regole:

- ogni riga salva l'email effettivamente usata per l'invio;
- il nome destinatario e' uno snapshot, non un riferimento dinamico;
- se l'email del socio o sponsor cambia dopo la campagna, lo storico non cambia;
- i destinatari custom non richiedono account o record socio/sponsor;
- i soci non hanno account e non accedono al sistema;
- destinatari senza email o con email invalida sono esclusi o marcati `skipped`;
- destinatari duplicati nella stessa campagna sono marcati `skipped` oppure non
  inseriti, ma il conteggio duplicati deve essere mostrato all'admin;
- il sistema deve preferire una sola email per campagna a parita' di
  `lower(email)`;
- lo stato per destinatario traccia il risultato effettivo dell'invio.

Stati destinatario:

- `pending`: destinatario incluso nello snapshot, non ancora inviato;
- `sent`: email inviata al provider e `provider_message_id` salvato se
  disponibile;
- `failed`: invio fallito per quel destinatario;
- `skipped`: destinatario escluso da invio per motivo operativo.

`skip_reason` consigliati:

- `missing_email`
- `invalid_email`
- `duplicate`
- `opted_out`
- `missing_consent`

## 6. Segmenti destinatari

Segmenti iniziali M7:

- `all_members`
- `active_members`
- `expired_members`
- `sponsors`
- `custom`

### Tutti i soci

Include:

- `members.archived_at is null`;
- email valorizzata e valida;
- destinatario non gia' opt-out secondo la logica M7;
- deduplica su `lower(email)`.

Nota:

- questo segmento non usa `members.status` come stato associativo;
- puo' includere soci anagraficamente `active` o `inactive` se non archiviati,
  salvo scelta UI piu' restrittiva da confermare.

### Soci attivi

Include soci con iscrizione associativa attiva.

Regola:

- socio non archiviato;
- email valorizzata e valida;
- esiste una membership non archiviata, non annullata, con
  `start_date <= current_date` e `end_date >= current_date`;
- se esistono piu' membership, la valutazione deve seguire la logica canonica
  M3/M4 di ultima membership rinnovabile;
- deduplica su `lower(email)`.

Non usare `members.status` per determinare lo stato associativo.

### Soci scaduti

Include soci la cui ultima membership rinnovabile e' scaduta.

Regola:

- socio non archiviato;
- email valorizzata e valida;
- ultima membership non archiviata e non annullata con `end_date < current_date`;
- nessuna membership successiva valida deve far risultare scaduto il socio;
- deduplica su `lower(email)`.

### Sponsor

Include:

- sponsor non archiviati;
- preferibilmente `sponsors.status = 'active'`;
- email valorizzata e valida;
- destinatario non opt-out;
- deduplica su `lower(email)`.

### Custom / manuale

Include destinatari inseriti manualmente dall'admin.

Regole:

- ogni email deve essere validata;
- il nome e' opzionale;
- i custom recipient non hanno account;
- l'admin deve confermare di avere base giuridica/consenso per l'invio;
- deduplica su `lower(email)` rispetto agli altri destinatari della campagna.

Segmenti non inclusi in M7 iniziale:

- scadenze entro 30/60/90 giorni;
- partecipanti evento;
- sponsor di uno specifico evento;
- liste salvate persistenti;
- automazioni ricorrenti.

Se il promemoria scadenze pre-scadenza diventa requisito immediato, va approvato
esplicitamente un segmento aggiuntivo derivato da M3.

## 7. Invio email

L'invio deve essere server-side.

Regole vincolanti:

- nessun invio automatico alla creazione campagna;
- nessun invio automatico alla generazione destinatari;
- nessun invio senza conferma admin;
- nessun invio da client browser con API key esposta;
- nessun uso di Gmail personale;
- nessun cron o scheduled send in M7 iniziale.

Flusso invio:

1. Admin apre campagna in stato `draft`.
2. Sistema verifica subject, body e destinatari `pending`.
3. UI mostra conferma con numero destinatari e destinatari esclusi.
4. Admin conferma.
5. Server action chiama `requireActiveAdmin()`.
6. Service carica la campagna e i destinatari `pending`.
7. Service invia usando provider server-side.
8. Service aggiorna ogni destinatario con `sent`, `failed` o `skipped`.
9. Service salva `provider_message_id` quando disponibile.
10. Service imposta campagna `sent` o `failed`.

Raccomandazioni operative:

- inviare in batch controllati per rispettare limiti provider;
- per free tier Resend, considerare limite operativo massimo di 100 email/giorno;
- mostrare warning se i destinatari superano il limite giornaliero configurato;
- evitare retry automatici massivi nella prima implementazione;
- consentire retry solo creando una nuova campagna o una campagna duplicata con
  soli destinatari falliti, se approvato in futuro.

## 8. Storico invii

Lo storico invii M7 e' rappresentato da:

- riga `email_campaigns`;
- righe `email_campaign_recipients`;
- stato destinatario;
- email usata;
- eventuale `provider_message_id`;
- `sent_at`;
- `error_message`.

Regole:

- non cancellare destinatari dopo invio;
- non modificare email storica dopo invio;
- non rigenerare lo snapshot di una campagna `sent`;
- una campagna inviata resta leggibile anche se template, socio o sponsor
  vengono archiviati;
- il dettaglio campagna deve mostrare conteggi `sent`, `failed`, `skipped`;
- lo storico non e' reportistica M8 e non deve introdurre export CSV/XLSX.

`email_campaigns.status`:

- `sent` se il processo di invio e' completato e almeno un destinatario e'
  stato inviato con successo;
- `failed` se errore bloccante impedisce il completamento o tutti i destinatari
  falliscono;
- errori parziali restano sui destinatari e devono essere visibili.

## 9. Provider email previsto

Provider proposto: Resend.

Motivazione:

- documentazione ufficiale per Next.js App Router e Server Actions;
- API server-side semplice per Next.js;
- supporto a domini verificati e autenticazione DKIM/SPF/DMARC;
- piano free-tier attuale documentato con 3.000 email/mese e 100 email/giorno;
- gestione API key tramite variabili ambiente;
- compatibile con deploy Vercel/Next.js.

Uso previsto in M7:

- usare Resend Email API lato server;
- non usare Gmail personale;
- non usare API key lato client;
- non usare Broadcasts/Automations come sorgente primaria in M7 iniziale,
  perche' PonteNext deve salvare internamente campagna e destinatari;
- valutare Broadcasts/Automations solo in futuro se serve gestione avanzata
  marketing/contatti.

Variabili ambiente previste nella futura PR operativa M7:

```env
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=
EMAIL_FROM_NAME=
EMAIL_REPLY_TO=
EMAIL_PROVIDER=resend
EMAIL_DAILY_SEND_LIMIT=100
```

Regole:

- non usare prefisso `NEXT_PUBLIC_` per `RESEND_API_KEY`;
- non committare valori reali;
- `.env.example` deve contenere solo nomi variabili e descrizioni;
- prima dell'invio reale configurare dominio verificato e mittente autorizzato;
- verificare i limiti free-tier al momento dell'implementazione, perche' i piani
  provider possono cambiare.

## 10. Gestione errori

Errori da gestire:

- provider non configurato;
- API key mancante;
- mittente non configurato;
- dominio non verificato;
- limite giornaliero superato;
- destinatario invalido;
- errore provider per singolo destinatario;
- timeout o errore rete;
- campagna senza destinatari `pending`;
- campagna gia' inviata;
- campagna archiviata;
- admin non autorizzato.

Regole:

- errori di configurazione bloccano l'invio e marcano la campagna `failed` solo
  se l'admin aveva gia' confermato l'invio;
- errori per destinatario aggiornano `email_campaign_recipients.status`;
- `error_message` deve essere sintetico e non contenere API key o segreti;
- non mostrare dettagli sensibili del provider nella UI;
- non ritentare automaticamente in loop;
- non inviare due volte allo stesso destinatario nella stessa campagna;
- usare `provider_message_id` per riconciliare invii riusciti.

Strategia retry:

- M7 iniziale non deve avere retry automatico;
- per errori parziali, l'admin puo' creare una nuova campagna mirata ai falliti
  solo se questa funzione viene approvata come follow-up;
- evitare reinvio diretto di una campagna `sent`.

## 11. Privacy / consenso / opt-out

M7 introduce comunicazioni massive, quindi deve trattare privacy e consenso come
criterio di accettazione, non come dettaglio secondario.

Regole privacy:

- non assumere che la sola presenza di un indirizzo email equivalga a consenso;
- l'admin deve confermare la base giuridica/consenso prima dell'invio;
- ogni campagna deve mantenere uno snapshot dei destinatari;
- ogni destinatario deve salvare l'email effettivamente usata;
- email invalide, duplicate o opt-out devono essere escluse o marcate `skipped`;
- non esporre elenchi destinatari a utenti anonimi;
- non creare account soci;
- non creare area soci.

Opt-out iniziale:

- ogni email non strettamente transazionale deve includere istruzioni chiare per
  disiscriversi o opporsi a comunicazioni future;
- e' consigliato un link tokenizzato di opt-out gestito server-side;
- il token non deve contenere dati personali in chiaro;
- salvare solo hash del token in `email_campaign_recipients`;
- una richiesta opt-out deve aggiornare solo il destinatario collegato al token;
- la generazione dei destinatari deve escludere email gia' opt-out in campagne
  precedenti, confrontando `lower(email)`.

Nota su route opt-out:

- le route amministrative definitive restano `/email`, `/email/templates` e
  `/email/campaigns`;
- se si implementa un link opt-out self-service, serve un endpoint pubblico
  tokenizzato minimo, ad esempio `/api/email/opt-out`;
- questo endpoint non deve essere una pagina gestionale e non deve esporre dati;
- se non si approva un endpoint pubblico in M7, l'opt-out deve essere gestito
  manualmente dall'associazione e il limite va documentato come rischio.

Consenso:

- per segmenti soci e sponsor, la UI deve chiedere conferma esplicita prima
  dell'invio;
- per destinatari custom, la UI deve chiedere conferma che l'admin disponga di
  consenso/base giuridica;
- `consent_basis_snapshot` puo' salvare una nota sintetica della base dichiarata.

Queste regole non sostituiscono una valutazione privacy/legale operativa
dell'associazione.

## 12. Route previste

Route amministrative definitive M7:

- `/email`
- `/email/templates`
- `/email/campaigns`

### `/email`

Hub operativo email.

Contenuti:

- riepilogo template attivi;
- riepilogo campagne recenti;
- link a template;
- link a campagne;
- eventuali warning configurazione provider;
- nessun invio diretto non confermato.

### `/email/templates`

Gestione template.

Funzioni:

- elenco template;
- creazione template;
- modifica template;
- anteprima template;
- archiviazione template;
- filtro per audience e stato.

Per rispettare le route definitive, creazione/modifica possono usare dialog,
sheet o form inline nella stessa route, senza introdurre route obbligatorie
`/email/templates/new` o `/email/templates/[id]` in M7 iniziale.

### `/email/campaigns`

Gestione campagne.

Funzioni:

- elenco campagne;
- creazione campagna draft;
- modifica campagna draft;
- selezione segmento;
- generazione snapshot destinatari;
- anteprima email;
- conferma invio;
- dettaglio storico destinatari;
- visualizzazione errori.

Per rispettare le route definitive, dettaglio e modifica possono essere gestiti
con search params, dialog/sheet o pannelli nella stessa route.

Route da non introdurre in M7 iniziale:

- `/email-campaigns`
- `/email/templates/new`
- `/email/campaigns/new`
- `/email/campaigns/[id]`
- `/reports`
- route pubbliche di area soci

Eccezione tecnica da valutare:

- endpoint pubblico tokenizzato per opt-out, se approvato.

## 13. Componenti UI previsti

Componenti React con convenzione `PascalCase.tsx`.

Componenti email generali:

- `EmailOverview.tsx`
- `EmailProviderStatus.tsx`
- `EmailStatusBadge.tsx`

Componenti template:

- `EmailTemplateTable.tsx`
- `EmailTemplateCardList.tsx`
- `EmailTemplateForm.tsx`
- `EmailTemplatePreview.tsx`
- `EmailTemplateArchiveDialog.tsx`

Componenti campagne:

- `EmailCampaignTable.tsx`
- `EmailCampaignCardList.tsx`
- `EmailCampaignForm.tsx`
- `EmailCampaignDetail.tsx`
- `EmailCampaignStatusBadge.tsx`
- `EmailSegmentSelector.tsx`
- `EmailRecipientPreview.tsx`
- `EmailRecipientTable.tsx`
- `EmailRecipientCardList.tsx`
- `SendCampaignDialog.tsx`
- `CampaignErrorSummary.tsx`

Componenti riutilizzabili:

- `PageHeader`
- `Button`
- `Card`
- `Badge`
- `Input`
- `Textarea`
- `EmptyState`
- `FormSubmitButton`

Regole UI:

- interfaccia gestionale, non marketing;
- desktop con tabelle compatte;
- mobile con card;
- form a una colonna su mobile;
- badge con testo esplicito;
- dialog di conferma prima dell'invio;
- mostrare conteggio destinatari e skipped prima dell'invio;
- non nascondere errori destinatario;
- nessun testo che faccia pensare a invio automatico.

## 14. Service layer previsto

Servizi previsti:

- `src/services/email-templates.service.ts`
- `src/services/email-campaigns.service.ts`
- `src/services/email-recipients.service.ts`
- `src/services/email-provider.service.ts`

Tipi previsti:

- `src/types/email.ts`

Utility previste:

- `src/utils/email.ts`

Funzioni template:

- `getEmailTemplates()`
- `getActiveEmailTemplates()`
- `createEmailTemplate()`
- `updateEmailTemplate()`
- `archiveEmailTemplate()`
- `renderEmailTemplatePreview()`

Funzioni campagne:

- `getEmailCampaigns()`
- `getEmailCampaignById()`
- `createEmailCampaignDraft()`
- `updateEmailCampaignDraft()`
- `archiveEmailCampaign()`
- `generateCampaignRecipientsSnapshot()`
- `sendEmailCampaign()`
- `markCampaignFailed()`

Funzioni destinatari:

- `getCampaignRecipients()`
- `previewSegmentRecipients()`
- `buildAllMembersRecipients()`
- `buildActiveMembersRecipients()`
- `buildExpiredMembersRecipients()`
- `buildSponsorRecipients()`
- `buildCustomRecipients()`
- `deduplicateRecipientsByEmail()`
- `excludeOptedOutRecipients()`

Funzioni provider:

- `sendEmailWithProvider()`
- `getEmailProviderConfig()`
- `assertEmailProviderConfigured()`

Regole service layer:

- ogni funzione di mutazione deve essere chiamata da server action protetta con
  `requireActiveAdmin()`;
- nessun provider SDK deve essere importato in componenti client;
- nessun segreto deve passare al client;
- invio e generazione destinatari devono essere funzioni separate;
- nessuna funzione deve usare cancellazione fisica;
- query standard filtrano `archived_at is null`;
- segmenti soci attivi/scaduti riusano la logica canonica M3/M4 sulle
  membership;
- errori provider devono essere trasformati in messaggi operativi.

## 15. RLS previste

RLS deve essere abilitata su:

- `public.email_templates`
- `public.email_campaigns`
- `public.email_campaign_recipients`

Policy baseline:

- `SELECT` consentito solo ad admin attivi;
- `INSERT` consentito solo ad admin attivi;
- `UPDATE` consentito solo ad admin attivi;
- nessuna policy `DELETE`;
- nessun accesso anonimo;
- nessuna tabella pubblica.

Helper:

- usare `app_private.is_active_admin()`;
- non creare funzioni security definer nello schema `public` se non necessarie;
- eventuali funzioni devono avere `search_path` esplicito e privilegi minimi.

Opt-out:

- nessuna policy pubblica sulle tabelle email;
- eventuale endpoint opt-out deve usare token server-side e aggiornare solo il
  record destinatario autorizzato dal token;
- non esporre liste campagne o destinatari a richieste anonime.

Nota grant:

- come gia' emerso in M5, le policy RLS impediscono DELETE in assenza di policy
  dedicata;
- in M7 implementativa valutare anche hardening dei grant nominali, senza
  bloccare lo scope iniziale.

## 16. Trigger previsti

Trigger tecnici:

- `set_email_templates_updated_at`
- `set_email_campaigns_updated_at`
- `set_email_campaign_recipients_updated_at`

Trigger o vincoli consigliati:

- check su `status` campagne;
- check su `status` destinatari;
- check su `audience_type`;
- check su `recipient_type`;
- vincolo esattamente-un-destinatario tra `member_id`, `sponsor_id` e custom;
- unique index su `(campaign_id, lower(email))`.

Trigger non previsti:

- nessun trigger deve inviare email;
- nessun trigger deve chiamare provider esterni;
- nessun trigger di retry;
- nessun trigger di reportistica;
- nessun trigger contabile.

Regola fondamentale:

L'invio email deve restare nel service layer server-side e deve partire solo dopo
conferma admin.

## 17. Test previsti

Verifiche locali:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Verifiche Supabase:

- migration list dopo eventuale applicazione M7;
- presenza sole tabelle M0-M7 previste;
- presenza `email_templates`;
- presenza `email_campaigns`;
- presenza `email_campaign_recipients`;
- assenza tabelle report;
- RLS attiva sulle tre tabelle M7;
- policy SELECT/INSERT/UPDATE admin-only;
- nessuna policy DELETE;
- trigger `updated_at` presenti.

Test unitari/service:

- validazione template;
- validazione campagna draft;
- validazione email destinatario;
- deduplica destinatari;
- esclusione opt-out;
- segmento tutti i soci;
- segmento soci attivi derivato da `memberships`;
- segmento soci scaduti derivato da `memberships`;
- segmento sponsor;
- destinatari custom;
- blocco invio senza conferma;
- blocco reinvio campagna `sent`;
- gestione errori provider.

Test UI/manuali:

- `/email` protetta;
- `/email/templates` protetta;
- `/email/campaigns` protetta;
- creazione template;
- modifica template;
- archiviazione template;
- creazione campagna draft;
- generazione destinatari senza invio;
- anteprima campagna;
- conferma invio;
- visualizzazione storico destinatari;
- empty state con database privo di soci/sponsor;
- rendering mobile a 360px.

Test provider:

- test di configurazione provider senza invio reale massivo;
- invio singolo verso email controllata solo in ambiente autorizzato;
- verifica che `RESEND_API_KEY` non sia esposta nel bundle client;
- verifica che il limite giornaliero configurato venga rispettato o almeno
  segnalato.

Browser check:

- route email senza sessione reindirizzano a `/login`;
- nessun errore console;
- nessun overlay framework.

## 18. Acceptance criteria

M7 sara' accettabile quando:

- sono create solo le tabelle email previste;
- non sono create tabelle report;
- non sono create tabelle contabili;
- `email_templates` gestisce template attivi/archiviati;
- `email_campaigns` consente campagne `draft`, `sent`, `failed`;
- creare una campagna non invia email;
- generare destinatari non invia email;
- inviare richiede conferma esplicita admin;
- ogni campagna salva lo snapshot destinatari;
- ogni destinatario salva l'email effettivamente usata;
- segmenti iniziali disponibili: tutti i soci, soci attivi, soci scaduti,
  sponsor, custom/manuale;
- soci attivi/scaduti sono derivati da `memberships`, non da `members.status`;
- destinatari duplicati sono evitati o marcati `skipped`;
- destinatari opt-out sono esclusi o marcati `skipped`;
- errori per destinatario sono salvati;
- provider Resend configurato solo server-side;
- `.env.example` contiene solo variabili, senza valori reali;
- nessuna API key e' committata;
- route `/email`, `/email/templates`, `/email/campaigns` presenti e protette;
- UI desktop e mobile usabile;
- RLS attiva sulle tabelle M7;
- nessuna policy DELETE;
- lint, typecheck e build passano;
- validazione Supabase live documentata;
- nessun report, dashboard avanzata, pagamento online, area soci, contabilita',
  fatturazione, IVA o prima nota introdotti.

## 19. Rischi

Rischi principali:

- invio accidentale senza conferma admin;
- duplicazione destinatari e spam;
- usare `members.status` come stato associativo invece di derivare da
  `memberships`;
- inviare a indirizzi senza consenso o a destinatari opt-out;
- mancanza di opt-out self-service se non viene approvato un endpoint tokenizzato;
- superamento limiti free-tier provider;
- invio massivo sincrono troppo lungo per server action o runtime Vercel;
- esposizione API key nel client;
- dati storici incoerenti se non si salva lo snapshot destinatari;
- campagne reinviate per errore;
- HTML email non sanitizzato;
- aspettative di marketing automation non coperte da M7;
- confusione tra storico invii e reportistica M8;
- uso di Gmail personale o caselle non verificate;
- deliverability bassa senza dominio configurato correttamente;
- dati personali in errori/log provider;
- modifiche a tabelle soci/sponsor per privacy non pianificate.

Mitigazioni:

- separare creazione, generazione destinatari e invio;
- dialog di conferma con conteggio destinatari;
- unique index per email per campagna;
- opt-out e consent snapshot;
- limiti configurabili;
- invio server-side only;
- nessun `NEXT_PUBLIC_` per chiavi provider;
- test su email controllata prima dell'uso operativo;
- documentare chiaramente che M7 non e' automazione newsletter avanzata.

## 20. Out of scope

M7 non include:

- report;
- export CSV/XLSX;
- dashboard avanzata;
- KPI email in dashboard;
- pagamenti online;
- area soci;
- app mobile;
- contabilita';
- fatturazione;
- IVA;
- prima nota;
- newsletter automation avanzata;
- scheduled send;
- cron job;
- retry automatici massivi;
- integrazione Gmail personale;
- gestione contatti provider come sorgente dati primaria;
- eventi come segmento destinatari dedicato;
- sponsor evento come segmento dedicato;
- allegati;
- tracking aperture/click avanzato;
- editor visuale complesso;
- audit log M8/M9;
- pagine pubbliche diverse da un eventuale endpoint opt-out tokenizzato da
  approvare esplicitamente.

## Definition of Done documentale per avvio M7

Prima di avviare codice o migration M7:

- confermare che `draft`, `sent`, `failed` siano gli unici stati campagna M7;
- confermare se l'opt-out self-service tokenizzato e' approvato;
- confermare se M7 deve includere un segmento scadenze entro 30/60/90 giorni;
- confermare indirizzo mittente e dominio da verificare;
- confermare soglia massima destinatari per singolo invio nel free-tier;
- preparare una PR operativa M7 separata da questa PR documentale.
