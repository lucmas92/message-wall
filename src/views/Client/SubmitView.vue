<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
    <div class="w-full max-w-md bg-white shadow-xl rounded-lg p-6 sm:p-8 mt-10">
      <h1 class="text-3xl font-extrabold text-gray-900 text-center mb-2">
        Invia il tuo Messaggio
      </h1>
      <p class="text-center text-gray-500 mb-6 text-sm">
        Sarà visualizzato dopo la moderazione.
      </p>

      <form @submit.prevent="handleSubmit">
        <textarea
          v-model="messageText"
          :disabled="isSubmitting"
          placeholder="Inserisci il tuo testo qui (Max 250 caratteri)..."
          maxlength="250"
          rows="5"
          class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out resize-none text-base disabled:opacity-50"
        ></textarea>

        <div class="text-right text-gray-400 text-xs mb-4">
             {{ 250 - messageText.length }} caratteri rimanenti
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || !messageText.trim()"
          class="w-full py-3 px-4 rounded-lg text-white font-semibold transition duration-200 ease-in-out shadow-md
                 bg-indigo-600 hover:bg-indigo-700
                 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {{ isSubmitting ? 'Invio in corso...' : 'Invia Messaggio' }}
        </button>
      </form>

      <div v-if="successMessage" class="mt-6 p-4 rounded-lg bg-green-100 text-green-800 border border-green-300 font-medium">
        ✅ {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="mt-6 p-4 rounded-lg bg-red-100 text-red-800 border border-red-300 font-medium">
        ❌ Errore: {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// Importiamo l'istanza del servizio definito (attualmente LocalStorageService)
import { messageService } from '@/services'

// Stato del form
const messageText = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

messageText.value = Math.random().toString(36).slice(2);

/**
 * Gestisce l'invio del messaggio usando l'istanza del servizio dati.
 */
async function handleSubmit() {
  const text = messageText.value.trim()
  if (!text) {
    errorMessage.value = 'Per favore, scrivi qualcosa!'
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    // CHIAMATA AL SERVIZIO ASTRATTO
    const newId = await messageService.submitMessage({ text: text })

    // Successo
    successMessage.value = `Messaggio inviato (ID: ${newId}). Sarà pubblicato dopo la moderazione.`
    messageText.value = ''

    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (error) {
    // Gestione dell'errore
    console.error("Errore durante l'invio:", error)
    errorMessage.value = "Si è verificato un errore durante l'invio. Riprova."
    messageText.value = text
  } finally {
    isSubmitting.value = false
  }
}
</script>

