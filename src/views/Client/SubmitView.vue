<template>
  <div class="submit-portal">
    <h1>Il Tuo Messaggio sullo Schermo</h1>
    <p>Scrivi qui sotto il tuo messaggio. Sarà visualizzato dopo la moderazione.</p>

    <form @submit.prevent="handleSubmit">
      <textarea
        autofocus
        @keydown.enter="handleSubmit"
        v-model="messageText"
        :disabled="isSubmitting"
        placeholder="Inserisci il tuo testo qui..."
        maxlength="250"
      ></textarea>

      <button type="submit" :disabled="isSubmitting || !messageText.trim()">
        {{ isSubmitting ? 'Invio in corso...' : 'Invia Messaggio' }}
      </button>
    </form>

    <div v-if="successMessage" class="message success">✅ {{ successMessage }}</div>
    <div v-if="errorMessage" class="message error">❌ Errore: {{ errorMessage }}</div>
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

<style scoped>
/* (MANTIENI GLI STILI PRECEDENTI) */
.submit-portal {
  /* ... */
}
/* ... */
</style>
