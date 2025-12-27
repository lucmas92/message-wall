<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { messageService } from '@/services'
import type { Message } from '@/services/MessageService'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import QrCode from '@/views/QrCode.vue'

// --- STATI REATTIVI ---
const approvedMessages = ref<Message[]>([])
const isLoading = ref(true)

// Mappa che conterrà i timestamp e il tempo rimanente calcolato (chiave: message.id)
const timeRemainingMap = ref(new Map<string, string>())
const colorMap = ref(new Map<string, string>()) // Per assegnare un colore stabile a ciascun messaggio

// --- COSTANTI E INTERVALLI ---
const TIMER_UPDATE_RATE = 1000 // Aggiorna i timer ogni secondo
let timerInterval: number | undefined

// Funzione per disabbonarsi dal canale Real-Time (CRUCIALE per il cleanup)
let unsubscribeFromRealtime: (() => void) | undefined

// --- CLASSI VISUALI (Colore) ---

const cardClasses = [
  'bg-indigo-300/60 border-indigo-500/80 shadow-indigo-600/50',
  'bg-teal-300/60 border-teal-500/80 shadow-teal-500/50',
  'bg-rose-300/60 border-rose-500/80 shadow-rose-500/50',
  'bg-amber-300/60 border-amber-500/80 shadow-amber-500/50',
]

/**
 * Assegna una classe di colore stabile in base all'ID del messaggio.
 * @param id L'ID del messaggio.
 * @returns Classe Tailwind CSS per lo sfondo e l'ombra.
 */
function getCardClass(id: string): string {
  if (!colorMap.value.has(id)) {
    // Usa una logica deterministica per assegnare un colore (es. basata sull'ultima cifra dell'ID)
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = hash % cardClasses.length
    colorMap.value.set(id, cardClasses[index] as string)
  }
  return (colorMap.value.get(id) || cardClasses[0]) as string
}

// --- LOGICA TIMER (1 SECONDO) ---

/**
 * Calcola il tempo rimanente e formatta in MM:SS.
 * @param displayUntil Timestamp di scadenza.
 */
function formatTimeRemaining(displayUntil: string): string {
  const expirationTime = new Date(displayUntil).getTime()
  const currentTime = new Date().getTime()
  const diff = expirationTime - currentTime

  if (diff <= 0) {
    return 'Scaduto!'
  }

  const seconds = Math.floor((diff / 1000) % 60)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  return `${formattedMinutes}:${formattedSeconds}`
}

function getFontSize(text: string) {
  if (text.length < 30) return 'text-6xl'
  if (text.length < 80) return 'text-4xl'
  return 'text-2xl'
}

/**
 * Normalizza un messaggio in entrata per garantire che i campi critici
 * siano nel formato atteso.
 */
function normalizeMessage(message: Message): Message {
  if (!message) return message

  // 1. Uniforma l'ID a stringa (se necessario)
  message.id = String(message.id)

  // 2. Uniforma display_until a Stringa ISO (se arriva come numero)
  // Se è un numero (Timestamp Unix in ms), convertilo in stringa ISO
  if (typeof message.display_until === 'number') {
    message.display_until = new Date(message.display_until).getTime()
  }
  // Altrimenti, assumiamo che sia già una stringa ISO (come nel payload Real-Time)

  return message as Message
}

/**
 * Marca in backend (Supabase) una lista di messaggi come 'expired'.
 * Esegue richieste in parallelo e logga eventuali errori.
 */
async function markMessagesExpired(ids: string[]) {
  if (!ids || ids.length === 0) return
  try {
    await Promise.allSettled(
      ids.map((id) =>
        messageService.updateMessageStatus(id, 'expired').catch((err: any) => {
          console.error(`Errore nell'aggiornamento a expired per ${id}:`, err)
        }),
      ),
    )
  } catch (error) {
    console.error('Errore generale durante markMessagesExpired:', error)
  }
}

/**
 * Aggiorna tutti i timer e rimuove i messaggi scaduti localmente.
 */
function updateAllTimers() {
  const newMap = new Map<string, string>()
  const messagesToRemove: string[] = []
  const currentTime = new Date().getTime()

  approvedMessages.value.forEach((message) => {
    if (message.display_until) {
      const expirationTime = new Date(message.display_until).getTime()
      const diff = expirationTime - currentTime

      if (diff <= 500) {
        // Tolleranza di 500ms
        // Messaggio scaduto: segna per la rimozione locale
        messagesToRemove.push(message.id)
        newMap.set(message.id, '00:00')
      } else {
        // Calcola e formatta il tempo rimanente
        const remaining = formatTimeRemaining(message.display_until.toString())
        newMap.set(message.id, remaining)
      }
    }
  })

  // Rimuovi i messaggi scaduti dalla lista reattiva per aggiornare il DOM
  if (messagesToRemove.length > 0) {
    // Chiamata al backend per marcare i messaggi come 'expired' (fire-and-forget)
    void markMessagesExpired(messagesToRemove)

    approvedMessages.value = approvedMessages.value.filter((m) => !messagesToRemove.includes(m.id))
  }

  timeRemainingMap.value = newMap
}

function startTimer() {
  updateAllTimers()
  timerInterval = setInterval(updateAllTimers, TIMER_UPDATE_RATE) as unknown as number
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
}

// --- LOGICA REAL-TIME (SUPABASE) ---

/**
 * Gestisce i payload di cambiamento in tempo reale da Supabase.
 */
