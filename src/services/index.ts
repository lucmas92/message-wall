// src/services/index.ts

import type { IMessageService } from './MessageService'
import { LocalStorageService } from './LocalStorageService'
// import { SupabaseService } from './SupabaseService'; // Commentato per ora

import type { IAuthService } from './AuthService'
import { MockAuthService } from './MockAuthService'

// DECIDI QUI QUALE SERVIZIO UTILIZZARE
// In questo momento, usiamo il LocalStorage per il testing:
export const messageService: IMessageService = new LocalStorageService()
// export const messageService: IMessageService = new SupabaseService();

// DECIDI QUI QUALE SERVIZIO UTILIZZARE PER L'AUTENTICAZIONE
export const authService: IAuthService = new MockAuthService()
