/**
 * @file Sintetizador de sonido estilo 8 bits con la Web Audio API.
 *
 * No se usa ningún archivo de audio: cada nota se genera en tiempo real con
 * osciladores, igual que hacían los chips de sonido de las consolas antiguas:
 *   - Ondas de pulso (25 % y 12,5 %) para melodías y efectos.
 *   - Onda triangular para los bajos.
 *   - Ruido blanco filtrado para la batería y las explosiones.
 *
 * La música se programa con antelación ("lookahead scheduling"): cada 25 ms se
 * encolan en el reloj de audio las notas de los próximos 150 ms. Así el ritmo es
 * preciso aunque el hilo principal vaya ocupado dibujando.
 */
import { noteNameToFrequency, parseNoteSequence, DRUM_HITS } from './musicNotation.js';
import { SONGS, INSTRUMENT } from './songs.js';

const MASTER_VOLUME = 0.5;
const MUSIC_VOLUME = 0.45;
const EFFECTS_VOLUME = 0.8;
const SCHEDULER_INTERVAL_MILLISECONDS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.15;
/** Volumen prácticamente nulo: las rampas exponenciales no pueden llegar a 0 exacto. */
const SILENT_GAIN = 0.0001;

/** Nombres de todos los efectos de sonido disponibles. */
export const SOUND_EFFECT = Object.freeze({
  JUMP_SMALL: 'jumpSmall',
  JUMP_BIG: 'jumpBig',
  COIN: 'coin',
  STOMP: 'stomp',
  KICK: 'kick',
  BUMP: 'bump',
  BRICK_BREAK: 'brickBreak',
  ITEM_APPEARS: 'itemAppears',
  POWER_UP: 'powerUp',
  HURT: 'hurt',
  FIREBALL: 'fireball',
  EXTRA_LIFE: 'extraLife',
  POLE_SLIDE: 'poleSlide',
  EXPLOSION: 'explosion',
  THROW: 'throw',
  BOSS_HIT: 'bossHit',
  BULL_SNORT: 'bullSnort',
  MENU_MOVE: 'menuMove',
  MENU_CONFIRM: 'menuConfirm',
  PAUSE: 'pause',
  TIME_TICK: 'timeTick',
  LAVA_HISS: 'lavaHiss',
  CHECKPOINT: 'checkpoint'
});

/**
 * Recetas de cada efecto de sonido. Cada una recibe el motor y el instante
 * actual del reloj de audio, y programa los tonos o ruidos necesarios.
 * @type {Object<string, (engine: SoundEngine, now: number) => void>}
 */
