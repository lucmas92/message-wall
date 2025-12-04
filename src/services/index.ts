// src/services/index.ts

import type { IMessageService } from './MessageService'
// import { LocalStorageService } from './LocalStorageService'
// import { MockAuthService } from './MockAuthService'

import type { IAuthService } from './AuthService'
import { SupabaseMessageService } from '@/services/SupabaseMessageService.ts'
import { SupabaseAuthService, preloadRole } from '@/services/SupabaseAuthService.ts'
import { ProfanityService } from '@/services/ProfanityService.ts'

// DECIDI QUI QUALE SERVIZIO UTILIZZARE
// In questo momento, usiamo il LocalStorage per il testing:
// export const messageService: IMessageService = new LocalStorageService()
export const messageService: IMessageService = new SupabaseMessageService()

// DECIDI QUI QUALE SERVIZIO UTILIZZARE PER L'AUTENTICAZIONE
// export const authService: IAuthService = new MockAuthService()
export const authService: IAuthService = new SupabaseAuthService()
export { preloadRole } // Esporta la funzione di pre-caricamento

export const profanityService = new ProfanityService()
