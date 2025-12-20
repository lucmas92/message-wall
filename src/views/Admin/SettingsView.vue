<template>
  <div class="min-h-screen bg-gray-100 p-4 sm:p-6">
    <div
      v-for="setting in settings"
      :key="setting.id"
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-md"
              >KEY</span
            >
            <h3 class="font-mono text-indigo-600 font-bold">{{ setting.key }}</h3>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed">{{ setting.description }}</p>
        </div>

        <div class="flex items-center gap-4 w-full sm:w-auto">
          <!-- Input Dinamico basato sul tipo di dato -->
          <div class="relative flex-1 sm:w-48">
            <input
              v-if="typeof setting.value === 'number' || !isNaN(Number(setting.value))"
              type="number"
              v-model="setting.value"
              class="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-gray-900 font-bold"
            />
            <input
              v-else
              type="text"
              v-model="setting.value"
              class="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-gray-900 font-bold"
            />
          </div>

          <button
            @click="saveSetting(setting)"
            :disabled="isSaving === setting.key"
            :class="[
              'px-6 py-2 rounded-lg font-bold text-sm transition shadow-sm flex items-center gap-2',
              isSaving === setting.key
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
            ]"
          >
            <span
              v-if="isSaving === setting.key"
              class="animate-spin border-2 border-white border-t-transparent rounded-full h-3 w-3"
            ></span>
            {{ isSaving === setting.key ? 'Salvataggio...' : 'Salva' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="settings.length === 0"
      class="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200"
    >
      <p class="text-gray-400 font-medium text-lg">Nessuna impostazione trovata nel database.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Setting, SupabaseSettingsService } from '@/services/SupabaseSettingsService.ts'
import { onMounted, ref } from 'vue'

const settingsService = new SupabaseSettingsService()

const settings = ref<Setting[]>([])
const isSaving = ref<string | null>(null)

async function saveSetting(setting: Setting) {
  isSaving.value = setting.key
  try {
    await settingsService.updateSetting(setting.key, setting.value)
    console.log(`Impostazione "${setting.key}" salvata!`, 'success')
  } catch (err: any) {
    console.error(`Errore: ${err.message}`, 'error')
  } finally {
    isSaving.value = null
  }
}

onMounted(async () => {
  settings.value = await settingsService.fetchSettings()
})
</script>
