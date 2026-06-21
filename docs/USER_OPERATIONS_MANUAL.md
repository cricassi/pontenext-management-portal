# User Operations Manual

Manuale operativo per gli amministratori di PonteNext Management Portal.

Questo documento spiega l'uso quotidiano dell'applicazione. Non contiene password, chiavi API o istruzioni di sviluppo.

## 1. Accesso

URL operativo:

    https://pontenext-management-portal.vercel.app

Entrare da /login.

Un admin puo' accedere solo se:

- esiste in Supabase Auth;
- esiste anche in public.admin_users;
- admin_users.status e' active;
- admin_users.archived_at e' vuoto.

Se l'utente Auth esiste ma non e' admin attivo, il login viene rifiutato.

## 2. Logout

Usare Esci nell'header. Su mobile puo' apparire come icona.

Dopo il logout, ogni route gestionale deve riportare a /login.

## 3. Navigazione

Voci principali:

- Dashboard
- Soci
- Iscrizioni
- Scadenze
- Sponsor
- Eventi
- Email
- Report
- Impostazioni

Desktop:

- sidebar scura;
- voce attiva rossa;
- contenuto gestionale chiaro.

Mobile:

- header compatto;
- menu apribile dal pulsante in alto;
- menu chiuso automaticamente quando si sceglie una voce;
- menu chiuso cliccando fuori;
- nessuno scroll orizzontale.

## 4. Dashboard

La dashboard e' operativa, non direzionale.

Mostra:

- soci attivi;
- scadenze entro 30 giorni;
- membership scadute;
- quote non completamente pagate;
- nuovi soci ultimi 30 giorni;
- rinnovi ultimi 30 giorni;
- elementi da gestire subito;
- prossime scadenze;
- ultimi rinnovi.

Azioni rapide:

- nuovo socio;
- nuova membership;
- rinnovo rapido.

## 5. Soci

Route:

- /members
- /members/new
- /members/[id]
- /members/[id]/edit

Operazioni:

- creare socio;
- modificare anagrafica;
- archiviare socio;
- consultare dettaglio;
- assegnare ruoli;
- vedere iscrizioni, pagamenti e scadenze collegate.

Regola chiave:

members.status indica solo lo stato anagrafico. Lo stato associativo deriva dalle memberships.

## 6. Ruoli

Route:

- /settings/roles

Operazioni:

- creare ruoli;
- modificare ruoli;
- archiviare ruoli;
- assegnare ruoli ai soci.

I ruoli base arrivano da seed tecnico.

## 7. Iscrizioni, quote e pagamenti

Route:

- /memberships
- /memberships/new
- /memberships/[id]
- /settings/membership-plans

Regole:

- ogni iscrizione o rinnovo crea una nuova riga in memberships;
- una membership esistente non va estesa o riutilizzata per un rinnovo;
- quote e pagamenti sono dati operativi, non contabili;
- niente fatture;
- niente IVA;
- niente prima nota;
- paid_amount e payment_status sono calcolati dai pagamenti.

Stati pagamento:

- unpaid
- partial
- paid
- overpaid

Overpaid e' uno stato operativo da verificare, non un documento contabile.

## 8. Scadenze e rinnovi

Route:

- /expirations

Filtri:

- scaduti;
- entro 30 giorni;
- entro 60 giorni;
- entro 90 giorni.

Rinnovo rapido:

- disponibile da membership scaduta o in scadenza;
- crea sempre una nuova membership;
- non modifica la membership precedente;
- propone start_date al giorno successivo alla end_date precedente;
- propone quota e durata dal piano;
- l'admin puo' modificare quota e durata prima del salvataggio;
- eventuale pagamento viene registrato solo se inserito esplicitamente.

## 9. Sponsor

Route:

- /sponsors
- /sponsors/new
- /sponsors/[id]
- /sponsors/[id]/edit

Regole:

