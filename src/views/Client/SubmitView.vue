<template>
  <div class="px-6 max-w-2xl">
    <Transition
      mode="out-in"
      enter-active-class="transition duration-1000 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-500 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="loading" class="min-h-48 bg-transparent z-99">
        <div class="flex justify-center items-center space-x-2">
          <div class="h-3 w-3 bg-yellow-500 rounded-full animate-bounce"></div>
          <div
            class="h-3 w-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"
          ></div>
          <div
            class="h-3 w-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.5s]"
          ></div>
        </div>
      </div>
      <div v-else>
        <!-- Intestazione -->
        <div class="text-center">
          <img src="@/assets/Capodanno2026_Titolo.svg" alt="title" class="w-full mt-2 mb-3" />
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
                :disabled="isSubmitting || !isActive"
                :maxlength="MAX_CHARS"
                @input="handleInput"
                :placeholder="'Scrivi il tuo messaggio...\n(Max ' + MAX_CHARS + ' caratteri)'"
              ></textarea>
            </div>

            <!-- Bottone Invio -->
            <div class="text-center w-full">
              <button
                v-if="isActive"
                :disabled="!isActive || isSubmitting || messageText.trim().length === 0"
                type="submit"
                class="relative w-3/4 overflow-hidden font-bold py-3 px-10 rounded-full disabled:text-bg-input disabled:cursor-not-allowed uppercase bg-gradient-to-t from-yellow-500 disabled:from-yellow-300/80 to-yellow-300 disabled:to-yellow-200/80 text-shadow-sm shadow-lg transform transition duration-150 shadow-yellow-300/50"
              >
                PUBBLICA ORA
              </button>
              <div
                v-if="!isActive"
                class="relative w-full overflow-hidden font-bold py-3 px-10 text-white rounded-full bg-gradient-to-t from-red-500 to-red-800 text-shadow-sm shadow-lg transform transition duration-150 shadow-yellow-300/50"
              >
                <p>Il sistema di invio messaggi è attualmente disattivato. Riprova più tardi.</p>
              </div>
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
      </div>
    </Transition>

    <p class="text-center mt-2 text-white/20 text-[10px] font-medium tracking-[0.2em] uppercase">
      PRO LOCO CASTELGOMBERTO
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { messageService } from '@/services'
import { ProfanityService } from '@/services/ProfanityService.ts'
import { SupabaseSettingsService } from '@/services/SupabaseSettingsService.ts'
import router from '@/router'

const settingsService = new SupabaseSettingsService()
const messageText = ref('')
const isActive = ref(false)
const loading = ref(true)
const isSubmitting = ref(false)

let MAX_CHARS = 500
let MAX_LINES = 5

const pendingCount = ref<number | null>(null) // Stato per il contatore
const COUNT_POLLING_RATE = 20000 // Aggiorna ogni 20 secondi
let countPollingInterval: number | undefined

const handleInput = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  let newValue = textarea.value
  // Applica il limite di caratteri
  if (newValue.length > MAX_CHARS) {
    newValue = newValue.substring(0, MAX_CHARS)
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
  try {
    isActive.value = (await settingsService.fetchSetting('is_active', 'false')) as boolean

    if (!isActive.value) {
      console.warn('Il sistema non è attivo al momento. Riprova più tardi.')
      return
    }

    if (!messageText.value.trim()) {
      console.warn('Il messaggio non può essere vuoto.')
      return
    }

    isSubmitting.value = true

    await messageService.submitMessage({ text: messageText.value })
    await fetchPendingCount()
    messageText.value = '' // Pulisce il campo

    await router.push('/success')
  } catch (error) {
    console.error(error)
    await router.push('/error')
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
  setTimeout(() => {
    loading.value = false
  }, 200)
})
onUnmounted(stopCountPolling)
</script>

<style scoped>
/* Easing personalizzato per un feeling più "app-like" */
.ease-in-quad {
  transition-timing-function: cubic-bezier(0.55, 0.085, 0.68, 0.53);
}
</style>
