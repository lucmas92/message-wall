import { createRouter, createWebHistory } from 'vue-router'
import SubmitView from '@/views/Client/SubmitView.vue'
import LoginView from '@/views/LoginView.vue'
import type { UserRole } from '@/services/AuthService.ts'
import { authService } from '@/services'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'submit',
      component: SubmitView, // Il Portale Cliente
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/Admin/AdminView.vue'),
      // METADATI: Richiede il ruolo 'Admin' per l'accesso
      meta: { requiresRole: 'Admin' as UserRole },
    },
    {
      path: '/screen',
      name: 'screen',
      component: () => import('@/views/ScreenView.vue'),
      // METADATI: Richiede il ruolo 'Admin' per l'accesso
      meta: { requiresRole: 'Screen' as UserRole },
    },
  ],
})

// Guardia Globale di Navigazione
router.beforeEach((to, from, next) => {
  const requiredRole = to.meta.requiresRole as UserRole | undefined

  if (requiredRole) {
    const currentRole = authService.getCurrentRole()
    console.log('currentRole', currentRole, requiredRole)

    // 1. Controlla se l'utente è loggato e ha il ruolo corretto
    if (currentRole === requiredRole) {
      next() // Tutto ok
    }
    // 2. L'Admin può accedere a tutto (opzionale: una regola per comodità)
    else if (currentRole === 'Admin' && requiredRole === 'Screen') {
      next()
    }
    // 3. Reindirizzamento al login se non autorizzato
    else {
      // Passiamo l'URL di destinazione come query per tornare indietro dopo il login
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
  } else {
    // La rotta non è protetta (es. / o /login)
    next()
  }
})

export default router
