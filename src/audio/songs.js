/**
 * @file Partituras de la música del juego (todas composiciones originales).
 *
 * Cada canción tiene:
 *   - `tempoBpm`: pulsos por minuto (un pulso = negra = 4 semicorcheas).
 *   - `loops`: si vuelve a empezar al terminar (música de nivel) o no (jingles).
 *   - `tracks`: pistas que suenan a la vez, como los canales de una consola de 8 bits:
 *       · `pulse25` / `pulse12`: onda de pulso (melodía y armonía).
 *       · `triangle`: onda triangular (bajo).
 *       · `noise`: ruido blanco (batería).
 *
 * En una canción con bucle, todas las pistas deben durar lo mismo para no
 * desincronizarse; el test `tests/gameData.test.js` lo comprueba.
 * El formato de las notas se explica en `musicNotation.js`.
 */
import { repeatNotes } from './musicNotation.js';

/** Instrumentos disponibles (canales del sintetizador). */
export const INSTRUMENT = Object.freeze({
  PULSE_25: 'pulse25',
  PULSE_12: 'pulse12',
  TRIANGLE: 'triangle',
  NOISE: 'noise'
});

export const SONGS = Object.freeze({
  /** Pasodoble festivo: Madrid y Pamplona. */
  feria: {
    tempoBpm: 150,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.16, notes: `
        F#5:2 E5:1 F#5:1 A5:2 F#5:2 D5:4 A4:4    E5:2 D5:1 E5:1 G5:2 E5:2 C#5:4 A4:4
        D5:2 E5:2 F#5:2 G5:2 B5:4 A5:2 G5:2      F#5:2 E5:2 D5:2 C#5:2 E5:8
        F#5:2 E5:1 F#5:1 A5:2 F#5:2 D5:4 A4:4    D5:2 C#5:1 D5:1 F#5:2 D5:2 B4:4 F#4:4
        G4:2 B4:2 D5:2 G5:2 A4:2 C#5:2 E5:2 A5:2  D6:4 A5:2 F#5:2 D5:8` },
      { instrument: INSTRUMENT.PULSE_12, volume: 0.07, notes: `
        r:2 F#4:2 r:2 A4:2 r:2 F#4:2 r:2 A4:2    r:2 E4:2 r:2 C#5:2 r:2 E4:2 r:2 C#5:2
        r:2 D4:2 r:2 B4:2 r:2 D4:2 r:2 B4:2      r:2 E4:2 r:2 C#5:2 r:2 E4:2 r:2 C#5:2
        r:2 F#4:2 r:2 A4:2 r:2 F#4:2 r:2 A4:2    r:2 D4:2 r:2 F#4:2 r:2 D4:2 r:2 F#4:2
        r:2 D4:2 r:2 B4:2 r:2 E4:2 r:2 C#5:2     r:2 F#4:2 r:2 A4:2 r:8` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: `
        D3:4 A2:4 D3:4 A2:4  A2:4 E3:4 A2:4 E3:4  G2:4 D3:4 G2:4 D3:4  A2:4 E3:4 A2:4 C#3:4
        D3:4 A2:4 D3:4 A2:4  B2:4 F#3:4 B2:4 F#3:4  G2:4 D3:4 A2:4 E3:4  D3:4 A2:4 D3:8` },
      { instrument: INSTRUMENT.NOISE, volume: 0.12, notes: repeatNotes('k:2 h:2 s:2 h:2', 16) }
    ]
  },

  /** Cadencia andaluza (La menor – Sol – Fa – Mi): Sevilla, Valencia y la portada. */
  flamenco: {
    tempoBpm: 138,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.16, notes: `
        A4:2 C5:2 E5:3 D5:1 C5:2 B4:2 C5:2 A4:2   B4:2 D5:2 G5:3 F5:1 E5:2 D5:2 C5:2 B4:2
        A4:2 C5:2 F5:3 E5:1 D5:2 C5:2 D5:2 C5:2   B4:3 C5:1 B4:2 A4:2 G#4:4 E4:4
        E5:2 E5:1 F5:1 E5:2 D5:2 C5:2 D5:2 E5:4   D5:2 D5:1 E5:1 D5:2 C5:2 B4:2 C5:2 D5:4
        C5:2 C5:1 D5:1 C5:2 B4:2 A4:2 B4:2 C5:4   B4:2 A4:2 G#4:2 A4:2 B4:8` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: repeatNotes(`
        A2:2 A3:2 E3:2 A3:2 A2:2 A3:2 E3:2 C3:2   G2:2 G3:2 D3:2 G3:2 G2:2 G3:2 D3:2 B2:2
        F2:2 F3:2 C3:2 F3:2 F2:2 F3:2 C3:2 A2:2   E2:2 E3:2 B2:2 E3:2 E2:2 G#2:2 B2:2 E3:2`, 2) },
      { instrument: INSTRUMENT.NOISE, volume: 0.11, notes: repeatNotes('k:3 h:3 s:2 k:3 h:3 s:2', 8) }
    ]
  },

  /** Verano y ritmo "dembow": Benidorm y Canarias. */
  playa: {
    tempoBpm: 108,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.15, notes: `
        C5:2 F5:2 A5:2 G5:1 F5:1 G5:4 C5:4    D5:2 F5:2 A5:2 G5:1 F5:1 E5:4 D5:4
        D5:2 F5:2 Bb5:2 A5:1 G5:1 A5:4 F5:4   E5:2 G5:2 C6:2 Bb5:1 A5:1 G5:8
        C5:2 F5:2 A5:2 G5:1 F5:1 G5:4 C5:4    D5:2 F5:2 A5:2 G5:1 F5:1 E5:4 D5:4
        D5:2 F5:2 Bb5:2 A5:1 G5:1 A5:4 F5:4   E5:2 G5:2 C6:2 Bb5:1 A5:1 G5:2 E5:2 F5:4` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.32, notes: repeatNotes(`
        F2:3 F2:3 F2:2 C3:3 C3:3 A2:2      D2:3 D2:3 D2:2 A2:3 A2:3 F2:2
        Bb1:3 Bb1:3 Bb1:2 F2:3 F2:3 D2:2   C2:3 C2:3 C2:2 G2:3 G2:3 E2:2`, 2) },
      { instrument: INSTRUMENT.NOISE, volume: 0.12, notes: repeatNotes('k:3 s:1 k:2 s:2 k:3 s:1 k:2 s:2', 8) }
    ]
  },

  /** Metro en hora punta: misterioso y con el bajo marcando el paso. */
  metro: {
    tempoBpm: 128,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.14, notes: `
        D5:1 r:1 F5:1 r:1 A5:2 G5:2 F5:1 r:1 E5:1 r:1 D5:4   A4:1 r:1 D5:1 r:1 F5:2 E5:2 D5:2 C#5:2 D5:4
        D5:1 r:1 F5:1 r:1 Bb5:2 A5:2 G5:2 F5:2 G5:4          E5:2 F5:2 E5:2 D5:2 C#5:4 A4:4
        D4:1 r:1 F4:1 r:1 A4:2 G4:2 F4:1 r:1 E4:1 r:1 D4:4   A4:2 r:2 D5:2 r:2 F5:2 r:2 E5:4
        Bb4:2 r:2 D5:2 r:2 G5:2 r:2 F5:4                     E5:4 C#5:4 A4:8` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.34, notes: repeatNotes(`
        D2:2 D3:2 A2:2 D3:2 D2:2 D3:2 C3:2 A2:2   D2:2 D3:2 A2:2 D3:2 D2:2 D3:2 C3:2 A2:2
        Bb1:2 Bb2:2 F2:2 Bb2:2 Bb1:2 Bb2:2 A2:2 F2:2   A1:2 A2:2 E2:2 A2:2 A1:2 A2:2 C#3:2 E3:2`, 2) },
      { instrument: INSTRUMENT.NOISE, volume: 0.09, notes: repeatNotes('h:2 h:2 s:2 h:2', 16) }
    ]
  },

  /** Muiñeira en 6/8 con bordón de gaita: Galicia. Cada compás dura 6 unidades. */
  muineira: {
    tempoBpm: 86,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.15, notes: `
        B4:1 D5:1 G5:1 G5:2 A5:1   B5:1 A5:1 G5:1 D5:2 B4:1   C5:1 E5:1 G5:1 E5:2 C5:1   D5:1 F#5:1 A5:1 D5:3
        B4:1 D5:1 G5:1 G5:2 A5:1   B5:1 C6:1 B5:1 A5:1 G5:1 E5:1   D5:1 E5:1 F#5:1 A5:1 G5:1 F#5:1   G5:3 G4:3
        D6:1 B5:1 G5:1 D6:1 B5:1 G5:1   C6:1 A5:1 F#5:1 C6:1 A5:1 F#5:1   B5:1 G5:1 E5:1 B5:1 G5:1 E5:1   A5:1 F#5:1 D5:1 A5:2 G5:1
        B5:1 A5:1 G5:1 C6:1 B5:1 A5:1   G5:1 F#5:1 E5:1 D5:2 E5:1   F#5:1 A5:1 G5:1 F#5:1 E5:1 D5:1   G5:3 r:3` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: `
        G2:6 G2:6 C3:6 D3:6 G2:6 G2:6 D3:6 G2:6   G2:6 D3:6 E3:6 D3:6 C3:6 G2:6 D3:6 G2:6` },
      { instrument: INSTRUMENT.NOISE, volume: 0.09, notes: repeatNotes('k:1 h:1 h:1 s:1 h:1 h:1', 16) }
    ]
  },

  /** Noche tranquila en La Mancha. */
  night: {
    tempoBpm: 112,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.14, notes: `
        B4:4 E5:4 G5:4 F#5:2 E5:2   C5:4 E5:4 G5:6 E5:2   D5:4 F#5:4 A5:4 G5:2 F#5:2   D#5:4 F#5:4 B4:8
        G5:4 F#5:2 E5:2 B4:4 E5:4   A4:4 C5:2 E5:2 A5:4 G5:4   F#5:4 D#5:4 B4:4 A4:4   G4:4 B4:4 E5:8` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: `
        E2:2 B2:2 E3:2 G3:2 B3:2 G3:2 E3:2 B2:2   C2:2 G2:2 C3:2 E3:2 G3:2 E3:2 C3:2 G2:2
        D2:2 A2:2 D3:2 F#3:2 A3:2 F#3:2 D3:2 A2:2   B1:2 F#2:2 B2:2 D#3:2 F#3:2 D#3:2 B2:2 A2:2
        E2:2 B2:2 E3:2 G3:2 B3:2 G3:2 E3:2 B2:2   A1:2 E2:2 A2:2 C3:2 E3:2 C3:2 A2:2 E2:2
        B1:2 F#2:2 B2:2 D#3:2 F#3:2 D#3:2 B2:2 A2:2   E2:2 B2:2 E3:2 G3:2 B3:2 G3:2 E3:2 B2:2` },
      { instrument: INSTRUMENT.NOISE, volume: 0.07, notes: repeatNotes('r:4 h:4 r:4 h:4', 8) }
    ]
  },

  /** Castillo de Hacienda: inquietante, con cromatismos. */
  castle: {
    tempoBpm: 120,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.14, notes: `
        C5:2 Eb5:2 F#5:2 G5:2 F#5:2 Eb5:2 C5:4    Db5:2 F5:2 Ab5:2 G5:2 F5:2 Db5:2 C5:4
        C5:2 Eb5:2 F#5:2 G5:2 Bb5:2 A5:2 Ab5:2 G5:2   F#5:4 Eb5:4 C5:8
        C6:2 B5:2 C6:2 G5:2 Ab5:2 G5:2 F#5:4      G5:2 F5:2 Eb5:2 D5:2 Eb5:2 D5:2 C5:4
        B4:2 C5:2 D5:2 Eb5:2 F5:2 F#5:2 G5:4      G5:4 G4:4 C5:8` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.34, notes: repeatNotes(`
        C2:2 C3:2 C2:2 C3:2 F#2:2 F#3:2 G2:2 G3:2   Db2:2 Db3:2 Db2:2 Db3:2 G2:2 G3:2 C2:2 C3:2
        C2:2 C3:2 C2:2 C3:2 F#2:2 F#3:2 G2:2 G3:2   F#2:2 F#3:2 G2:2 G3:2 C2:2 C3:2 C2:2 C3:2`, 2) },
      { instrument: INSTRUMENT.NOISE, volume: 0.1, notes: repeatNotes('k:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2', 8) }
    ]
  },

  /** Combate contra Don Hacienda. */
  boss: {
    tempoBpm: 160,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.15, notes: `
        A4:1 A4:1 r:2 C5:1 r:1 A4:1 r:1 D#5:2 E5:2 r:2 C5:2   A4:1 A4:1 r:2 C5:1 r:1 A4:1 r:1 G5:2 F#5:2 F5:2 E5:2
        A4:1 A4:1 r:2 C5:1 r:1 A4:1 r:1 D#5:2 E5:2 r:2 C5:2   A5:2 G5:2 F5:2 E5:2 D#5:2 E5:2 r:4` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.34, notes: repeatNotes('A1:1 A2:1 A1:1 A2:1 A1:1 A2:1 A1:1 A2:1 F1:1 F2:1 F1:1 F2:1 E1:1 E2:1 E1:1 E2:1', 4) },
      { instrument: INSTRUMENT.NOISE, volume: 0.12, notes: repeatNotes('k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2', 4) }
    ]
  },

  /** Subidón de azúcar de los churros (invencibilidad). */
  sugarRush: {
    tempoBpm: 170,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.14, notes: `
        C5:1 E5:1 G5:1 C6:1 E6:2 C6:2 G5:1 C6:1 E6:1 G6:1 E6:4
        D5:1 F5:1 A5:1 D6:1 F6:2 D6:2 A5:1 D6:1 F6:1 A6:1 G6:4` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: `
        C3:2 C4:2 C3:2 C4:2 C3:2 C4:2 C3:2 C4:2   D3:2 D4:2 D3:2 D4:2 G2:2 G3:2 G2:2 G3:2` },
      { instrument: INSTRUMENT.NOISE, volume: 0.11, notes: repeatNotes('k:2 h:2 s:2 h:2', 4) }
    ]
  },

  /* ---------- Jingles (sin bucle) ---------- */

  /** Nivel superado. */
  levelClear: {
    tempoBpm: 150,
    loops: false,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.17, notes: 'E5:2 G#5:2 B5:2 E6:6 D6:2 E6:8' },
      { instrument: INSTRUMENT.PULSE_12, volume: 0.08, notes: 'B4:2 E5:2 G#5:2 B5:6 A5:2 G#5:8' },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.32, notes: 'E3:6 B2:6 E3:10' }
    ]
  },

  /** Paco pierde una vida ("trombón triste"). */
  lifeLost: {
    tempoBpm: 110,
    loops: false,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.17, notes: 'G4:4 F#4:4 F4:4 E4:10' },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: 'C3:4 B2:4 Bb2:4 A2:10' }
    ]
  },

  /** Fin de la partida. */
  gameOver: {
    tempoBpm: 96,
    loops: false,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.16, notes: 'E5:3 B4:3 G4:3 E4:3 F#4:4 E4:8' },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: 'E3:12 B2:4 E2:8' }
    ]
  },

  /** Flor Maravilla: tonada saltarina y psicodélica. */
  maravilla: {
    tempoBpm: 168,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.16, notes: `
        E5:2 G5:2 C6:2 G5:2 E5:2 G5:2 A5:2 G5:2   D5:2 F5:2 A5:2 F5:2 D5:2 F5:2 G5:2 F5:2
        C5:2 E5:2 G5:2 E5:2 C6:4 B5:2 G5:2        A5:2 G5:2 E5:2 D5:2 C5:8` },
      { instrument: INSTRUMENT.PULSE_12, volume: 0.07, notes: `
        r:2 E4:2 r:2 G4:2 r:2 E4:2 r:2 G4:2       r:2 F4:2 r:2 A4:2 r:2 F4:2 r:2 A4:2
        r:2 E4:2 r:2 G4:2 r:2 E4:2 r:2 G4:2       r:2 F4:2 r:2 G4:2 r:2 E4:2 r:2 C4:2` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: `
        C3:4 G3:4 C3:4 G3:4  F3:4 C4:4 F3:4 C4:4  C3:4 G3:4 C3:4 G3:4  F3:4 G3:4 C3:8` },
      { instrument: INSTRUMENT.NOISE, volume: 0.1, notes: repeatNotes('k:2 h:2 s:2 h:2', 8) }
    ]
  },

  /** Maravilla en tono menor: apagón y estampida. */
  maravillaSombra: {
    tempoBpm: 184,
    loops: true,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.16, notes: `
        A4:2 C5:2 E5:2 C5:2 A4:2 C5:2 B4:2 A4:2   G4:2 B4:2 D5:2 B4:2 G4:2 B4:2 A4:2 G4:2
        F4:2 A4:2 C5:2 A4:2 E5:4 D5:2 C5:2        B4:2 A4:2 G#4:2 B4:2 A4:8` },
      { instrument: INSTRUMENT.PULSE_12, volume: 0.07, notes: `
        r:2 E4:2 r:2 A4:2 r:2 E4:2 r:2 A4:2       r:2 D4:2 r:2 G4:2 r:2 D4:2 r:2 G4:2
        r:2 C4:2 r:2 F4:2 r:2 C4:2 r:2 F4:2       r:2 E4:2 r:2 G#4:2 r:2 E4:2 r:2 A4:2` },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: `
        A2:4 E3:4 A2:4 E3:4  G2:4 D3:4 G2:4 D3:4  F2:4 C3:4 F2:4 C3:4  E2:4 E3:4 A2:8` },
      { instrument: INSTRUMENT.NOISE, volume: 0.12, notes: repeatNotes('k:2 h:2 s:2 k:2', 8) }
    ]
  },

  /** Victoria contra el jefe y final bueno. */
  fanfare: {
    tempoBpm: 140,
    loops: false,
    tracks: [
      { instrument: INSTRUMENT.PULSE_25, volume: 0.17, notes: 'G4:2 C5:2 E5:2 G5:4 E5:2 G5:4 C6:8' },
      { instrument: INSTRUMENT.PULSE_12, volume: 0.08, notes: 'E4:2 G4:2 C5:2 E5:4 C5:2 E5:4 G5:8' },
      { instrument: INSTRUMENT.TRIANGLE, volume: 0.3, notes: 'C3:6 G2:4 C3:4 C3:10' }
    ]
  }
});
