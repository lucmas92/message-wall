<template>
  <div class="max-w-md mx-auto h-screen flex text-center justify-center items-center">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl mb-48">
      <h2 class="text-3xl font-bold text-center text-gray-900">Accesso Riservato</h2>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="text-left">
          <label for="nome_utente" class="block text-sm font-medium text-gray-700">
            Nome Utente:
          </label>
          <input
            type="text"
            id="username"
            class="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm appearance-none placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            v-model.trim="username"
            :disabled="isLoading"
          />
        </div>
        <div class="text-left">
          <label for="nome_utente" class="block text-sm font-medium text-gray-700">
            Password:
          </label>
          <input
            type="password"
            id="password"
            class="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm appearance-none placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            autocomplete="false"
            v-model.trim="password"
            :disabled="isLoading"
          />
        </div>

        <button
          class="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          type="submit"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Accesso in corso...' : 'Accedi' }}
        </button>

        <p v-if="error" class="text-sm font-medium mt-3 text-red-600">❌ {{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

async function handleLogin() {
  error.value = null
  isLoading.value = true

  if (username.value == '' || password.value == '') {
    // Login fallito
    error.value = 'Nome utente o password non validi.'
  } else {
    const role = await authService.login(username.value, password.value)

    if (role) {
      // Login riuscito: reindirizza in base al ruolo
      if (role === 'Admin') {
        await router.push({ name: 'AdminDashboard' })
      } else if (role === 'Screen') {
        await router.push({ name: 'screen' })
      } else {
        await router.push({ name: 'submit' }) // Se il ruolo non è specifico, torna alla home
      }
    } else {
      // Login fallito
      error.value = 'Nome utente o password non validi.'
    }
  }

  isLoading.value = false
}
</script>