function handleRealtimeChange(payload: RealtimePostgresChangesPayload<Message>) {
  const newMessage = payload.new as Message

  const newMessageNormalized = normalizeMessage(newMessage)
  // Assicuriamoci che l'array sia reattivo
  const currentMessages = approvedMessages.value

  switch (payload.eventType) {
    case 'INSERT':
      // Nuovi messaggi approvati (filtrati dal servizio)
      if (newMessage && newMessage.status == 'approved') {
        if (!currentMessages.some((m) => m.id === newMessage.id)) {
          approvedMessages.value.push(newMessage)
          // Forza l'aggiornamento dei timer
          updateAllTimers()
        }
      }
      break

    case 'UPDATE':
      // Messaggio aggiornato nel DB (es. rimosso il flag 'approved' o cambiato il testo)
      const index = currentMessages.findIndex((m) => m.id === newMessage.id)
      if (index !== -1) {
        // Se lo status non è più 'approved', rimuoviamo il messaggio immediatamente
        if (newMessage.status !== 'approved') {
          approvedMessages.value.splice(index, 1)
        }
      } else {
        if (
          newMessage.status == 'approved' &&
          !currentMessages.some((m) => m.id === newMessage.id)
        ) {
          approvedMessages.value.push(newMessageNormalized)
          // Forza l'aggiornamento dei timer
          updateAllTimers()
        }
      }
      break
  }
}

// --- CICLO DI VITA ---

async function initializeScreen() {
  isLoading.value = true
  try {
    // 1. Carica prima tutti i messaggi approvati esistenti (Bootstrap)
    approvedMessages.value = await messageService.getApprovedMessages()

    // 2. Avvia l'abbonamento Real-Time
    unsubscribeFromRealtime = messageService.subscribeToApprovedMessages(handleRealtimeChange)

    // 3. Avvia il timer di 1s per la gestione locale della scadenza (rimozione precisa)
    startTimer()
  } catch (error) {
    console.error("Errore nell'inizializzazione dello schermo:", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(initializeScreen)

onUnmounted(() => {
  stopTimer()
  if (unsubscribeFromRealtime) {
    unsubscribeFromRealtime() // Disconnessione WebSocket
  }
})

// Aggiunta: testo breve esplicativo e dimensione QR per l'overlay
const qrSize = ref(120) // dimensione di default (px), ridotta via CSS su mobile
</script>

<template>
  <div class="min-h-screen flex flex-col text-white items-center justify-middle relative">
    <div class="my-8 text-center">
      <h3 class="text-white font-bold text-5xl conqueror">Condividi il momento</h3>
      <p class="text-lg">
        Una questo spazio per fare auguri, salutare gli amici o condividere un'emozione della
        serata.
      </p>
    </div>
    <div class="w-full">
      <!-- Loader e stato iniziale -->
      <div v-if="isLoading" class="text-white text-xl animate-pulse">
        Caricamento bacheca live...
      </div>

      <div v-else class="w-full max-h-screen p-4 overflow-y-auto break-all content-with-qr">
        <div v-if="approvedMessages.length > 0" class="w-full">
          <transition-group
            name="message-flow"
            tag="div"
            class="columns-1 sm:columns-2 lg:columns-3 gap-4"
          >
            <div v-for="message in approvedMessages" :key="message.id">
              <div
                class="p-4 rounded-2xl border-2 transition-colors duration-200"
                :class="['break-inside-avoid mb-4 group relative', getCardClass(message.id)]"
              >
                <p
                  :class="[getFontSize(message.text)]"
                  class="font-bold leading-relaxed whitespace-pre-wrap"
                >
                  {{ message.text }}
                </p>
              </div>
            </div>
          </transition-group>
        </div>

        <div v-else class="text-center text-gray-500/80 animate-pulse text-3xl p-8">
          Lo schermo è pronto, mancano solo le tue idee.<br />Scansiona il codice e condividi il tuo
          messaggio con tutti noi.
        </div>
      </div>
    </div>

    <div
      class="border fixed bottom-2 my-8 py-4 px-8 bg-gradient-to-t from-yellow-500/40 to-yellow-300/40 flex justify-center items-center gap-4 rounded-3xl"
    >
      <div class="qr-box" :style="{ width: qrSize + 'px', height: qrSize + 'px' }">
        <QrCode />
      </div>
      <p>
        Scansiona il qr code e scrivi ora!<br />
        Sii gentile, la bacheca è di tutti.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Transizioni per i messaggi in entrata e in uscita */
.message-flow-enter-active,
.message-flow-leave-active {
  transition: all 0.5s ease;
}

.message-flow-enter-from,
.message-flow-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Assicura che gli elementi vengano spostati correttamente quando altri vengono rimossi */
.message-flow-move {
  transition: transform 0.5s ease;
}

/* Nuovi stili per l'overlay QR */
.qr-overlay {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Assicura che l'area dei messaggi non sia coperta dall'overlay:
   padding-bottom deve essere almeno dell'altezza dell'overlay su tutti i device */
.content-with-qr {
  padding-bottom: 160px; /* spazio per overlay su desktop */
}

/* Adattamenti per dispositivi più piccoli */
@media (max-width: 640px) {
  .qr-overlay {
    left: 50%;
    transform: translateX(-50%);
    bottom: 12px;
    padding: 10px 12px;
    gap: 8px;
  }

  .qr-box {
    width: 72px !important;
    height: 72px !important;
  }

  .content-with-qr {
    padding-bottom: 120px; /* meno spazio su mobile */
  }

  .text-block p {
    font-size: 0.85rem;
  }
}
</style>
