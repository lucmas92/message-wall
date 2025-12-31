<template>
  <div class="bg-transparent p-4 sm:p-6">
    <div class="max-w-full mx-auto">
      <div class="text-sm font-medium text-center text-body border-b border-default">
        <ul class="flex justify-around flex-wrap -mb-px">
          <li class="w-1/2">
            <button
              @click="selectedTab = 'pending'"
              class="w-full"
              :class="[
                selectedTab === 'pending'
                  ? 'inline-block text-blue-500 p-4 text-fg-brand border-b border-brand rounded-t-base active'
                  : 'inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand',
              ]"
            >
              Da moderare ({{ pendingMessages.length }})
            </button>
          </li>
          <li class="w-1/2">
            <button
              @click="selectedTab = 'moderated'"
              class="w-full"
              :class="[
                selectedTab === 'moderated'
                  ? 'inline-block text-blue-500 p-4 text-fg-brand border-b border-brand rounded-t-base active'
                  : 'inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand',
              ]"
              aria-current="page"
            >
              Moderati ({{ moderatedMessages.length }})
            </button>
          </li>
        </ul>
      </div>

      <section v-if="selectedTab == 'pending'" class="py-4">
        <div
          v-if="selectedTab == 'pending' && pendingMessages.length === 0"
          class="p-4 bg-white rounded-lg shadow-sm text-center text-gray-500"
        >
          Nessun nuovo messaggio in attesa.
        </div>

        <ul class="space-y-1" v-if="selectedTab == 'pending'">
          <li
            v-for="message in pendingMessages"
            :key="message.id"
            class="p-1 rounded-lg flex justify-between items-center transition duration-100"
          >
            <MessageComponent :message="message" @updateStatus="updateStatus" />
          </li>
        </ul>
      </section>

      <section v-if="selectedTab == 'moderated'" class="py-0">
        <div class="py-2 text-center text-gray-500">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Cerca per testo..."
            class="w-full bg-white p-2 border border-gray-300 rounded-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="overflow-y-auto my-2 no-scrollbar space-y-2" style="max-height: 600px">
          <div v-if="moderatedMessages.length === 0" class="p-4 text-center text-gray-500">
            Nessun messaggio trovato con la parola chiave "{{ searchTerm }}".
          </div>

          <ul class="space-y-1 text-sm p-1 pt-0">
            <li
              v-for="message in moderatedMessages"
              :key="message.id"
              class="p-1 rounded-lg flex justify-between items-center transition duration-100"
            >
              <MessageComponent :message="message" @updateStatus="updateStatus" />
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue' // Assicurati che 'computed' sia importato
import { messageService } from '@/services'
import type { Message } from '@/services/MessageService'
import MessageComponent from '@/views/Admin/Components/MessageComponent.vue'
import { SupabaseSettingsService } from '@/services/SupabaseSettingsService.ts'

// --- STATO REATTIVO ---
const allMessages = ref<Message[]>([])
const updateStatusMap = ref(
  new Map<string, '...' | 'pending' | 'approved' | 'rejected' | 'expired'>(),
)
const isLoading = ref(true) // Stato di caricamento iniziale/polling
const searchTerm = ref('')
const selectedTab = ref<'pending' | 'moderated'>('pending')
const settingsService = new SupabaseSettingsService()

// Numero massimo di messaggi approvati/visualizzabili
let MAX_DISPLAY_MESSAGES: number | null = null

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
  // Se si tenta di approvare, verifica il limite massimo
  if (newStatus === 'approved') {
    const approvedCount = allMessages.value.filter((m) => m.status === 'approved').length
    if (approvedCount >= MAX_DISPLAY_MESSAGES!) {
      // Blocca l'approvazione e avvisa l'admin
      window.alert(
        `Impossibile approvare: è già stato raggiunto il numero massimo di messaggi approvati (${MAX_DISPLAY_MESSAGES}).`,
      )
      return
    }
  }

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

// --- CICLO DI VITA DEL COMPONENTE ---
onMounted(async () => {
  startPolling()

  MAX_DISPLAY_MESSAGES = (await settingsService.fetchSetting(
    'max_display_messages',
    '6',
  )) as number
})

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
