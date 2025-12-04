import { supabase } from '@/supabase'
import type { IAuthService, UserRole } from './AuthService'

const SESSION_STORAGE_KEY = 'auth_session_role' // Usiamo ancora questo per il caching sincrono

/**
 * Funzione privata che recupera il ruolo dell'utente loggato dal DB.
 * Questa funzione è ASINCRONA.
 */
async function getRoleFromDB(): Promise<UserRole> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 'Guest'
  }

  // Interroga la tabella 'profiles' per l'utente loggato
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // Se c'è un errore o il profilo non esiste (anche se il trigger dovrebbe impedirlo)
    console.error('Errore nel recupero del ruolo dal DB:', error?.message || 'Profilo non trovato')
    return 'Guest'
  }

  const role = profile.role as UserRole

  // Caching: aggiorna LocalStorage con il ruolo recuperato dal DB
  localStorage.setItem(SESSION_STORAGE_KEY, role)

  return role
}

export class SupabaseAuthService implements IAuthService {
  async login(email: string, password: string): Promise<UserRole | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email + '@messagewall.it',
      password: password,
    })

    if (error || !data.user) {
      console.error('Login Supabase fallito:', error?.message)
      return null
    }

    // Login riuscito: recupera il ruolo reale dal database
    // Il ruolo viene salvato in LocalStorage all'interno di getRoleFromDB()
    return await getRoleFromDB()
  }

  /**
   * Questo metodo è SINCRONO e deve essere veloce per il router guard.
   * Controlla prima LocalStorage (cache) e usa il ruolo 'Guest' come fallback.
   */
  getCurrentRole(): UserRole {
    const role = localStorage.getItem(SESSION_STORAGE_KEY) as UserRole
    if (role && ['Admin', 'Screen'].includes(role)) {
      return role
    }
    return 'Guest'
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout Supabase fallito:', error.message)
    }
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

// Nota: Aggiungi questa funzione di pre-caricamento per l'aggiornamento della pagina.
// Quando la pagina viene ricaricata, se c'è una sessione Supabase attiva,
// pre-carichiamo il ruolo (senza aspettare un login).
export async function preloadRole() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session) {
    // Forza il recupero del ruolo dal DB e l'aggiornamento della cache LocalStorage
    await getRoleFromDB()
  }
}
