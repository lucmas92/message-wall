// src/services/AuthService.ts

/**
 * Ruoli di accesso gestiti dall'applicazione.
 */
export type UserRole = 'Admin' | 'Screen' | 'Guest'

/**
 * L'interfaccia (contratto) che definisce i metodi di autenticazione.
 */
export interface IAuthService {
  /**
   * Tenta il login con le credenziali fornite.
   * @returns Il ruolo dell'utente se il login ha successo, altrimenti null.
   */
  login(username: string, password: string): Promise<UserRole | null>

  /**
   * Recupera il ruolo dell'utente loggato dalla sessione.
   */
  getCurrentRole(): UserRole

  /**
   * Esegue il logout.
   */
  logout(): void
}