const SOUND_EFFECT_RECIPES = {
  [SOUND_EFFECT.JUMP_SMALL]: (engine, now) => engine.playTone({ frequency: 330, slideToFrequency: 760, startTime: now, duration: 0.16, instrument: INSTRUMENT.PULSE_25, volume: 0.16 }),
  [SOUND_EFFECT.JUMP_BIG]: (engine, now) => engine.playTone({ frequency: 240, slideToFrequency: 600, startTime: now, duration: 0.18, instrument: INSTRUMENT.PULSE_25, volume: 0.16 }),
  [SOUND_EFFECT.COIN]: (engine, now) => {
    engine.playTone({ frequency: noteNameToFrequency('C7'), startTime: now, duration: 0.05, instrument: INSTRUMENT.PULSE_25, volume: 0.13 });
    engine.playTone({ frequency: noteNameToFrequency('E7'), startTime: now + 0.05, duration: 0.28, instrument: INSTRUMENT.PULSE_25, volume: 0.13 });
  },
  [SOUND_EFFECT.STOMP]: (engine, now) => {
    engine.playTone({ frequency: 520, slideToFrequency: 140, startTime: now, duration: 0.1, instrument: 'pulse50', volume: 0.18 });
    engine.playNoise('snare', now, 0.12);
  },
  [SOUND_EFFECT.KICK]: (engine, now) => {
    engine.playTone({ frequency: 700, startTime: now, duration: 0.04, instrument: 'pulse50', volume: 0.16 });
    engine.playTone({ frequency: 1000, startTime: now + 0.04, duration: 0.06, instrument: 'pulse50', volume: 0.14 });
  },
  [SOUND_EFFECT.BUMP]: (engine, now) => engine.playTone({ frequency: 140, slideToFrequency: 60, startTime: now, duration: 0.1, instrument: INSTRUMENT.TRIANGLE, volume: 0.35 }),
  [SOUND_EFFECT.BRICK_BREAK]: (engine, now) => {
    engine.playNoise('crash', now, 0.3, 0.3);
    engine.playTone({ frequency: 220, slideToFrequency: 70, startTime: now, duration: 0.15, instrument: 'pulse50', volume: 0.12 });
  },
  [SOUND_EFFECT.ITEM_APPEARS]: engine => engine.playMelodyNow(['C5', 'G5', 'C6', 'E6', 'G6'], 0.045, INSTRUMENT.PULSE_25, 0.12),
  [SOUND_EFFECT.POWER_UP]: engine => engine.playMelodyNow(['C5', 'E5', 'G5', 'C6', 'D5', 'F#5', 'A5', 'D6', 'E5', 'G#5', 'B5', 'E6'], 0.035, INSTRUMENT.PULSE_12, 0.13),
  [SOUND_EFFECT.HURT]: engine => engine.playMelodyNow(['A5', 'E5', 'A4', 'E4', 'A3'], 0.06, INSTRUMENT.PULSE_25, 0.15),
  [SOUND_EFFECT.FIREBALL]: (engine, now) => engine.playTone({ frequency: 900, slideToFrequency: 250, startTime: now, duration: 0.08, instrument: INSTRUMENT.PULSE_12, volume: 0.12 }),
  [SOUND_EFFECT.EXTRA_LIFE]: engine => engine.playMelodyNow(['C6', 'E6', 'G6', 'C7', 'G6', 'C7'], 0.07, INSTRUMENT.PULSE_25, 0.14),
  [SOUND_EFFECT.POLE_SLIDE]: (engine, now) => engine.playTone({ frequency: 1300, slideToFrequency: 260, startTime: now, duration: 0.9, instrument: INSTRUMENT.PULSE_25, volume: 0.12 }),
  [SOUND_EFFECT.EXPLOSION]: (engine, now) => {
    engine.playNoise('boom', now, 0.55, 0.5);
    engine.playTone({ frequency: 90, slideToFrequency: 35, startTime: now, duration: 0.3, instrument: INSTRUMENT.TRIANGLE, volume: 0.4 });
  },
  [SOUND_EFFECT.THROW]: (engine, now) => engine.playNoise('swish', now, 0.25, 0.12),
  [SOUND_EFFECT.BOSS_HIT]: (engine, now) => {
    engine.playTone({ frequency: 260, slideToFrequency: 80, startTime: now, duration: 0.18, instrument: 'pulse50', volume: 0.2 });
    engine.playNoise('crash', now, 0.25, 0.2);
  },
  [SOUND_EFFECT.BULL_SNORT]: (engine, now) => {
    engine.playTone({ frequency: 90, slideToFrequency: 60, startTime: now, duration: 0.35, instrument: 'pulse50', volume: 0.14 });
    engine.playNoise('boom', now, 0.15, 0.3);
  },
  [SOUND_EFFECT.MENU_MOVE]: (engine, now) => engine.playTone({ frequency: noteNameToFrequency('A5'), startTime: now, duration: 0.05, instrument: INSTRUMENT.PULSE_25, volume: 0.12 }),
  [SOUND_EFFECT.MENU_CONFIRM]: engine => engine.playMelodyNow(['E5', 'A5'], 0.06, INSTRUMENT.PULSE_25, 0.14),
  [SOUND_EFFECT.PAUSE]: engine => engine.playMelodyNow(['E6', 'C6', 'E6', 'C6'], 0.07, INSTRUMENT.PULSE_25, 0.12),
  [SOUND_EFFECT.TIME_TICK]: (engine, now) => engine.playTone({ frequency: noteNameToFrequency('A6'), startTime: now, duration: 0.025, instrument: INSTRUMENT.PULSE_12, volume: 0.07 }),
  [SOUND_EFFECT.LAVA_HISS]: (engine, now) => engine.playNoise('hiHat', now, 0.08),
  [SOUND_EFFECT.CHECKPOINT]: engine => engine.playMelodyNow(['G5', 'B5', 'D6', 'G6'], 0.06, INSTRUMENT.PULSE_25, 0.14)
};

