/**
 * @file Guardado del progreso en el navegador (localStorage).
 *
 * Solo se guardan dos datos: el nivel más alto desbloqueado y el récord de puntos.
 * El almacenamiento puede no estar disponible (modo incógnito, permisos…), así
 * que todas las operaciones toleran errores y el juego funciona igual sin él.
 */

const SAVE_KEY = 'superpaco_progress_v2';

/**
 * @typedef {Object} SavedProgress
 * @property {number} highestUnlockedLevel Índice (desde 0) del último nivel alcanzado.
 * @property {number} highScore Mejor puntuación conseguida.
 */

/** @type {SavedProgress} */
const EMPTY_PROGRESS = Object.freeze({ highestUnlockedLevel: 0, highScore: 0 });

/**
 * Lee el progreso guardado.
 * @returns {SavedProgress}
 */
export function loadProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY));
    return { ...EMPTY_PROGRESS, ...(stored || {}) };
  } catch (error) {
    return { ...EMPTY_PROGRESS };
  }
}

/**
 * Guarda el progreso completo.
 * @param {SavedProgress} progress
 */
export function saveProgress(progress) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch (error) {
    // Sin almacenamiento disponible: el progreso simplemente no se conserva.
  }
}

/**
 * Actualiza el progreso guardado quedándose siempre con los valores máximos.
 * @param {{unlockedLevel?: number, score?: number}} achievement Lo conseguido ahora.
 * @returns {SavedProgress} El progreso resultante.
 */
export function recordAchievement({ unlockedLevel = 0, score = 0 }) {
  const progress = loadProgress();
  progress.highestUnlockedLevel = Math.max(progress.highestUnlockedLevel, unlockedLevel);
  progress.highScore = Math.max(progress.highScore, score);
  saveProgress(progress);
  return progress;
}
