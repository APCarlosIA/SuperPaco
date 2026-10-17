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
 * @property {number[]} seeds Niveles cuya Semilla Maravilla se ha conseguido alguna vez.
 * @property {string[]} bigCoins Monedas gigantes conseguidas alguna vez ("nivel:número").
 * @property {boolean} chefMode Se ha descubierto el truco del cocinero.
 */

/** @type {SavedProgress} */
const EMPTY_PROGRESS = Object.freeze({ highestUnlockedLevel: 0, highScore: 0, seeds: [], bigCoins: [], chefMode: false });

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
 * @param {{unlockedLevel?: number, score?: number, seeds?: Iterable<number>, bigCoins?: Iterable<string>, chefMode?: boolean}} achievement Lo conseguido ahora.
 * @returns {SavedProgress} El progreso resultante.
 */
export function recordAchievement({ unlockedLevel = 0, score = 0, seeds = [], bigCoins = [], chefMode = false }) {
  const progress = loadProgress();
  progress.highestUnlockedLevel = Math.max(progress.highestUnlockedLevel, unlockedLevel);
  progress.highScore = Math.max(progress.highScore, score);
  progress.seeds = [...new Set([...(progress.seeds || []), ...seeds])];
  progress.bigCoins = [...new Set([...(progress.bigCoins || []), ...bigCoins])];
  progress.chefMode = Boolean(progress.chefMode || chefMode);
  saveProgress(progress);
  return progress;
}
