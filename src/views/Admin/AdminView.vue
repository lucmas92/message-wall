<template>
  <div class="admin-portal">
    <h1>Pannello di Moderazione Messaggi</h1>
    <button @click="handleLogout" class="btn-logout">Esci</button>

    <div v-if="isLoading" class="loading">Caricamento messaggi... ⏳</div>
    <div v-else-if="errorMessage" class="error-message">❌ Errore: {{ errorMessage }}</div>
    <div v-else>
      <h2>Da Moderare ({{ pendingMessages.length }})</h2>
      <p v-if="pendingMessages.length === 0" class="no-messages">
        Nessun nuovo messaggio in attesa. Rilassati! 😎
      </p>

      <ul class="message-list pending">
        <li v-for="message in pendingMessages" :key="message.id" :class="message.status">
          <div class="message-text">ID: {{ message.id.slice(-4) }} - {{ message.text }}</div>
          <div class="message-actions">
            <button
              @click="updateStatus(message.id, 'approved')"
              :disabled="message.status === '...'"
              class="btn-approve"
            >
              <span v-if="message.status === '...'">Aggiornando...</span>
              <span v-else>✅ Approva</span>
            </button>
            <button
              @click="updateStatus(message.id, 'rejected')"
              :disabled="message.status === '...'"
              class="btn-reject"
            >
              <span v-if="message.status === '...'">Aggiornando...</span>
              <span v-else>❌ Rifiuta</span>
            </button>
          </div>
        </li>
      </ul>

      <h2 class="moderated-title">Già Moderati ({{ moderatedMessages.length }})</h2>
      <ul class="message-list moderated">
        <li v-for="message in moderatedMessages" :key="message.id" :class="message.status">
          <div class="message-text">{{ message.text }}</div>
          <div class="message-status">
            Stato:
            <span :class="message.status">{{
              message.status === 'approved' ? 'Approvato' : 'Rifiutato'
            }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { authService, messageService } from '@/services'
import type { Message } from '@/services/MessageService'
import { useRouter } from 'vue-router'

const messages = ref<Message[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Proprietà calcolate per il filtraggio nell'interfaccia
const pendingMessages = computed(() => messages.value.filter((m) => m.status === 'pending'))
const moderatedMessages = computed(() => messages.value.filter((m) => m.status !== 'pending'))

/**
 * Carica tutti i messaggi dal servizio dati.
 */
async function loadMessages() {
  isLoading.value = true
  errorMessage.value = null
  try {
    messages.value = await messageService.fetchMessages()
  } catch (err) {
    errorMessage.value = 'Impossibile caricare i messaggi.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Aggiorna lo stato di un messaggio e aggiorna l'array locale.
 */
async function updateStatus(id: string, status: Message['status']) {
  const messageToUpdate = messages.value.find((m) => m.id === id)
  if (!messageToUpdate) return

  // 1. Stato temporaneo per disabilitare i pulsanti
  const originalStatus = messageToUpdate.status
  messageToUpdate.status = '...'

  try {
    // 2. Chiamata al servizio
    await messageService.updateMessageStatus(id, status)

    // 3. Successo: aggiornamento definitivo nell'array locale
    messageToUpdate.status = status
  } catch (err) {
    // 4. Errore: ripristino dello stato e messaggio d'errore
    errorMessage.value = `Errore nell'aggiornare il messaggio ${id}.`
    messageToUpdate.status = originalStatus
    console.error(err)
    setTimeout(() => {
      errorMessage.value = null
    }, 5000)
  }
}

const router = useRouter() // Ottieni l'istanza del router

/**
 * Gestisce l'uscita dell'utente.
 */
function handleLogout() {
  authService.logout() // Chiama il servizio per pulire la sessione
  router.push({ name: 'login' }) // Reindirizza l'utente alla pagina di login
}

// Carica i messaggi all'avvio del componente
onMounted(loadMessages)
</script>

<style scoped>
.admin-portal {
  max-width: 900px;
  margin: 50px auto;
  padding: 20px;
  font-family: sans-serif;
}
/* ... (Stili base di prima) ... */
h1,
h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 20px;
}

.no-messages {
  text-align: center;
  color: #9e9e9e;
  font-style: italic;
}

.moderated-title {
  margin-top: 40px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.message-list {
  list-style: none;
  padding: 0;
}

.message-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: #f9f9f9;
}

.message-list.pending li {
  border-left: 5px solid #ffc107; /* Giallo per pending */
}

.message-list.pending li.approved,
.message-list.pending li.rejected {
  /* Nasconde i messaggi in attesa che sono stati approvati/rifiutati in tempo reale */
  display: none;
}

.message-text {
  flex-grow: 1;
  font-size: 16px;
  margin-right: 20px;
}

.message-actions button {
  padding: 8px 15px;
  margin-left: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-approve {
  background-color: #28a745;
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background-color: #218838;
}

.btn-reject {
  background-color: #dc3545;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background-color: #c82333;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* Stili per messaggi già moderati */
.message-list.moderated li.approved {
  background-color: #e2f0d9;
  border-left: 5px solid #28a745;
}

.message-list.moderated li.rejected {
  background-color: #f8d7da;
  border-left: 5px solid #dc3545;
}

.message-status .approved {
  color: #28a745;
  font-weight: bold;
}
.message-status .rejected {
  color: #dc3545;
  font-weight: bold;
}

.loading,
.error-message {
  text-align: center;
  margin-top: 40px;
  font-size: 1.2em;
}
</style>
