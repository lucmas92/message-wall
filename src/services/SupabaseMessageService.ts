import { supabase } from '@/supabase'
import type { IMessageService, Message } from './MessageService'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Nome della tabella che useremo in Supabase
const MESSAGE_TABLE = 'messages'
// Durata di visualizzazione (in secondi, 45s come da precedente)
const DISPLAY_DURATION_SECONDS = 45

// Funzione per mappare i dati dal database alla nostra interfaccia Message
const mapToMessage = (data: Message): Message => ({
  text: data.text,
  status: data.status,
  id: data.id.toString(),
  display_until: data.display_until,
  created_at: data.created_at,
})

export class SupabaseMessageService implements IMessageService {
  async submitMessage(message: Pick<Message, 'text'>): Promise<string> {
    const { data, error } = await supabase
      .from(MESSAGE_TABLE)
      .insert({
        text: message.text,
        status: 'pending', // Inizialmente in pending
      })
      .select('id') // <-- CHIEDIAMO ESPLICITAMENTE l'ID della riga inserita
      .single() // <-- Otteniamo solo l'oggetto della riga (dato che ne inseriamo una sola)

    if (error) {
      console.error('Errore Supabase nel submit:', error.message)
      throw new Error('Impossibile inviare il messaggio al server.')
    }

    if (!data || typeof data.id === 'undefined') {
      throw new Error("Supabase non ha restituito l'ID del messaggio inserito.")
    }

    // Convertiamo l'ID (bigint) in stringa, come richiesto dall'interfaccia
    return data.id.toString()
  }

  async fetchMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from(MESSAGE_TABLE)
      .select('*')
      // Ordina per ID in ordine decrescente (i più recenti in alto)
      .order('id', { ascending: false })

    if (error) {
      console.error('Errore Supabase nel fetch:', error.message)
      return []
    }

    return (data || []).map(mapToMessage)
  }
  async updateMessageStatus(id: string, newStatus: Message['status']): Promise<void> {
    // Modificato: includiamo anche 'expired' tra gli status validi
    interface data {
      status: 'pending' | 'approved' | 'rejected' | 'expired' | '...'
      display_until?: number | string | null
    }

    const updateData: data = {
      status: newStatus as any,
      display_until: null, // Pulisce la scadenza di default
    }

    // LOGICA DI SCADENZA: Se approvato, imposta la scadenza
    if (newStatus === 'approved') {
      updateData.display_until = new Date(
        Date.now() + DISPLAY_DURATION_SECONDS * 1000,
      ).toISOString()
    }

    const { error } = await supabase.from(MESSAGE_TABLE).update(updateData).eq('id', id)

    if (error) {
      console.error(`Errore Supabase nell'aggiornamento di ${id}:`, error.message)
      throw new Error('Impossibile aggiornare lo stato del messaggio.')
    }
  }

  async getApprovedMessages(): Promise<Message[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from(MESSAGE_TABLE)
      .select('*')
      .eq('status', 'approved')
      // Filtra solo i messaggi la cui scadenza è ancora nel futuro
      .gt('display_until', now)
      .order('display_until', { ascending: true }) // Ordina per scadenza (i più vecchi escono prima)

    if (error) {
      console.error('Errore Supabase nel fetch approvati:', error.message)
      return []
    }

    return (data || []).map(mapToMessage)
  }

  /**
   * Ottiene il conteggio dei messaggi in stato 'pending'.
   * @returns Il numero di messaggi in coda.
   */
  async getPendingMessageCount(): Promise<number> {
    const { count, error } = await supabase
      .from(MESSAGE_TABLE)
      .select('*', { count: 'exact', head: true }) // count: 'exact' richiede un conteggio preciso
      .eq('status', 'pending')

    if (error) {
      console.error('Errore Supabase nel conteggio dei pending:', error.message)
      return 0
    }

    return count ?? 0
  }

  /**
   * Stabilisce l'abbonamento Real-Time per i messaggi approvati.
   * * @param callback Funzione da chiamare quando i dati cambiano.
   * @returns Una funzione per disabbonarsi.
   */
  subscribeToApprovedMessages(
    callback: (message: RealtimePostgresChangesPayload<Message>) => void,
  ): () => void {
    // Definisce il canale di Real-Time.
    // L'abbonamento è configurato per ascoltare solo i cambiamenti (INSERT, UPDATE)
    // sulla tabella 'messages' che soddisfano la condizione di filtro.
    const subscription = supabase
      .channel('approved-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Ascolta INSERT, UPDATE, DELETE
          schema: 'public',
          table: MESSAGE_TABLE,
        },
        (payload) => {
          // Chiama la callback fornita dalla vista con il payload di Supabase
          callback(payload as RealtimePostgresChangesPayload<Message>)
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-Time: Canale approvato sottoscritto con successo.')
        }
      })

    // Restituisce una funzione per disabbonarsi (da usare in onUnmounted)
    return () => {
      supabase.removeChannel(subscription)
      console.log('Real-Time: Canale disabbonato.')
    }
  }
}
