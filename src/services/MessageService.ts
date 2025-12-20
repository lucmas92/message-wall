// src/services/MessageService.ts

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Definisce la struttura di un messaggio.
 * Usiamo 'pending' come valore di default in questo contesto.
 */
export interface Message {
  id: string // Opzionale per l'inserimento
  text: string
  status: 'pending' | 'approved' | 'rejected' | 'expired' | '...'
  created_at: number | Date
  display_until?: number | Date
}
export type Callback = (payload: RealtimePostgresChangesPayload<Message>) => void

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

  // Ottiene solo i messaggi approvati per lo schermo gigante
  getPendingMessageCount(): Promise<number>
  subscribeToApprovedMessages(callback: Callback): () => void
}
