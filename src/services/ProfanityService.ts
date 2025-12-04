// src/services/ProfanityService.ts

/**
 * Lista di parole non permesse e radici.
 * - Le parole che NON terminano con '#' sono radici aggressive (es. cazz) o bestemmie composte (es. diocan)
 * e vengono cercate in modo permissivo.
 * - Le parole che terminano con '#' (es. figa#) sono parole esatte e devono matchare il confine di parola (#).
 */
const PROFANITY_LIST: string[] = [
  // 1. BLASFEMIA / BESTEMMIE (Cercate in modo permissivo)
  'diobo',
  'dioca',
  'diopor',
  'diomer',
  'diocan',
  'diamma',
  'diofa',
  'diogu',
  'porcod',
  'gesucr',
  'madonnac',

  // 2. INSULTI SESSUALI E VOLGARI (Radici aggressive)
  'cazz',
  'fott',
  'culatt',
  'puttan',
  'troi',
  'bordel',
  'succhia',
  'fellat',
  'segh',
  'coion',
  'cogl',
  'pomp',

  // 3. PAROLE ESATTE (Blocca solo la parola intera, usando il delimitatore '#')
  'figa#', // Blocca "figa" ma non "figata" o "figura"
  'fighe#',
  'fighetta#',
  'merda#', // Se non vuoi bloccare parole come "meridiano"
  'stronzo#',
  'stronza#',

  // 4. VULGARITÀ/HATE SPEECH
  'bastard',
  'idiot',
  'vaffanc',
  'rompic',
  'testadic',
  'defic',
  'negro',
  'froc',
  'zingar',
  'terron',
  'ebreo',
  'razzis',
  'omofob',
  'nazis',
  'fascist',
]

/**
 * Funzione di normalizzazione Leet Speak.
 * Sostituisce i numeri e i caratteri ambigui con le lettere più comuni corrispondenti.
 * Questa funzione rende il filtro resistente all'elusione tramite numeri.
 */
const leetNormalize = (text: string): string => {
  return text
    .replace(/0/g, 'o') // 0 -> o
    .replace(/3/g, 'e') // 3 -> e
    .replace(/4/g, 'a') // 4 -> a
    .replace(/7/g, 't') // 7 -> t
    .replace(/1/g, 'i') // 1 -> i (copre anche la fonetica 'l')
}

/**
 * Servizio per verificare la presenza di contenuti inappropriati.
 * Esegue un controllo robusto che cattura anche parole separate da spazi o punteggiatura.
 */
export class ProfanityService {
  /**
   * Verifica se il testo fornito contiene parole vietate.
   * @param text Il testo da analizzare.
   * @returns True se viene trovata una parola vietata, altrimenti False.
   */
  public check(text: string): boolean {
    if (!text || text.trim() === '') {
      return false
    }

    // 1. Normalizzazione: minuscolo, Leet Speak
    const normalized = leetNormalize(text.toLowerCase())

    // Rimuove la punteggiatura ambigua, ma manteniamo gli spazi temporaneamente
    const punctuationFree = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')

    // 2. Creazione della Stringa di Ricerca Continua (con delimitatore '#')
    // Sostituiamo gli spazi con '#'. Rimuoviamo gli altri caratteri non alfanumerici che potrebbero essere rimasti.
    const searchString = punctuationFree.replace(/\s+/g, '#').replace(/[^a-z0-9#]/g, '')

    // 3. Aggiungiamo un delimitatore di fine stringa per il check di parole esatte alla fine del testo
    // Esempio: "che figa" -> "che#figa#". Questo permette a "figa#" di matchare.
    const finalSearchString = searchString + '#'

    if (finalSearchString.length === 0) {
      return false
    }

    // 4. Verifica la presenza di una corrispondenza
    for (const profaneWord of PROFANITY_LIST) {
      // Verifichiamo se la parola in lista è una radice (non finisce con #) o una parola esatta (finisce con #)
      if (profaneWord.endsWith('#')) {
        // LOGICA PRECISA: Cerca solo la parola esatta con confine di parola simulato
        if (finalSearchString.includes(profaneWord)) {
          return true
        }
      } else {
        // LOGICA AGGRESSIVA: Cerca la radice in qualsiasi punto della stringa continua
        if (searchString.includes(profaneWord)) {
          return true
        }
      }
    }

    return false
  }
}
