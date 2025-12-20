// src/services/ProfanityService.ts
import { Profanity } from '@2toad/profanity'

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
  // Istanza singola della libreria
  private static readonly profanity = new Profanity()

  static init() {
    this.profanity.addWords(PROFANITY_LIST)
  }

  /**
   * Verifica se il testo fornito contiene parole vietate.
   * @param text Il testo da analizzare.
   * @returns True se viene trovata una parola vietata, altrimenti False.
   */
  static containsProfanity(text: string): boolean {
    if (!text) return false

    const normalized = this.normalize(text)

    // 1) Controllo con la libreria @2toad/profanity sul testo normalizzato
    //    (dopo aver aggiunto parole italiane tramite init()) [web:76]
    if (this.profanity.exists(normalized)) {
      return true
    }

    // 2) Controllo dizionario semplice custom
    if (this.containsFromDictionary(normalized)) {
      return true
    }

    // 3) Controllo regex avanzato (varianti con numeri/simboli)
    if (this.containsFromRegex(normalized)) {
      return true
    }

    return false
  }
  private static normalize(text: string): string {
    let result = text.toLowerCase()

    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    return leetNormalize(result)
  }

  private static containsFromDictionary(text: string): boolean {
    const words = text.split(/[^a-zàèéìòóù]+/i).filter(Boolean)
    const badSet = new Set(PROFANITY_LIST.map((w) => w.toLowerCase()))

    for (const w of words) {
      if (badSet.has(w)) {
        return true
      }
    }
    return false
  }

  private static readonly regexPatterns: RegExp[] = [
    // Bestemmie principali
    /\b[bB][e3]?[s5]?[t7]?[e3]?[m]?[m]?[i1]?[a4]?\b/gi, // bestemmia
    /\b[pP][o0]?[o0]?[rR][cC][o0]?\b/gi, // porco
    /\b[mM][a4][dD][rR][o0]?[nN][nN][a4]?\b/gi, // madonna

    // Parolacce comuni
    /\b[cC][a4][zZ][zZ][o0]?\b/gi, // cazzo
    /\b[sS][tR][rR][o0][nN][zZ][o0]?\b/gi, // stronzo
    /\b[vV][a4][fF][a4][nN][cC]([uU][lL][o0])?\b/gi, // vaffanculo

    // Altro
    /\b[dD][iI][o0]?\b/gi, // dio
    /\b[pP][uU][tT][tT]([a4][nN][a4])?\b/gi, // puttana
  ]

  private static containsFromRegex(text: string): boolean {
    return this.regexPatterns.some((pattern) => pattern.test(text))
  }
}
