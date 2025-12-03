<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">

    <header class="w-full text-center pb-6 mb-8 border-b-2 border-gray-700">
      <h1 class="text-4xl sm:text-6xl font-extrabold uppercase tracking-wide text-green-400">
        ✨ MESSAGGI LIVE ✨
      </h1>
      <p class="text-lg text-gray-400 mt-2">La tua voce sul grande schermo.</p>
    </header>

    <div v-if="approvedMessages.length > 0" class="w-full max-w-7xl flex-grow">
      <transition-group name="message-flow" tag="div"
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="message in approvedMessages"
          :key="message.id"
          :class="['message-card p-6 rounded-xl shadow-2xl transition duration-500', getCardClass(message.id)]"
        >
          <p class="text-xl sm:text-2xl font-bold leading-snug">{{ message.text }}</p>
          <span class="mt-4 block text-xs opacity-70">ID: {{ message.id.slice(-4) }}</span>
        </div>
      </transition-group>
    </div>

    <div v-else-if="!isLoading" class="flex flex-col items-center justify-center h-full absolute inset-0 text-center">
      <p class="text-3xl font-light text-gray-400">Attualmente non ci sono messaggi in coda.</p>
      <p class="text-lg text-gray-500 mt-2">Scansiona il QR Code per inviare il tuo!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { messageService } from '@/services'
import type { Message } from '@/services/MessageService'

// Frequenza di aggiornamento in millisecondi (5 secondi)
const POLLING_RATE = 5000

const approvedMessages = ref<Message[]>([])
const isLoading = ref(true)
let pollingInterval: number | undefined

/**
 * Funzione per assegnare una classe di colore basata sull'ID del messaggio (per varietà)
 */
function getCardClass(id: string): string | undefined {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = ['color-1', 'color-2', 'color-3']
  return colors[hash % colors.length]
}

/**
 * Funzione principale per caricare i messaggi e aggiornare lo stato.
 * Si affida al Service Layer per filtrare i messaggi scaduti (display_until).
 */
async function fetchAndUpdateMessages() {
  console.log('fetchAndUpdateMessages')
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
}

/**
 * Ferma il polling quando il componente viene distrutto.
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
}

// Ciclo di vita del componente
onMounted(startPolling)
onUnmounted(stopPolling)
</script>

<style scoped>
/* Colori delle card Tailwind */
.message-card.color-1 { background-color: #0d9488; color: #f0fdfa; } /* Teal 700 */
.message-card.color-2 { background-color: #f59e0b; color: #1e293b; } /* Amber 500 */
.message-card.color-3 { background-color: #4ade80; color: #1e293b; } /* Green 400 */

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
