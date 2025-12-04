<template>
  <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
    <div
      class="w-full max-w-lg bg-gray-800 border border-indigo-900 shadow-2xl rounded-2xl mb-14 p-6 sm:p-10 transform transition-all duration-500 hover:shadow-indigo-700/50"
    >
      <h1
        class="text-4xl font-extrabold text-white text-center mb-1 drop-shadow-lg"
        style="
          text-shadow:
            0 0 10px #6366f1,
            0 0 20px #4f46e5;
        "
      >
        🚀 Proietta il tuo Messaggio
      </h1>
      <p class="text-center text-indigo-400 mb-8 text-lg font-light">
        Scrivi qui sotto e preparati per il grande schermo.
      </p>

      <div
        v-if="pendingCount !== null"
        class="text-center mb-6 py-2 px-4 rounded-full"
        :class="{
          'bg-yellow-800 text-yellow-300': pendingCount > 0,
          'bg-gray-700 text-gray-400': pendingCount === 0,
        }"
      >
        <span class="font-bold">Coda di Moderazione:</span>
        <span v-if="pendingCount > 0" class="ml-1 animate-pulse"
          >{{ pendingCount }} messaggi in attesa</span
        >
        <span v-else class="ml-1">Coda vuota! 🟢</span>
      </div>

      <form @submit.prevent="handleSubmit">
        <textarea
          v-model="messageText"
          :disabled="isSubmitting"
          placeholder="Digita qui il tuo pensiero..."
          maxlength="250"
          rows="6"
          class="w-full p-4 border-2 rounded-xl bg-gray-700 text-white text-lg transition duration-300 ease-in-out resize-none border-indigo-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/50 shadow-inner shadow-gray-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
        ></textarea>

        <div class="flex justify-between items-center mt-3 mb-6">
          <div
            class="text-sm font-medium"
            :class="messageText.length > 220 ? 'text-red-400' : 'text-indigo-400'"
          >
            {{ 250 - messageText.length }} caratteri rimanenti
          </div>
          <small class="text-xs text-gray-500">Max 250 caratteri</small>
        </div>

        <button
          type="submit"
          v-if="!isProfane"
          :disabled="isSubmitting || !messageText.trim()"
          class="w-full py-4 rounded-xl text-lg font-bold uppercase tracking-wider transition duration-300 ease-in-out bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 hover:bg-indigo-500 hover:shadow-indigo-400/70 disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Invio in corso...
          </span>
          <span v-else> INVIA E METTI IN CODA </span>
        </button>
      </form>
      <div class="mt-6 text-center">
        <router-link
          :to="{ name: 'info' }"
          class="text-sm text-indigo-400 hover:text-indigo-300 transition duration-150 border-b border-indigo-400 border-opacity-50"
        >
          Hai bisogno di aiuto o vuoi conoscere le regole? Clicca qui.
        </router-link>
      </div>
      <div
        v-if="successMessage"
        class="mt-8 p-5 rounded-xl bg-green-900/50 text-green-300 border border-green-600 font-medium shadow-xl"
      >
        ✅ {{ successMessage }}
      </div>
      <div
        v-if="errorMessage"
        class="mt-8 p-5 rounded-xl bg-red-900/50 text-red-300 border border-red-600 font-medium shadow-xl"
      >
        ❌ Errore: {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { messageService, profanityService } from '@/services'

const messageText = ref('')
const isSubmitting = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const pendingCount = ref<number | null>(null) // Stato per il contatore
const COUNT_POLLING_RATE = 20000 // Aggiorna ogni 20 secondi
let countPollingInterval: number | undefined

const isProfane = ref(false)

watch(
  messageText,
  (newText) => {
    // 1. Rimuovi immediatamente i messaggi di successo/errore passati
    successMessage.value = null
    errorMessage.value = null

    // 2. Esegui il controllo del servizio
    const hasProfanity = profanityService.check(newText)

    // 3. Aggiorna lo stato reattivo
    isProfane.value = hasProfanity

    // 4. (Opzionale) Se è profano, mostra immediatamente un messaggio di errore
    if (hasProfanity) {
      errorMessage.value = '🛑 Il messaggio contiene parole non permesse e non può essere inviato.'
    } else if (errorMessage.value !== null && errorMessage.value.startsWith('🛑')) {
      // Pulisci l'errore specifico del profanity checker se l'utente corregge il testo
      errorMessage.value = null
    }
  },
  { immediate: true },
)

async function fetchPendingCount() {
  try {
    pendingCount.value = await messageService.getPendingMessageCount()
  } catch (error) {
    console.error('Errore nel recupero del conteggio:', error)
    pendingCount.value = null
  }
}

function startCountPolling() {
  fetchPendingCount() // Esegue subito
  countPollingInterval = setInterval(fetchPendingCount, COUNT_POLLING_RATE) as unknown as number
}

function stopCountPolling() {
  if (countPollingInterval) {
    clearInterval(countPollingInterval)
  }
}

async function handleSubmit() {
  if (!messageText.value.trim()) {
    errorMessage.value = 'Il messaggio non può essere vuoto.'
    return
  }

  if (profanityService.check(messageText.value)) {
    errorMessage.value =
      'Il messaggio contiene parole non permesse. Modifica il testo per poterlo inviare.'
    // Non procedere con l'invio
    return
  }

  isSubmitting.value = true
  successMessage.value = null
  errorMessage.value = null

  try {
    const newId = await messageService.submitMessage({ text: messageText.value })

    successMessage.value = `Messaggio inviato! Sarà moderato a breve. ID coda: ${newId.slice(-4)}`
    await fetchPendingCount()
    messageText.value = '' // Pulisce il campo
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Si è verificato un errore sconosciuto durante l'invio."
  } finally {
    isSubmitting.value = false
  }
}

// Ciclo di vita per il polling
onMounted(startCountPolling)
onUnmounted(stopCountPolling)
</script>

<style scoped>
/* Nessun CSS personalizzato qui, solo classi Tailwind */
</style>
