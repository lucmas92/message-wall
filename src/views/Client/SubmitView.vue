<template>
  <div class="min-h-screen bg-[#050510] flex flex-col items-center justify-start p-4">
    <!-- Intestazione -->
    <div class="text-center mb-10">
      <span
        class="inline-block px-4 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4"
      >
        Exclusive Event
      </span>
      <h1
        class="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 leading-tight"
      >
        Brindisi Digitale
      </h1>
      <p class="text-white/40 text-sm mt-3 font-light tracking-wide">
        Invia il tuo augurio per il 2025 sullo schermo
      </p>
    </div>

    <div class="relative group md:w-1/2 max-w-md">
      <!-- Bordo Neon Dorato -->
      <div
        class="absolute -inset-[1px] bg-gradient-to-b from-yellow-500/50 via-transparent to-yellow-500/50 rounded-[2.5rem] opacity-30"
      ></div>

      <div
        class="relative bg-black/40 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-2xl border border-white/5"
      >
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- Messaggio -->
          <div class="space-y-3">
            <label class="flex justify-between items-end px-1">
              <span class="text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest"
                >Il tuo Pensiero</span
              >
              <span class="text-[9px] text-white/30 font-medium tracking-tighter"
                >MAX {{ MAX_CHARS }} CARATTERI</span
              >
            </label>
            <div class="relative group/field">
              <textarea
                class="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder-white/10 focus:outline-none focus:border-yellow-500/40 transition-all resize-none text-lg leading-relaxed shadow-inner"
                rows="4"
                v-model="messageText"
                :disabled="isSubmitting"
                :maxlength="MAX_CHARS"
                @input="handleInput"
                placeholder="Cosa succederà a mezzanotte?"
              ></textarea>
              <div
                class="absolute bottom-4 right-4 text-xl opacity-20 group-focus-within/field:opacity-50 transition-opacity"
              >
                ✨
              </div>
            </div>
          </div>

          <!-- Bottone Invio -->
          <div>
            <button
              :disabled="!isActive || isSubmitting"
              type="submit"
              :class="[
                !isActive || isSubmitting
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:scale-[1.02] active:scale-95 animate-pulse',
              ]"
              class="relative w-full group/btn overflow-hidden rounded-[1.5rem] p-[2px] transition-transform active:scale-95"
            >
              <!-- Shimmer Effect -->
              <div
                class="absolute inset-0 bg-gradient-to-r from-yellow-700 via-yellow-200 to-yellow-700 animate-shimmer"
              ></div>

              <div
                class="relative bg-transparent transition-colors duration-500 py-2 rounded-[1.4rem] flex items-center justify-center gap-3"
              >
                <span class="text-black font-extrabold text-lg tracking-tighter transition-colors">
                  PUBBLICA ORA
                </span>
              </div>
            </button>
          </div>
        </form>

        <!-- Footer Card -->
        <div
          class="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center gap-4"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              :class="isActive ? 'bg-green-500' : 'bg-red-500'"
            ></span>
            <span class="text-[9px] text-white/40 font-bold uppercase tracking-wider"
              >Live System {{ isActive ? 'Active' : 'Inactive' }}</span
            >
          </div>

          <router-link
            :to="{ name: 'info' }"
            class="text-[10px] text-white/60 hover:text-indigo-300 text-center"
          >
            Hai bisogno di aiuto o vuoi conoscere le regole? Clicca qui.
          </router-link>
        </div>
      </div>
    </div>

    <p class="text-center mt-10 text-white/20 text-[10px] font-medium tracking-[0.2em] uppercase">
      Capodanno 2025 • Modera responsabilmente
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
/* Nessun CSS personalizzato qui, solo classi Tailwind */
</style>
