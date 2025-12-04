// src/supabase.ts

import { createClient } from '@supabase/supabase-js'

// Accesso alle variabili definite in .env (VITE_ prefisso obbligatorio in Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Questo errore si verifica se mancano le chiavi nel file .env.development
  throw new Error('Le variabili VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non sono configurate.')
}

// Inizializza il client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
