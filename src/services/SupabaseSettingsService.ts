import { supabase } from '@/supabase'

const SETTINGS_TABLE = 'settings'

export interface Setting {
  id?: number
  key: string
  value: any // Usiamo any perché il valore JSONB può essere numero, stringa o oggetto
  description?: string
  updated_at?: string
}

export class SupabaseSettingsService {
  async fetchSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value, description')
      .order('id', { ascending: false })

    if (error) {
      console.error('Errore Supabase nel fetch settings:', error.message)
      return []
    }

    return data
  }

  async updateSetting(key: string, newValue: any) {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()

      if (error) throw error
      console.log(`Impostazione ${key} aggiornata correttamente.`)
      return data
    } catch (e) {
      console.error(`Errore durante l'aggiornamento di ${key}:`, e)
    }
  }
}
