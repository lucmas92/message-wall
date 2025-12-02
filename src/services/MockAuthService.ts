// src/services/MockAuthService.ts

import type { IAuthService, UserRole } from './AuthService'

const SESSION_STORAGE_KEY = 'auth_session_role'

// Credenziali FITTIZIE per il test
const MOCK_USERS: { [key: string]: { password: string; role: UserRole } } = {
  admin: { password: 'password123', role: 'Admin' }, // Accesso all'area admin
  screen_user: { password: 'monitor', role: 'Screen' }, // Accesso allo schermo
}

export class MockAuthService implements IAuthService {
  async login(username: string, password: string): Promise<UserRole | null> {
    // Simula la latenza di rete
    await new Promise((resolve) => setTimeout(resolve, 800))

    const user = MOCK_USERS[username]

    if (user && user.password === password) {
      // Login riuscito: salva il ruolo in LocalStorage
      localStorage.setItem(SESSION_STORAGE_KEY, user.role)
      return user.role
    }

    // Login fallito
    return null
  }

  getCurrentRole(): UserRole {
    const role = localStorage.getItem(SESSION_STORAGE_KEY) as UserRole
    if (role && ['Admin', 'Screen'].includes(role)) {
      return role
    }
    return 'Guest' // Ruolo di default per chi non è loggato
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
