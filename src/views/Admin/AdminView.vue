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
            <p class="text-gray-900 font-medium text-base whitespace-pre-wrap">
              {{ message.text }}
            </p>
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

      <div class="mt-8">
        <div
          @click="showModerated = !showModerated"
          class="flex justify-between items-center bg-white p-4 rounded-t-lg shadow-md cursor-pointer border-l-4 border-blue-500 hover:bg-gray-50 transition duration-150"
        >
          <h2 class="text-xl font-semibold text-gray-700">
            Già Moderati ({{ moderatedMessages.length }})
          </h2>

          <svg
            :class="[
              'w-5 h-5 text-gray-500 transition-transform duration-300',
              { 'rotate-180': showModerated },
            ]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <Transition name="fade-slide">
          <div
            v-show="showModerated"
            class="overflow-hidden bg-white rounded-b-lg shadow-md border-t border-gray-200"
          >
            <div class="p-4 border-b border-gray-200">
              <input
                type="text"
                v-model="searchTerm"
                placeholder="Cerca per testo o ID (ultime 4 cifre)..."
                class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div class="overflow-y-auto py-2" style="max-height: 400px">
              <div v-if="moderatedMessages.length === 0" class="p-4 text-center text-gray-500">
                Nessun messaggio trovato con la parola chiave "{{ searchTerm }}".
              </div>

              <ul class="space-y-2 text-sm p-4 pt-0">
                <li
                  v-for="message in moderatedMessages"
                  :key="message.id"
                  :class="[
                    'p-3 rounded-lg flex justify-between items-center transition duration-100',
                    message.status === 'approved'
                      ? 'bg-green-50 border-l-4 border-green-500 hover:bg-green-100'
                      : 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100',
                  ]"
                >
                  <div class="text-gray-700 w-full sm:w-3/4 mr-4">
                    <p class="whitespace-pre-wrap">{{ message.text }}</p>
                    <small class="text-xs text-gray-400">ID: {{ message.id.slice(-4) }}</small>
                  </div>

                  <span
                    :class="[
                      'font-medium text-xs whitespace-nowrap',
                      message.status === 'approved' ? 'text-green-700' : 'text-red-700',
                    ]"
                  >
                    {{ message.status === 'approved' ? 'Approvato' : 'Rifiutato' }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue' // Assicurati che 'computed' sia importato
import { messageService, authService } from '@/services'
import { useRouter } from 'vue-router'
import type { Message } from '@/services/MessageService'

const router = useRouter()

// --- STATO REATTIVO ---
const showModerated = ref(false)
const allMessages = ref<Message[]>([])
const updateStatusMap = ref(new Map<string, '...' | 'pending' | 'approved' | 'rejected'>())
const isLoading = ref(true) // Stato di caricamento iniziale/polling
const searchTerm = ref('')

// --- LOGICA POLLING ---
const POLLING_RATE = 10000 // Aggiorna ogni 10 secondi
let pollingInterval: number | undefined

// --- COMPUTED (INVARIANTI) ---
const pendingMessages = computed(() => {
  return allMessages.value.filter((m) => m.status === 'pending')
})

const moderatedMessages = computed(() => {
  // Filtra TUTTI i messaggi che non sono 'pending'
  let filtered = allMessages.value.filter((m) => m.status !== 'pending')

  // Applica il filtro del testo di ricerca, se presente
  if (searchTerm.value.trim()) {
    const lowerCaseSearch = searchTerm.value.toLowerCase().trim()

    // Filtra per testo del messaggio o ID (solo le ultime 4 cifre per comodità)
    filtered = filtered.filter(
      (m) =>
        m.text.toLowerCase().includes(lowerCaseSearch) || m.id.slice(-4).includes(lowerCaseSearch),
    )
  }

  // Ordina per ID decrescente, in modo che i più recenti siano in alto nel pannello
  return filtered.sort((a, b) => (parseInt(a.id) > parseInt(b.id) ? -1 : 1))
})

/**
 * Funzione principale per caricare tutti i messaggi e categorizzarli.
 */
async function fetchAndCategorizeMessages() {
  isLoading.value = true
  try {
    const messages = await messageService.fetchMessages()
    allMessages.value = messages.sort((a, b) => (parseInt(a.id) > parseInt(b.id) ? 1 : -1)) // Ordine decrescente per ID (più recenti prima)
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
<style scoped>
/* ---------------------------------------------------------------------- */
/* Transizione Vue per l'effetto Collapse Slide/Fade */
/* ---------------------------------------------------------------------- */

.fade-slide-enter-active,
.fade-slide-leave-active {
  /* Transizione per l'altezza automatica (richiede trick per un smooth collapse) */
  transition:
    opacity 0.3s ease-in-out,
    max-height 0.5s ease-in-out;
  max-height: 1000px; /* Abbastanza grande per contenere tutti i messaggi */
  opacity: 1;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  max-height: 0; /* Simula l'effetto collapse */
}
</style>
