<script setup lang="ts">
import { authService } from '@/services'
import { useRouter } from 'vue-router'
import { Settings } from 'lucide-vue-next'

const router = useRouter()

function handleLogout() {
  authService.logout()
  router.push({ name: 'login' })
}
</script>
<template>
  <div class="min-h-screen w-full bg-gray-100/90 py-4 sm:p-6">
    <div class="mx-auto">
      <div class="flex justify-between items-center px-4 pb-2 mb-2 border-b border-gray-300">
        <h1 class="text-xl sm:text-3xl font-bold text-gray-800">Pannello di Moderazione</h1>
        <button
          @click="handleLogout"
          class="btn-logout bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-semibold py-2 px-4 rounded transition"
        >
          Esci
        </button>
      </div>

      <nav class="flex space-x-4 px-4 justify-between text-gray-700">
        <router-link :to="{ name: 'AdminDashboard' }">Messaggi</router-link>
        <router-link :to="{ name: 'AdminSettings' }">
          <Settings />
        </router-link>
      </nav>
      <main>
        <router-view />
      </main>
    </div>
  </div>
</template>
