<script setup lang="ts">
defineProps({
  message: {
    type: Object as () => {
      id: string
      text: string
      status: 'pending' | 'approved' | 'rejected' | '...'
      created_at: number | Date | undefined
      display_until?: number | Date | undefined
    },
    required: true,
  },
})
const emit = defineEmits(['updateStatus'])

const formatDate = (date: number | Date) => {
  console.log('formatDate', typeof date)
  const d = new Date(date)
  return d.toLocaleString()
}

const updateStatusEmit = (messageId: string, status: 'approved' | 'rejected') => {
  // This function is just a placeholder to illustrate that the emit is defined.
  emit('updateStatus', messageId, status)
}
</script>
<template>
  <div class="message-content mb-3 sm:mb-0 sm:w-3/5">
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
      class="flex-1 min-w-32 py-2 rounded font-semibold text-white transition disabled:opacity-50 bg-green-500 hover:bg-green-600"
    >
      <span v-if="message.status === '...'">...</span>
      <span v-else>✅ Approva</span>
    </button>
    <button
      @click="updateStatusEmit(message.id, 'rejected')"
      :disabled="message.status === '...'"
      class="flex-1 min-w-32 py-2 rounded font-semibold text-white transition disabled:opacity-50 bg-red-500 hover:bg-red-600"
    >
      <span v-if="message.status === '...'">...</span>
      <span v-else>❌ Rifiuta</span>
    </button>
  </div>
  <div v-else>
    <div
      :class="[
        'font-medium text-xs whitespace-nowrap',
        message.status === 'approved' ? 'text-green-700' : 'text-red-700',
      ]"
    >
      {{ message.status === 'approved' ? 'Approvato' : 'Rifiutato' }}
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
</template>
