<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
    <header class="w-full text-center pb-6 mb-8 border-b-2 border-gray-700">
      <h1 class="text-4xl sm:text-6xl font-extrabold uppercase tracking-wide text-green-400">
        ✨ MESSAGGI LIVE ✨
      </h1>
      <div class="flex items-center">
        <p @click="handleLogout" class="text-lg flex-1 text-gray-400 mt-2 cursor-pointer">
          La tua voce sul grande schermo.
        </p>
        <div
          class="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <img
            :src="qrCodeSubmit"
            alt="QR Code per invio messaggio"
            class="w-30 h-30 mb-3 shadow-lg"
          />
          <p class="text-xs text-gray-500">Scansiona per inviare</p>
        </div>
      </div>
    </header>

    <div v-if="approvedMessages.length > 0" class="w-full max-w-7xl flex-grow">
      <transition-group name="message-flow" tag="div" class="grid grid-cols-1 gap-6">
        <div
          v-for="message in approvedMessages"
          :key="message.id"
          :class="[
            'message-card p-6 rounded-xl shadow-2xl transition duration-500',
            getCardClass(message.id),
          ]"
        >
          <div
            class="mb-4 pb-2 border-b border-opacity-30 border-white flex justify-between items-center text-sm font-semibold"
          >
            <span class="text-yellow-300 bg-gray-800 py-1 px-3 rounded-full shadow-lg">
              ⏳ {{ timeRemainingMap.get(message.id) || '00:00' }}
            </span>

            <span class="text-xs opacity-70 text-white">ID: {{ message.id.slice(-4) }}</span>
          </div>
          <p class="text-xl sm:text-2xl font-bold leading-snug whitespace-pre-wrap">
            {{ message.text }}
          </p>
        </div>
      </transition-group>
    </div>

    <div
      v-else-if="!isLoading"
      class="flex flex-col items-center justify-center h-full inset-0 text-center"
    >
      <p class="text-3xl font-light text-gray-400">Attualmente non ci sono messaggi in coda.</p>
      <p class="text-lg text-gray-500 mt-2">Scansiona il QR Code per inviare il tuo!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { authService, messageService } from '@/services'
import type { Message } from '@/services/MessageService'
import { useRouter } from 'vue-router'
import qrCodeSubmit from '@/assets/qr.png' // <-- Adatta il nome del file e l'estensione se necessario

// Frequenza di aggiornamento in millisecondi (5 secondi)
const POLLING_RATE = 5000

const approvedMessages = ref<Message[]>([])
const isLoading = ref(true)
const router = useRouter()
const timeRemainingMap = ref(new Map<string, string>())
let pollingInterval: number | undefined

const TIMER_UPDATE_RATE = 1000
let timerInterval: number | undefined

// Calcola e formatta il tempo rimanente ---
function formatTimeRemaining(displayUntil: string): string {
  const expirationTime = new Date(displayUntil).getTime()
  const currentTime = new Date().getTime()
  const diff = expirationTime - currentTime

  if (diff <= 0) {
    // Il messaggio è scaduto, il polling lo rimuoverà presto
    return 'Scaduto!'
  }

  const seconds = Math.floor((diff / 1000) % 60)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  // Formatta l'output (MM:SS)
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  return `${formattedMinutes}:${formattedSeconds}`
}

/**
 * Funzione per assegnare una classe di colore basata sull'ID del messaggio (per varietà)
 */
function getCardClass(id: string): string | undefined {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = ['color-1', 'color-2', 'color-3']
  return colors[hash % colors.length]
}
// Aggiorna tutti i timer nella mappa
function updateAllTimers() {
  const newMap = new Map<string, string>()

  approvedMessages.value.forEach((message) => {
    if (message.display_until) {
      const remaining = formatTimeRemaining(message.display_until)
      newMap.set(message.id, remaining)
    }
  })

  timeRemainingMap.value = newMap
}

/**
 * Funzione principale per caricare i messaggi e aggiornare lo stato.
 * Si affida al Service Layer per filtrare i messaggi scaduti (display_until).
 */
async function fetchAndUpdateMessages() {
  try {
    // Aggiorna l'array reattivo. Vue e transition-group gestiscono
    // l'ingresso dei nuovi e l'uscita dei messaggi scaduti.
    approvedMessages.value = await messageService.getApprovedMessages()
  } catch (error) {
    console.error('Errore nel recupero dei messaggi approvati:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Avvia il polling per simulare l'aggiornamento in tempo reale.
 */
function startPolling() {
  // Esegue l'aggiornamento immediatamente e poi ogni POLLING_RATE
  fetchAndUpdateMessages()
  pollingInterval = setInterval(fetchAndUpdateMessages, POLLING_RATE) as unknown as number

  //Aggiorna la mappa dei timer dopo ogni fetch
  timerInterval = setInterval(updateAllTimers, TIMER_UPDATE_RATE) as unknown as number
}

/**
 * Ferma il polling quando il componente viene distrutto.
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
  if (timerInterval) clearInterval(timerInterval)
}

/**
 * Gestisce l'uscita dell'utente.
 */
function handleLogout() {
  stopPolling() // Interrompi il polling prima di uscire
  authService.logout()
  router.push({ name: 'login' })
}

// Ciclo di vita del componente
onMounted(startPolling)
onUnmounted(stopPolling)
</script>

<style scoped>
/* Colori delle card Tailwind */
.message-card.color-1 {
  background-color: #0d9488;
  color: #f0fdfa;
} /* Teal 700 */
.message-card.color-2 {
  background-color: #f59e0b;
  color: #1e293b;
} /* Amber 500 */
.message-card.color-3 {
  background-color: #4ade80;
  color: #1e293b;
} /* Green 400 */

/* Transizioni Tailwind: Sfruttiamo le classi per le transizioni */
.message-flow-enter-active,
.message-flow-leave-active {
  transition: all 0.5s ease-out;
}
.message-flow-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.message-flow-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.message-flow-move {
  transition: transform 0.5s ease;
}
</style>
