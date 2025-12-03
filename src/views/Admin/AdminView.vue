<template>
  <div class="min-h-screen bg-gray-100 p-4 sm:p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center pb-4 mb-6 border-b border-gray-300">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">Pannello di Moderazione</h1>
        <button
          @click="handleLogout"
          class="btn-logout bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded transition"
        >
          Esci
        </button>
      </div>

      <h2 class="text-xl font-semibold text-gray-700 mb-4 border-l-4 border-yellow-500 pl-2">
        Da Moderare ({{ pendingMessages.length }})
        <span v-if="isLoading" class="text-sm text-gray-500 ml-2">(Aggiornamento...)</span>
      </h2>

      <div
        v-if="pendingMessages.length === 0"
        class="p-4 bg-white rounded-lg shadow-sm text-center text-gray-500"
      >
        Nessun nuovo messaggio in attesa.
      </div>

      <ul class="space-y-4">
        <li
          v-for="message in pendingMessages"
          :key="message.id"
          class="bg-white p-4 rounded-lg shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center border-l-8 border-yellow-400"
        >
          <div class="message-content mb-3 sm:mb-0 sm:w-3/5">
            <p class="text-gray-900 font-medium text-base">{{ message.text }}</p>
            <small class="text-gray-400 text-xs">ID: {{ message.id.slice(-4) }}</small>
          </div>

          <div class="flex space-x-2 w-full sm:w-auto">
            <button
              @click="updateStatus(message.id, 'approved')"
              :disabled="message.status === '...'"
              class="flex-1 min-w-32 py-2 rounded font-semibold text-white transition disabled:opacity-50 bg-green-500 hover:bg-green-600"
            >
              <span v-if="message.status === '...'">...</span>
              <span v-else>✅ Approva</span>
            </button>
            <button
              @click="updateStatus(message.id, 'rejected')"
              :disabled="message.status === '...'"
              class="flex-1 min-w-32 py-2 rounded font-semibold text-white transition disabled:opacity-50 bg-red-500 hover:bg-red-600"
            >
              <span v-if="message.status === '...'">...</span>
              <span v-else>❌ Rifiuta</span>
            </button>
          </div>
        </li>
      </ul>

      <h2 class="text-xl font-semibold text-gray-700 mt-8 mb-4 border-l-4 border-blue-500 pl-2">
        Già Moderati ({{ moderatedMessages.length }})
      </h2>
      <ul class="space-y-2 text-sm"></ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue' // Importiamo onUnmounted
import { messageService, authService } from '@/services'
import { useRouter } from 'vue-router'
import type { Message } from '@/services/MessageService'

const router = useRouter()

// --- STATO REATTIVO ---
const allMessages = ref<Message[]>([])
const updateStatusMap = ref(new Map<string, '...' | 'pending' | 'approved' | 'rejected'>())
const isLoading = ref(true) // Stato di caricamento iniziale/polling

// --- LOGICA POLLING ---
const POLLING_RATE = 10000 // Aggiorna ogni 10 secondi
let pollingInterval: number | undefined

// --- COMPUTED (INVARIANTI) ---
const pendingMessages = computed(() => {
  return allMessages.value.filter((m) => m.status === 'pending')
})

const moderatedMessages = computed(() => {
  return allMessages.value.filter((m) => m.status !== 'pending')
})

/**
 * Funzione principale per caricare tutti i messaggi e categorizzarli.
 */
async function fetchAndCategorizeMessages() {
  isLoading.value = true
  try {
    const messages = await messageService.fetchMessages()
    allMessages.value = messages.sort((a, b) => (a.id > b.id ? -1 : 1)) // Ordine decrescente per ID (più recenti prima)
  } catch (error) {
    console.error('Errore nel recupero dei messaggi:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Avvia il polling.
 */
function startPolling() {
  // Esegue il fetch immediatamente al caricamento
  fetchAndCategorizeMessages()
  // Poi lo ripete ogni 10 secondi
  pollingInterval = setInterval(fetchAndCategorizeMessages, POLLING_RATE) as unknown as number
}

/**
 * Ferma il polling.
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
}

/**
 * Aggiorna lo stato del messaggio e ricarica i dati.
 */
async function updateStatus(id: string, newStatus: Message['status']) {
  const originalStatus = allMessages.value.find((m) => m.id === id)?.status

  // Setta lo stato per mostrare il loading sul pulsante
  updateStatusMap.value.set(id, '...')

  try {
    await messageService.updateMessageStatus(id, newStatus)

    // Ricarica tutti i messaggi per ottenere lo stato aggiornato
    await fetchAndCategorizeMessages()
  } catch (error) {
    console.error(`Errore nell'aggiornamento dello stato del messaggio ${id}:`, error)
  } finally {
    // Rimuove lo stato di loading
    updateStatusMap.value.delete(id)
  }
}

/**
 * Gestisce l'uscita dell'utente.
 */
function handleLogout() {
  stopPolling() // Interrompi il polling prima di uscire
  authService.logout()
  router.push({ name: 'login' })
}

// --- CICLO DI VITA DEL COMPONENTE ---
onMounted(startPolling)

onUnmounted(stopPolling)
</script>
