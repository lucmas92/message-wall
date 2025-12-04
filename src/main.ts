import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { preloadRole } from '@/services' // Importa la funzione
import './assets/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

preloadRole().then(() => {
  const app = createApp(App)

  app.use(router)
  app.mount('#app')
})
