// src/services/LocalStorageService.ts

import type { IMessageService, Message } from './MessageService'

// Chiave usata nel LocalStorage
const STORAGE_KEY = 'pending_messages'

// Tempo di visualizzazione desiderato in millisecondi (es. 60 secondi)
const DISPLAY_DURATION = 10000

/**
 * Implementazione del servizio che salva i messaggi nel LocalStorage
 * per scopi di testing.
 */
export class LocalStorageService implements IMessageService {
  /**
   * Carica tutti i messaggi salvati nel LocalStorage.
   */
  private loadMessages(): Message[] {
    const json = localStorage.getItem(STORAGE_KEY)
    return json ? JSON.parse(json) : []
  }

  private saveMessages(messages: Message[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }

  /**
   * Salva il nuovo messaggio e lo aggiunge alla lista nel LocalStorage.
   */
  async submitMessage(newMessage: Pick<Message, 'text'>): Promise<string> {
    // Simulazione di una latenza di rete (opzionale)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const messages = this.loadMessages()

    // Generazione di un ID unico e default 'pending'
    const newId = Date.now().toString()
    const messageToSave: Message = {
      id: newId,
      text: newMessage.text,
      status: 'pending',
    }

    messages.push(messageToSave)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))

    console.log(`[LocalStorage] Messaggio salvato con ID: ${newId}`)
    return newId
  }

  // Ottiene tutti i messaggi
  async fetchMessages(): Promise<Message[]> {
    await new Promise((resolve) => setTimeout(resolve, 300)) // Simula latenza
    // Nel pannello admin vogliamo vedere tutti gli stati
    return this.loadMessages()
  }

  // Aggiorna lo stato di un messaggio
  async updateMessageStatus(id: string, newStatus: Message['status']): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const messages = this.loadMessages()
    const index = messages.findIndex((m) => m.id === id)

    if (index !== -1 && messages[index]) {
      messages[index].status = newStatus

      // LOGICA DI SCADENZA AGGIUNTA/MODIFICATA:
      if (newStatus === 'approved') {
        // Se approvato, registra il timestamp di scadenza
        messages[index].display_until = Date.now() + DISPLAY_DURATION
      } else {
        // Se rifiutato o altro, pulisci il campo
        delete messages[index].display_until
      }

      this.saveMessages(messages)
    } else {
      throw new Error(`Messaggio con ID ${id} non trovato.`)
    }
  }

  // Ottiene solo i messaggi approvati
  async getApprovedMessages(): Promise<Message[]> {
    await new Promise((resolve) => setTimeout(resolve, 50))

    const now = Date.now()
    const allMessages = this.loadMessages()

    // Filtraggio: Tieni solo i messaggi che sono 'approved'
    let approvedMessages = allMessages.filter((m) => m.status === 'approved')

    // Simulazione della scadenza di visualizzazione:
    // Tieni solo i messaggi che sono approvati E che NON sono ancora scaduti
    approvedMessages = approvedMessages.filter((msg) => {
      // Se non c'è un timestamp di scadenza O se la scadenza è nel futuro
      return msg.display_until && (msg.display_until as number) > now
    })

    // Ordina per ID (simulando l'ordine di approvazione)
    approvedMessages.sort((a, b) => (a.id > b.id ? 1 : -1))

    return approvedMessages
  }

  // Ottiene solo i messaggi approvati
  async getPendingMessageCount(): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 50))

    const allMessages = this.loadMessages()

    // Filtraggio: Tieni solo i messaggi che sono 'pending'
    let approvedMessages = allMessages.filter((m) => m.status === 'pending')

    return approvedMessages.length
  }
}