/**
 * Filtros para dar color al ruido blanco según el tipo de golpe.
 * `type` es el tipo de filtro de la Web Audio API y `duration` su duración por defecto.
 */
const NOISE_FLAVORS = Object.freeze({
  kick: { type: 'lowpass', frequency: 300, duration: 0.12 },
  snare: { type: 'bandpass', frequency: 1800, duration: 0.12 },
  hiHat: { type: 'highpass', frequency: 7000, duration: 0.04 },
  boom: { type: 'lowpass', frequency: 900, duration: 0.5 },
  crash: { type: 'lowpass', frequency: 3000, duration: 0.25 },
  swish: { type: 'bandpass', frequency: 3500, duration: 0.12 }
});

/** Traducción de los símbolos de batería de las partituras a sabores de ruido. */
const DRUM_HIT_TO_NOISE = Object.freeze({
  [DRUM_HITS.KICK]: 'kick',
  [DRUM_HITS.SNARE]: 'snare',
  [DRUM_HITS.HI_HAT]: 'hiHat'
});

class SoundEngine {
  constructor() {
    /** @type {AudioContext|null} Se crea tras la primera interacción del jugador. */
    this.audioContext = null;
    this.isMuted = false;
    /** Nombre de la canción que suena ahora mismo (o null). */
    this.currentSongName = null;
    /** Estado de reproducción de cada pista de la canción actual. */
    this.trackPlayers = [];
    this.currentSong = null;
    /** Multiplicador de tempo (1 = normal; se acelera cuando queda poco tiempo). */
    this.tempoMultiplier = 1;
    /** Canción pedida antes de poder sonar; se reproducirá al desbloquear el audio. */
    this.songWaitingForUnlock = null;
  }

