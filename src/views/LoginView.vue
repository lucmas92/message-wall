<template>
  <div class="login-container">
    <h2>Accesso Riservato</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">Nome Utente:</label>
        <input type="text" id="username" v-model="username" required :disabled="isLoading" />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input
          type="password"
          id="password"
          autocomplete="false"
          v-model="password"
          required
          :disabled="isLoading"
        />
      </div>

      <button type="button" @click="loginMonitor">Login monitor</button>
      <button type="button" @click="loginAdmin">Login admin</button>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Accesso in corso...' : 'Accedi' }}
      </button>

      <p v-if="error" class="error-message">❌ {{ error }}</p>
    </form>
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

async function loginMonitor() {
  username.value = 'screen_user'
  password.value = 'monitor'
  await handleLogin()
}

async function loginAdmin() {
  username.value = 'admin'
  password.value = 'password123'
  await handleLogin()
}

async function handleLogin() {
  error.value = null
  isLoading.value = true

  const role = await authService.login(username.value, password.value)

  if (role) {
    // Login riuscito: reindirizza in base al ruolo
    if (role === 'Admin') {
      router.push({ name: 'admin' })
    } else if (role === 'Screen') {
      router.push({ name: 'screen' })
    } else {
      router.push({ name: 'submit' }) // Se il ruolo non è specifico, torna alla home
    }
  } else {
    // Login fallito
    error.value = 'Nome utente o password non validi.'
  }

  isLoading.value = false
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 30px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  text-align: center;
}
h2 {
  color: #333;
  margin-bottom: 25px;
}
.form-group {
  margin-bottom: 20px;
  text-align: left;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s;
}
button:hover:not(:disabled) {
  background-color: #0056b3;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.error-message {
  color: #dc3545;
  margin-top: 15px;
  font-weight: bold;
}
</style>
