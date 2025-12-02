<template>
  <div class="screen-view">
    <header class="screen-header">
      <h1 class="logo-text">✨ Messaggi Live ✨</h1>
      <p class="tagline">La tua voce sul grande schermo.</p>
    </header>

    <div v-if="isLoading && approvedMessages.length === 0" class="status-overlay">
      <div class="loader-ring"></div>
      <p class="status-text">In attesa di messaggi approvati...</p>
    </div>

    <div v-else-if="approvedMessages.length > 0" class="message-grid-container">
      <transition-group name="message-flow" tag="div" class="message-grid">
        <div
          v-for="message in approvedMessages"
          :key="message.id"
          :class="['message-card', getCardClass(message.id)]"
        >
          <p class="message-text">{{ message.text }}</p>
          <span class="message-id">ID: {{ message.id.slice(-4) }}</span>
        </div>
      </transition-group>
    </div>

    <div v-else-if="!isLoading" class="status-overlay">
      <p class="status-text waiting">Attualmente non ci sono messaggi in coda.</p>
      <p class="status-subtext">Scansiona il QR Code per inviare il tuo!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { messageService } from '@/services'
import type { Message } from '@/services/MessageService'

// Frequenza di aggiornamento in millisecondi (5 secondi)
const POLLING_RATE = 5000

const approvedMessages = ref<Message[]>([])
const isLoading = ref(true)
let pollingInterval: number | undefined

/**
 * Funzione per assegnare una classe di colore basata sull'ID del messaggio (per varietà)
 */
function getCardClass(id: string): string | undefined {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = ['color-1', 'color-2', 'color-3']
  return colors[hash % colors.length]
}

/**
 * Funzione principale per caricare i messaggi e aggiornare lo stato.
 * Si affida al Service Layer per filtrare i messaggi scaduti (display_until).
 */
async function fetchAndUpdateMessages() {
  console.log('fetchAndUpdateMessages')
  try {
    // Aggiorna l'array reattivo. Vue e transition-group gestiscono
    // l'ingresso dei nuovi e l'uscita dei messaggi scaduti.
    approvedMessages.value = await messageService.getApprovedMessages()
  } catch (error) {
    console.error('Errore nel recupero dei messaggi approvati:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Avvia il polling per simulare l'aggiornamento in tempo reale.
 */
function startPolling() {
  // Esegue l'aggiornamento immediatamente e poi ogni POLLING_RATE
  fetchAndUpdateMessages()
  pollingInterval = setInterval(fetchAndUpdateMessages, POLLING_RATE) as unknown as number
}

/**
 * Ferma il polling quando il componente viene distrutto.
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
}

// Ciclo di vita del componente
onMounted(startPolling)
onUnmounted(stopPolling)
</script>

<style scoped>
/* -------------------- VARIABILI E FONDAMENTALI -------------------- */
/* Ho rimosso :root e messo i valori direttamente per un singolo file Vue */
.screen-view {
  min-height: 100vh;
  background-color: #1e1e1e; /* Sfondo scuro per contrasto */
  color: #f4f4f4; /* Testo chiaro */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  box-sizing: border-box;
  font-family: 'Montserrat', sans-serif;
}

/* -------------------- HEADER E STATO -------------------- */

.screen-header {
  width: 100%;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #333;
  margin-bottom: 30px;
}

.logo-text {
  font-size: 5vw;
  font-weight: 900;
  text-transform: uppercase;
  color: #f4f4f4;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
}

.tagline {
  font-size: 1.5vw;
  color: #9e9e9e;
}

.status-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.status-text {
  font-size: 2.5em;
  font-weight: 500;
  color: #00bcd4;
  animation: pulse 2s infinite;
}

.status-subtext {
  font-size: 1.2em;
  margin-top: 10px;
  color: #9e9e9e;
}

/* -------------------- LOADER RING -------------------- */
.loader-ring {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(255, 255, 255, 0.2);
  border-top: 5px solid #00bcd4;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* -------------------- GRIGLIA MESSAGGI -------------------- */

.message-grid-container {
  width: 90%;
  flex-grow: 1;
}

.message-grid {
  display: grid;
  /* Griglia reattiva: 3 colonne se lo schermo è grande, altrimenti si adatta */
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  padding: 20px;
}

.message-card {
  position: relative;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.5);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.5s ease;
}

/* Variazioni di colore per le card */
.message-card.color-1 {
  background-color: #00bcd4;
  color: #1e1e1e;
}
.message-card.color-2 {
  background-color: #ff9800;
  color: #1e1e1e;
}
.message-card.color-3 {
  background-color: #4caf50;
  color: #1e1e1e;
}

.message-text {
  font-size: 2.2em; /* Testo molto grande */
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 15px;
  word-break: break-word;
}

.message-id {
  font-size: 0.8em;
  opacity: 0.7;
  align-self: flex-end;
}

/* -------------------- ANIMAZIONI DI INGRESSO/USCITA -------------------- */

.message-flow-enter-active,
.message-flow-leave-active {
  transition: all 0.8s ease;
}

/* Entrata con fade e leggero movimento verso l'alto (più visibile) */
.message-flow-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.9);
}

/* Movimento per gli elementi esistenti quando ne viene aggiunto uno nuovo (effetto di riordinamento) */
.message-flow-move {
  transition: transform 0.8s ease;
}

/* Gli elementi che escono devono avere position: absolute */
.message-flow-leave-active {
  position: absolute;
}
.message-flow-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Media Query per schermi molto grandi (migliore leggibilità) */
@media (min-width: 1920px) {
  .logo-text {
    font-size: 4em;
  }
  .tagline {
    font-size: 1.2em;
  }
  .message-text {
    font-size: 2.8em;
  }
}
</style>
