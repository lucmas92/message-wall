import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss()
  ],

  server: {
    // Aggiungi l'host di ngrok per consentire l'accesso esterno
    allowedHosts: ['a9b1e7d7537d.ngrok-free.app'],
    // Opzionale: Se vuoi ascoltare su tutte le interfacce di rete (necessario con ngrok)
    host: '0.0.0.0'
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