- uno sponsor puo' esistere senza contributi;
- uno sponsor puo' avere zero, uno o piu' contributi;
- un contributo appartiene sempre a uno sponsor;
- contributi monetari: amount maggiore di zero;
- contributi non monetari: description obbligatoria, amount anche zero;
- nessuna contabilita', fatturazione, IVA o prima nota.

## 10. Eventi

Route:

- /events
- /events/new
- /events/[id]
- /events/[id]/edit

Regole:

- un evento puo' esistere senza sponsor;
- uno sponsor puo' essere collegato a piu' eventi;
- un evento puo' avere piu' sponsor;
- event_sponsors rappresenta il legame sponsor-evento;
- sponsor_contributions.event_id collega opzionalmente un contributo a un evento;
- un contributo senza evento resta valido.

Campi canonici:

- start_datetime
- end_datetime

## 11. Email e campagne

Route:

- /email
- /email/templates
- /email/campaigns

Provider:

- Resend lato server.

Regole:

- nessun invio automatico;
- creazione campagna separata dall'invio;
- invio solo dopo conferma admin;
- ogni campagna conserva subject e body effettivi;
- ogni destinatario conserva l'email effettivamente usata;
- duplicati evitati;
- destinatari senza email saltati;
- nessuna chiave API visibile nella UI.

Segmenti:

- tutti i soci;
- soci attivi;
- soci scaduti;
- sponsor;
- custom/manuale.

Stati campagna:

- draft
- sent
- failed

Stati destinatario:

- pending
- sent
- failed
- skipped

Prima di invii reali, fare una campagna test verso un indirizzo controllato.

## 12. Report ed export

Route:

- /reports
- /reports/export

Report:

- soci;
- iscrizioni;
- quote e pagamenti non contabili;
- scadenze;
- sponsor;
- contributi sponsor;
- eventi;
- campagne email.

Export:

- CSV;
- XLSX.

Regole:

- nessun PDF;
- export solo per admin autenticati;
- nessun file scritto su disco;
- nessun dato fuori RLS;
- gli export possono contenere dati personali: conservarli e condividerli con cautela.

## 13. Impostazioni

Route:

- /settings
- /settings/roles
- /settings/membership-plans

Usare per:

- ruoli associativi;
- piani di iscrizione.

## 14. Archiviazione

L'app usa soft delete operativo.

Quindi:

- i record vengono archiviati con archived_at;
- non vengono cancellati fisicamente dalla UI;
- i record archiviati non devono comparire nei flussi ordinari, salvo viste o filtri dedicati.

## 15. Privacy

Regole:

- non condividere credenziali admin;
- non inviare export via canali non controllati;
- non registrare video o screenshot con dati personali senza autorizzazione;
- non copiare chiavi API in chat, email o documenti;
- i soci non hanno account e non accedono al sistema.

## 16. Problemi comuni

### Credenziali non valide o utente non autorizzato

Cause probabili:

- email/password errate;
- utente non confermato in Supabase Auth;
- utente assente da admin_users;
- status inactive;
- archived_at valorizzato.

### Route gestionale torna a login

Sessione scaduta o admin non valido. Rifare login. Se persiste, controllare admin_users.

### Email non inviata

Controllare:

- campagna pronta;
- destinatari validi;
- EMAIL_FROM autorizzato in Resend;
- RESEND_API_KEY configurata lato server;
- errori destinatario salvati.

### Export non scarica

Controllare:

- sessione admin valida;
- filtri troppo restrittivi;
- download bloccato dal browser;
- endpoint /reports/export accessibile dopo login.

## 17. Checklist operativa

Prima dell'uso reale:

- [ ] super_admin reale attivo;
- [ ] login desktop verificato;
- [ ] login mobile verificato;
- [ ] logout verificato;
- [ ] export testato con dati limitati;
- [ ] campagna email testata su indirizzo controllato;
- [ ] nessuno scroll orizzontale mobile evidente;
- [ ] backup database pianificato;
- [ ] chiavi e password fuori dal repository.