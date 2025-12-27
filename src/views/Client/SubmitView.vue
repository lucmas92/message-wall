<template>
  <div class="px-6">
    <!-- Intestazione -->
    <div class="text-center">
      <img src="@/assets/Capodanno2026_Titolo.svg" alt="title" class="w-full mt-6 mb-3" />
      <img src="@/assets/separator.png" alt="separator" class="w-1/2 mx-auto my-4" />
      <h3 class="text-2xl text-white title">Lascia il tuo messaggio</h3>
      <p
        class="text-white/80 px-4 mt-3 font-extralight"
        style="letter-spacing: 0.12rem; line-height: 1.2rem; font-size: 14px"
      >
        Il tuo messaggio apparirà sullo <br />
        schermo durante l'evento
      </p>
      <img src="@/assets/separator.png" alt="separator" class="w-1/2 mx-auto my-4" />
    </div>

    <div class="relative group w-full">
      <form @submit.prevent="handleSubmit" class="space-y-8">
        <!-- Messaggio -->
        <div class="relative group/field">
          <textarea
            class="w-full bg-yellow-200/30 border-2 border-yellow-600/90 rounded-4xl p-5 text-white placeholder-white/60 focus:outline-none focus:border-yellow-500/40 transition-all resize-none text-lg leading-relaxed shadow-inner"
            rows="8"
            v-model="messageText"
            :disabled="isSubmitting"
            :maxlength="MAX_CHARS"
            @input="handleInput"
            :placeholder="'Scrivi il tuo messaggio (Max ' + MAX_CHARS + ' caratteri)...'"
          ></textarea>
        </div>

        <!-- Bottone Invio -->
        <div class="text-center w-full">
          <button
            :disabled="!isActive || isSubmitting"
            type="submit"
            class="relative w-3/4 overflow-hidden font-bold py-3 px-10 rounded-full uppercase bg-gradient-to-t from-yellow-500 to-yellow-300 text-shadow-sm shadow-lg transform transition duration-150 shadow-yellow-300/50 active:scale-95"
          >
            PUBBLICA ORA
          </button>
        </div>
      </form>

      <!-- Footer Card -->
      <div class="my-6 flex flex-col text-white/60 text-xs text-center gap-y-4">
        <p>Il tuo messaggio sarà pubblicato dopo essere stato approvato dagli organizzatori</p>
        <p>
          Hai bisogno di aiuto o vuoi conoscere le regole?
          <router-link :to="{ name: 'info' }" class="underline"> Clicca qui. </router-link>
        </p>
      </div>
    </div>

    <p class="text-center mt-2 text-white/20 text-[10px] font-medium tracking-[0.2em] uppercase">
      PRO LOCO CASTELGOMBERTO
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { messageService } from '@/services'
import { ProfanityService } from '@/services/ProfanityService.ts'
import { SupabaseSettingsService } from '@/services/SupabaseSettingsService.ts'

const settingsService = new SupabaseSettingsService()
const messageText = ref('')
const isActive = ref(false)
const isSubmitting = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

let MAX_CHARS = 500
let MAX_LINES = 5

const pendingCount = ref<number | null>(null) // Stato per il contatore
const COUNT_POLLING_RATE = 20000 // Aggiorna ogni 20 secondi
let countPollingInterval: number | undefined

const isProfane = ref(false)
const handleInput = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  let newValue = textarea.value
  // Applica il limite di caratteri
  if (newValue.length > MAX_CHARS) {
    newValue = newValue.substring(0, MAX_CHARS)
    errorMessage.value = `Il messaggio supera i limiti consentiti: ${MAX_CHARS} caratteri.`
  }
  // Applica il limite di righe
  const currentLines = (newValue.match(/\n/g) || []).length

  if (currentLines >= MAX_LINES) {
    // Se si tenta di inserire un'altra nuova linea, rimuovila
    const lastNewlineIndex = newValue.lastIndexOf('\n')
    const lastChar = newValue.substring(newValue.length - 1)
    if (lastNewlineIndex !== -1 && lastChar === '\n') {
      newValue = newValue.substring(0, newValue.length - 1)
    }
  }

  // Aggiorna il valore reattivo (potrebbe essere stato troncato)
  messageText.value = newValue
}
watch(
  messageText,
  (newText) => {
    const hasProfanity = ProfanityService.containsProfanity(newText)

    // 3. Aggiorna lo stato reattivo
    isProfane.value = hasProfanity

    // 4. (Opzionale) Se è profano, mostra immediatamente un messaggio di errore
    if (hasProfanity) {
      errorMessage.value = '🛑 Il messaggio contiene parole non permesse e non può essere inviato.'
    } else if (errorMessage.value && errorMessage.value.startsWith('🛑')) {
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
  isActive.value = (await settingsService.fetchSetting('is_active', 'false')) as boolean

  if (!isActive.value) {
    errorMessage.value = 'Il sistema non è attivo al momento. Riprova più tardi.'
    return
  }

  if (!messageText.value.trim()) {
    errorMessage.value = 'Il messaggio non può essere vuoto.'
    return
  }

  if (ProfanityService.containsProfanity(messageText.value)) {
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
onMounted(async () => {
  MAX_CHARS = (await settingsService.fetchSetting('max_message_length', '500')) as number
  MAX_LINES = (await settingsService.fetchSetting('max_lines', '5')) as number
  isActive.value = (await settingsService.fetchSetting('is_active', 'false')) as boolean

  ProfanityService.init()
  startCountPolling()
})
onUnmounted(stopCountPolling)
</script>

<style scoped>
.title {
  font-family: 'aw-conqueror-didot', serif;
  font-weight: 400;
  font-style: normal;
}

/* Nessun CSS personalizzato qui, solo classi Tailwind */
</style>
