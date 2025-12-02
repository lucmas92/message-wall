// src/services/MessageService.ts

/**
 * Definisce la struttura di un messaggio.
 * Usiamo 'pending' come valore di default in questo contesto.
 */
export interface Message {
  text: string
  status: 'pending' | 'approved' | 'rejected' | '...'
  id: string // Opzionale per l'inserimento
  display_until?: number
}

/**
 * L'interfaccia (il contratto) che ogni implementazione del servizio
 * di invio messaggi deve rispettare.
 */
export interface IMessageService {
  /**
   * Salva un nuovo messaggio e ritorna l'ID del messaggio salvato.
   */
  submitMessage(message: Pick<Message, 'text'>): Promise<string>

  // Ottiene tutti i messaggi per la moderazione
  fetchMessages(): Promise<Message[]>

  // Aggiorna lo stato di un messaggio
  updateMessageStatus(id: string, newStatus: Message['status']): Promise<void>

  // Ottiene solo i messaggi approvati per lo schermo gigante
  getApprovedMessages(): Promise<Message[]>
}
