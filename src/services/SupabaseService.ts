// src/services/SupabaseService.ts (Non lo userai subito)

// import type { IMessageService, Message } from './MessageService';
// import { supabase } from '@/supabase'; // L'istanza di Supabase

// export class SupabaseService implements IMessageService {
//   async submitMessage(newMessage: Pick<Message, 'text'>): Promise<string> {
//     const { data, error } = await supabase
//       .from('messages')
//       .insert({
//         text: newMessage.text,
//         status: 'pending' as Message['status']
//       })
//       .select('id')
//       .single();
//
//     if (error || !data) {
//       throw new Error(`Errore Supabase: ${error?.message || 'Nessun ID restituito'}`);
//     }
//
//     return data.id as string;
//   }
// }