  /**
   * Crea el contexto de audio. Los navegadores solo lo permiten después de que el
   * jugador interactúe con la página (tecla, clic o toque), por eso se llama desde
   * el gestor de entrada. Llamarlo varias veces es seguro.
   */
  unlock() {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') this.audioContext.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      this.audioContext = new AudioContextClass();
    } catch (error) {
      return;
    }
    this.createMixer();
    this.whiteNoiseBuffer = this.createWhiteNoiseBuffer();
    this.pulseWaves = {
      [INSTRUMENT.PULSE_25]: this.createPulseWave(0.25),
      [INSTRUMENT.PULSE_12]: this.createPulseWave(0.125),
      pulse50: this.createPulseWave(0.5)
    };
    this.parsedSongs = this.parseAllSongs();
    setInterval(() => this.scheduleUpcomingNotes(), SCHEDULER_INTERVAL_MILLISECONDS);
    if (this.songWaitingForUnlock) {
      const songName = this.songWaitingForUnlock;
      this.songWaitingForUnlock = null;
      this.playMusic(songName);
    }
  }

  /** @private Crea los canales de volumen: general, música y efectos. */
  createMixer() {
    const context = this.audioContext;
    this.masterGain = context.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : MASTER_VOLUME;
    this.masterGain.connect(context.destination);
    this.musicGain = context.createGain();
    this.musicGain.gain.value = MUSIC_VOLUME;
    this.musicGain.connect(this.masterGain);
    this.effectsGain = context.createGain();
    this.effectsGain.gain.value = EFFECTS_VOLUME;
    this.effectsGain.connect(this.masterGain);
  }

  /** @private Genera un segundo de ruido blanco reutilizable para toda la batería. */
  createWhiteNoiseBuffer() {
    const context = this.audioContext;
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    return buffer;
  }

  /**
   * @private
   * Construye una onda de pulso con el ciclo de trabajo indicado a partir de su
   * serie de Fourier. El 25 % y el 12,5 % dan el timbre típico de las consolas NES.
   * @param {number} dutyCycle Fracción del periodo en la que la onda está "arriba" (0–1).
   * @returns {PeriodicWave}
   */
  createPulseWave(dutyCycle) {
    const harmonicCount = 40;
    const cosineTerms = new Float32Array(harmonicCount);
    const sineTerms = new Float32Array(harmonicCount);
    for (let harmonic = 1; harmonic < harmonicCount; harmonic++) {
      cosineTerms[harmonic] = Math.sin(2 * Math.PI * harmonic * dutyCycle) / (Math.PI * harmonic);
      sineTerms[harmonic] = (1 - Math.cos(2 * Math.PI * harmonic * dutyCycle)) / (Math.PI * harmonic);
    }
    return this.audioContext.createPeriodicWave(cosineTerms, sineTerms);
  }

  /** @private Convierte las partituras en texto a listas de notas una sola vez. */
  parseAllSongs() {
    const parsed = {};
    for (const [songName, song] of Object.entries(SONGS)) {
      parsed[songName] = {
        tempoBpm: song.tempoBpm,
        loops: song.loops,
        tracks: song.tracks.map(track => ({ ...track, parsedNotes: parseNoteSequence(track.notes) }))
      };
    }
    return parsed;
  }

  /**
   * Programa un tono con envolvente de volumen (ataque rápido y caída suave).
   * @param {Object} tone
   * @param {number} tone.frequency Frecuencia inicial en Hz.
   * @param {number} tone.startTime Instante del reloj de audio en que empieza.
   * @param {number} tone.duration Duración en segundos.
   * @param {string} tone.instrument 'pulse25', 'pulse12', 'pulse50' o un tipo nativo ('triangle', 'sine').
   * @param {number} tone.volume Volumen máximo (0–1).
   * @param {AudioNode} [tone.output] Canal de salida (por defecto, efectos).
   * @param {number} [tone.slideToFrequency] Si se indica, la frecuencia se desliza hasta ella.
   */
  playTone({ frequency, startTime, duration, instrument, volume, output, slideToFrequency }) {
    const context = this.audioContext;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    if (this.pulseWaves[instrument]) oscillator.setPeriodicWave(this.pulseWaves[instrument]);
    else oscillator.type = instrument;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    if (slideToFrequency) oscillator.frequency.exponentialRampToValueAtTime(slideToFrequency, startTime + duration);

    const attackTime = Math.min(0.006, duration * 0.2);
    envelope.gain.setValueAtTime(SILENT_GAIN, startTime);
    envelope.gain.linearRampToValueAtTime(volume, startTime + attackTime);
    envelope.gain.linearRampToValueAtTime(volume * 0.7, startTime + Math.max(attackTime + 0.001, duration * 0.6));
    envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, startTime + duration);

    oscillator.connect(envelope);
    envelope.connect(output || this.effectsGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  }

  /**
   * Programa un golpe de ruido filtrado (batería, explosiones, silbidos).
   * @param {string} flavor Clave de {@link NOISE_FLAVORS}.
   * @param {number} startTime Instante del reloj de audio.
   * @param {number} volume Volumen inicial (0–1).
   * @param {number} [duration] Duración en segundos (por defecto, la del sabor).
   * @param {AudioNode} [output] Canal de salida (por defecto, efectos).
   */
  playNoise(flavor, startTime, volume, duration, output) {
    const context = this.audioContext;
    const settings = NOISE_FLAVORS[flavor];
    const noiseLength = duration || settings.duration;
    const source = context.createBufferSource();
    source.buffer = this.whiteNoiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = settings.type;
    filter.frequency.value = settings.frequency;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(volume, startTime);
    envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, startTime + noiseLength);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(output || this.effectsGain);
    // Empezar en un punto aleatorio del buffer evita que todos los golpes suenen idénticos.
    source.start(startTime, Math.random() * 0.5);
    source.stop(startTime + noiseLength + 0.02);
    // El bombo lleva además un tono grave que cae rápido, como un tambor real.
    if (flavor === 'kick') this.playTone({ frequency: 140, slideToFrequency: 45, startTime, duration: 0.1, instrument: 'sine', volume: volume * 1.6, output });
  }

  /**
   * Toca una sucesión rápida de notas empezando ya (arpegios de efectos).
   * @param {string[]} noteNames Notas como 'C5', 'G#4'…
   * @param {number} secondsPerNote
   * @param {string} instrument
   * @param {number} volume
   */
  playMelodyNow(noteNames, secondsPerNote, instrument, volume) {
    let startTime = this.audioContext.currentTime;
    for (const noteName of noteNames) {
      const frequency = noteNameToFrequency(noteName);
      if (frequency) this.playTone({ frequency, startTime, duration: secondsPerNote * 1.1, instrument, volume });
      startTime += secondsPerNote;
    }
  }

  /**
   * Reproduce un efecto de sonido. Si el audio aún no está desbloqueado o está
   * silenciado, no hace nada.
   * @param {string} effectName Uno de los valores de {@link SOUND_EFFECT}.
   */
  playSoundEffect(effectName) {
    if (!this.audioContext || this.isMuted) return;
    const recipe = SOUND_EFFECT_RECIPES[effectName];
    if (recipe) recipe(this, this.audioContext.currentTime);
  }

  /**
   * Empieza a sonar una canción. Si ya está sonando, no la reinicia salvo que se pida.
   * @param {string} songName Clave de {@link SONGS}.
   * @param {{restart?: boolean}} [options]
   */
  playMusic(songName, { restart = false } = {}) {
    if (!this.audioContext) {
      this.songWaitingForUnlock = songName;
      return;
    }
    if (this.currentSongName === songName && this.currentSong && !restart) return;
    const song = this.parsedSongs[songName];
    if (!song) return;
    this.currentSongName = songName;
    this.currentSong = song;
    this.tempoMultiplier = 1;
    const firstNoteTime = this.audioContext.currentTime + 0.06;
    this.trackPlayers = song.tracks.map(track => ({ track, nextNoteIndex: 0, nextNoteTime: firstNoteTime, hasFinished: false }));
  }

  /** Detiene la música (las notas ya programadas terminan de sonar). */
  stopMusic() {
    this.currentSong = null;
    this.currentSongName = null;
    this.songWaitingForUnlock = null;
  }

  /**
   * Cambia la velocidad de la música actual.
   * @param {number} multiplier 1 = normal, 1.25 = un 25 % más rápida.
   */
  setTempoMultiplier(multiplier) {
    this.tempoMultiplier = multiplier;
  }

  /** Activa o desactiva todo el sonido. */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) this.masterGain.gain.value = this.isMuted ? 0 : MASTER_VOLUME;
  }

  /**
   * @private
   * Programa las notas de todas las pistas que deban sonar en los próximos
   * {@link SCHEDULE_AHEAD_SECONDS}. Se ejecuta periódicamente con setInterval.
   */
  scheduleUpcomingNotes() {
    if (!this.currentSong || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const scheduleUntil = now + SCHEDULE_AHEAD_SECONDS;
    const secondsPerStep = 60 / (this.currentSong.tempoBpm * this.tempoMultiplier) / 4;
    let anyTrackPlaying = false;

    for (const player of this.trackPlayers) {
      if (player.hasFinished) continue;
      anyTrackPlaying = true;
      // Si la pestaña estuvo en segundo plano, saltamos al presente en vez de
      // soltar de golpe todas las notas atrasadas.
      if (player.nextNoteTime < now - 0.1) player.nextNoteTime = now + 0.02;

      while (player.nextNoteTime < scheduleUntil) {
        const note = player.track.parsedNotes[player.nextNoteIndex];
        const noteSeconds = note.durationInSteps * secondsPerStep;
        this.scheduleMusicNote(player.track, note, player.nextNoteTime, noteSeconds);
        player.nextNoteTime += noteSeconds;
        player.nextNoteIndex++;
        if (player.nextNoteIndex >= player.track.parsedNotes.length) {
          if (this.currentSong.loops) player.nextNoteIndex = 0;
          else { player.hasFinished = true; break; }
        }
      }
    }
    if (!anyTrackPlaying) this.stopMusic();
  }

  /** @private Programa una nota concreta de una pista de música. */
  scheduleMusicNote(track, note, startTime, noteSeconds) {
    if (note.drumHit) {
      this.playNoise(DRUM_HIT_TO_NOISE[note.drumHit], startTime, track.volume, undefined, this.musicGain);
    } else if (note.frequency) {
      // Se acorta un 8 % para que las notas repetidas se oigan separadas.
      this.playTone({ frequency: note.frequency, startTime, duration: noteSeconds * 0.92, instrument: track.instrument, volume: track.volume, output: this.musicGain });
    }
  }
}

/** Instancia única del motor de sonido compartida por todo el juego. */
export const soundEngine = new SoundEngine();
