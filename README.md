
# 💬 Live Public Message Board (Bacheca Messaggi Pubblica in Tempo Reale)

Benvenuto nel repository del progetto **Live Public Message Board**, un'applicazione web minimalista e ad alta reattività, progettata per visualizzare messaggi pubblici su schermi in tempo reale dopo l'approvazione amministrativa.

## 🚀 Panoramica del Progetto

Questa applicazione risolve il problema di visualizzare contenuti dinamici e moderati su schermi fissi (come monitor in un ufficio, sala d'attesa, o evento).

Sfruttando la potenza di Supabase Real-Time, l'aggiornamento dei messaggi avviene istantaneamente, eliminando la necessità di polling costante e garantendo un'esperienza fluida e immediata.

### Architettura 3-Componenti

Il sistema è composto da tre componenti Vue.js distinti che interagiscono con un'unica sorgente dati su Supabase:

1.  **`SubmitView` (Frontend di Invio):** Permette a chiunque di inviare un nuovo messaggio con una durata massima di visualizzazione. Questi messaggi vengono salvati con lo stato **`pending`**.
    
2.  **`AdminView` (Pannello di Moderazione):** Strumento accessibile solo agli utenti autenticati (admin) per visualizzare i messaggi `pending` e cambiarne lo stato in **`approved`** (approvato) o **`rejected`** (rifiutato).
    
3.  **`ScreenView` (Schermo Pubblico):** Visualizza solo i messaggi con stato **`approved`**. Grazie a Supabase Real-Time, lo schermo si aggiorna **istantaneamente** non appena un admin approva o rimuove un messaggio. I messaggi approvati vengono rimossi automaticamente allo scadere del loro tempo di visualizzazione.
    

## ✨ Caratteristiche Principali

-   **Aggiornamenti in Tempo Reale:** Utilizza i WebSockets di Supabase per aggiornare la `ScreenView` entro millisecondi dall'azione dell'admin.
    
-   **Moderazione Semplice:** Flusso chiaro tra invio (`pending`) e approvazione (`approved`).
    
-   **Sicurezza (RLS):** Rigorosa implementazione della Row Level Security (RLS) per:
    
    -   Consentire agli utenti anonimi di solo **scrivere** (`INSERT`) nuovi messaggi (status: `pending`).
        
    -   Consentire agli utenti anonimi di solo **leggere** (`SELECT`) messaggi con status: `approved`.
        
    -   Garantire che solo gli amministratori (autenticati) possano vedere tutti gli stati.
        
-   **Scadenza Automatica:** I messaggi approvati vengono rimossi localmente dalla `ScreenView` esattamente allo scadere del loro timer (`display_until`).
    

## 🛠️ Stack Tecnologico

-   **Frontend:** Vue.js 3 (Composition API)
    
-   **Linguaggio:** TypeScript
    
-   **Styling:** Tailwind CSS
    
-   **Backend & DB:** Supabase
    
    -   PostgreSQL
        
    -   Realtime (Postgres Changes)
        
    -   Auth (per il pannello Admin)
        
    -   RLS (Row Level Security)
        

## 🗄️ Struttura della Tabella

La tabella principale del database (schema `public`) è `messages`.

**Colonna**

**Tipo**

**Descrizione**

`id`

`BIGINT`

Chiave primaria univoca.

`created_at`

`TIMESTAMPZ`

Timestamp di creazione.

`text`

`TEXT`

Il contenuto del messaggio.

`status`

`TEXT`

**Stato del messaggio:** `pending`, `approved`, o `rejected`.

`display_until`

`TIMESTAMPZ`

Data/ora di scadenza per la visualizzazione.

## 🚀 Istruzioni di Setup

### 1. Clonazione del Repository

```
git clone [https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository)
cd live-message-board


```

### 2. Setup di Supabase

1.  Crea un nuovo progetto su Supabase.
    
2.  Ottieni la tua **Project URL** e la **anon key**.
    
3.  Crea la tabella `messages` con la struttura sopra descritta.
    

### 3. Configurazione del Real-Time di Supabase

Nel pannello di Supabase:

1.  **RLS (Row Level Security):** Abilita RLS sulla tabella `messages` e aggiungi le due policy fondamentali per il ruolo `anon` (una per `INSERT` e una per `SELECT approved`).
    
2.  **Realtime:** Vai alla sezione Realtime, trova la tabella `public.messages` e assicurati che sia abilitata per la replicazione. **Verifica che la colonna `status` sia inclusa nel flusso di replicazione** per permettere al filtro Real-Time (`filter: status=eq.approved`) di funzionare lato server.
    

### 4. Configurazione Locale

Crea un file `.env.local` nella directory principale e aggiungi le tue credenziali Supabase:

```
VITE_SUPABASE_URL="[LA TUA URL QUI]"
VITE_SUPABASE_ANON_KEY="[LA TUA CHIAVE ANON QUI]"


```

### 5. Installazione e Avvio

```
npm install
npm run dev


```

L'applicazione sarà disponibile su `http://localhost:5173/` (o sulla porta indicata).

## 📄 Note sulla Sicurezza e Sviluppo

Il codice si affida alla validazione lato server di Supabase (RLS) per la sicurezza.

-   La `ScreenView` utilizza la funzione `subscribeToApprovedMessages` del `SupabaseMessageService` per connettersi al canale Real-Time filtrato e ricevere solo i messaggi approvati.
    
-   La gestione locale della scadenza con `setInterval(updateAllTimers, 1000)` è mantenuta per garantire che la rimozione dei messaggi sia precisa al secondo, indipendentemente dalla latenza del server.