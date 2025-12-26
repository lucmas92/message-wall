<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object as () => {
      id: string
      text: string
      status: 'pending' | 'approved' | 'rejected' | 'expired' | '...'
      created_at: number | Date | undefined
      display_until?: number | Date | undefined
    },
    required: true,
  },
})
const emit = defineEmits(['updateStatus'])

const messageStatus = computed(() => {
  if (props.message.status == 'rejected') return 'Rifiutato'
  else if (props.message.status == 'approved') return 'Approvato'
  else if (props.message.status == 'expired') return 'Scaduto'
  else return 'In attesa'
})

// Classe CSS dinamica in base allo stato del messaggio per testo e sfondo
const messageClass = computed(() => {
  const baseClass = 'p-4 rounded shadow-sm '
  0
  switch (props.message.status) {
    case 'approved':
      return baseClass + 'bg-green-50 border border-green-200'
    case 'rejected':
      return baseClass + 'bg-red-50 border border-red-200'
    case 'expired':
      return baseClass + 'bg-gray-50 border border-gray-200'
    case 'pending':
    case '...':
    default:
      return baseClass + 'bg-yellow-50'
  }
})

const formatDate = (date: number | Date) => {
  const d = new Date(date)
  return d.toLocaleString()
}

const updateStatusEmit = (messageId: string, status: 'approved' | 'rejected') => {
  // This function is just a placeholder to illustrate that the emit is defined.
  emit('updateStatus', messageId, status)
}
</script>
<template>
  <div
    :class="messageClass"
    class="message-content mb-3 sm:mb-0 w-full flex flex-col lg:flex-row gap-x-1 justify-between"
  >
    <div>
      <p class="text-gray-900 font-medium text-base whitespace-pre-wrap">
        {{ message.text }}
      </p>
      <small class="text-gray-400 text-xs">
        {{ formatDate(message.created_at!) }}<br />
        ID: {{ message.id.slice(-4) }}</small
      >
    </div>
    <div class="flex space-x-2 w-full sm:w-auto" v-if="['pending', '...'].includes(message.status)">
      <button
        @click="updateStatusEmit(message.id, 'approved')"
        :disabled="message.status === '...'"
        class="flex-1 min-w-32 py-1 rounded font-semibold text-white transition disabled:opacity-50 bg-green-500 hover:bg-green-600"
      >
        <span v-if="message.status === '...'">...</span>
        <span v-else>Approva</span>
      </button>
      <button
        @click="updateStatusEmit(message.id, 'rejected')"
        :disabled="message.status === '...'"
        class="flex-1 min-w-32 py-1 rounded font-semibold text-white transition disabled:opacity-50 bg-red-500 hover:bg-red-600"
      >
        <span v-if="message.status === '...'">...</span>
        <span v-else>Rifiuta</span>
      </button>
    </div>
    <div v-else>
      <div
        :class="[
          'font-medium text-xs whitespace-nowrap',
          message.status === 'approved' ? 'text-green-700' : 'text-red-700',
        ]"
      >
        {{ messageStatus }}
      </div>
      <button
        @click="updateStatusEmit(message.id, 'approved')"
        class="text-xs py-1 px-2 rounded font-semibold text-white transition disabled:opacity-50 bg-green-500 hover:bg-green-600"
        v-if="message.status == 'rejected'"
      >
        Approva
      </button>
      <button
        @click="updateStatusEmit(message.id, 'rejected')"
        class="text-xs py-1 px-2 rounded font-semibold text-white transition disabled:opacity-50 bg-red-500 hover:bg-red-600"
        v-if="message.status == 'approved'"
      >
        Rifiuta
      </button>
    </div>
  </div>
</template>
