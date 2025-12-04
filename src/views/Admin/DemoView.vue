<template>
  <div class="min-h-screen bg-gray-900 p-6 pt-safe pb-safe">
    <h1 class="text-4xl font-extrabold text-indigo-400 text-center mb-6">
        Sistema di Messaggistica Live - 🧪 DEMO COMPLETA
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 mx-auto">

      <div class="bg-gray-800 border border-indigo-900 shadow-2xl rounded-2xl p-6">
        <h2 class="text-3xl font-bold text-white mb-4 border-b pb-2 border-indigo-700">Pannello di Invio (Submit)</h2>
        <div class="h-full overflow-y-auto" style="max-height: 80vh;">
           <SubmitView />
        </div>
      </div>

      <div class="bg-gray-800 border border-green-900 shadow-2xl rounded-2xl p-6">
        <h2 class="text-3xl font-bold text-white mb-4 border-b pb-2 border-green-700">Bacheca Live (Screen)</h2>
        <div class="h-full overflow-y-auto" style="max-height: 80vh;">
           <AdminView />
        </div>
      </div>

      <div class="bg-gray-800 border border-green-900 shadow-2xl rounded-2xl p-6">
        <h2 class="text-3xl font-bold text-white mb-4 border-b pb-2 border-green-700">Bacheca Live (Screen)</h2>
        <div class="h-full overflow-auto" style="max-height: 70vh;">
           <ScreenView />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SubmitView from '@/views/Client/SubmitView.vue'
import ScreenView from '@/views/ScreenView.vue'
import AdminView from '@/views/Admin/AdminView.vue'

// Nota: Dovrai creare fisicamente questi due file nella cartella src/components/
// copiando il contenuto di <template> e <script setup> dai file originali,
// ma rimuovendo il div genitore con "min-h-screen".
</script>

<style scoped>
/* Stili specifici per la demo */
</style>
