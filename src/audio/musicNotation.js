/**
 * @file Notación musical en texto para escribir partituras de forma legible.
 *
 * Una secuencia es una lista de notas separadas por espacios con el formato
 * `NOTA:DURACIÓN`, por ejemplo `"A4:2 C5:2 r:4"`:
 *   - La nota usa notación anglosajona con octava: C4 = do central, F#5, Bb3…
 *   - `r` es un silencio.
 *   - `k`, `s` y `h` son golpes de batería: bombo (kick), caja (snare) y charles (hi-hat).
 *   - La duración se mide en semicorcheas (1 = semicorchea, 4 = negra, 16 = redonda).
 */

/** Posición de cada nota natural dentro de la octava, en semitonos desde Do. */
const SEMITONES_FROM_C = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });

/** Frecuencia de referencia: La4 = 440 Hz (nota MIDI 69). */
const A4_FREQUENCY = 440;
const A4_MIDI_NUMBER = 69;

/** Símbolos que representan golpes de batería en lugar de notas. */
export const DRUM_HITS = Object.freeze({ KICK: 'k', SNARE: 's', HI_HAT: 'h' });

const REST_SYMBOL = 'r';

/**
 * Convierte un nombre de nota como "C#5" o "Bb3" en su frecuencia en hercios.
 * @param {string} noteName
 * @returns {number} Frecuencia en Hz, o 0 si el nombre no es válido.
 */
export function noteNameToFrequency(noteName) {
  const match = /^([A-G])([#b]?)(\d)$/.exec(noteName);
  if (!match) return 0;
  const [, letter, accidental, octave] = match;
  const accidentalShift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const midiNumber = 12 * (Number(octave) + 1) + SEMITONES_FROM_C[letter] + accidentalShift;
  return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / 12);
}

/**
 * @typedef {Object} ParsedNote
 * @property {number} frequency Frecuencia en Hz (0 si es silencio o batería).
 * @property {string|null} drumHit Símbolo de batería ('k', 's', 'h') o null.
 * @property {number} durationInSteps Duración en semicorcheas.
 * @property {string} source Texto original, útil para mensajes de error.
 */

/**
 * Convierte una secuencia en texto en una lista de notas.
 * @param {string} sequenceText
 * @returns {ParsedNote[]}
 */
export function parseNoteSequence(sequenceText) {
  return sequenceText.trim().split(/\s+/).map(token => {
    const [symbol, durationText] = token.split(':');
    const durationInSteps = parseFloat(durationText || '1');
    const isDrum = Object.values(DRUM_HITS).includes(symbol);
    return {
      frequency: symbol === REST_SYMBOL || isDrum ? 0 : noteNameToFrequency(symbol),
      drumHit: isDrum ? symbol : null,
      durationInSteps,
      source: token
    };
  });
}

/**
 * Repite una secuencia de notas varias veces (útil para compases de batería).
 * @param {string} sequenceText
 * @param {number} times
 * @returns {string}
 */
export function repeatNotes(sequenceText, times) {
  return Array(times).fill(sequenceText).join(' ');
}

/**
 * Suma la duración total de una secuencia en semicorcheas.
 * @param {string} sequenceText
 * @returns {number}
 */
export function totalDurationInSteps(sequenceText) {
  return parseNoteSequence(sequenceText).reduce((total, note) => total + note.durationInSteps, 0);
}
