/**
 * @file Utilidades matemáticas: números aleatorios, límites y colisiones entre rectángulos.
 */

/**
 * Crea un generador de números pseudoaleatorios reproducible (algoritmo Mulberry32).
 * Con la misma semilla devuelve siempre la misma secuencia, por eso lo usamos para
 * dibujar los fondos y decorados: salen idénticos cada vez que se carga un nivel.
 *
 * @param {number} seed Semilla entera.
 * @returns {() => number} Función que devuelve un número en el intervalo [0, 1).
 */
export function createSeededRandom(seed) {
  let state = seed | 0;
  return function nextRandom() {
    state = (state + 0x6D2B79F5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generador usado durante la partida (sembrado con la hora para que cada partida varíe). */
let gameplayRandom = createSeededRandom((Date.now() & 0xffffff) + 7);

/**
 * Fija la semilla del generador de la partida. Los tests lo usan para que el
 * comportamiento aleatorio (saltos de la madre, ataques del jefe…) se repita
 * siempre igual y los resultados sean reproducibles.
 * @param {number} seed
 */
export function seedGameplayRandom(seed) {
  gameplayRandom = createSeededRandom(seed);
}

/**
 * Devuelve un número aleatorio en [0, 1) para la lógica de juego.
 * @returns {number}
 */
export function random() {
  return gameplayRandom();
}

/**
 * Devuelve un número decimal aleatorio entre `min` (incluido) y `max` (excluido).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomBetween(min, max) {
  return min + random() * (max - min);
}

/**
 * Devuelve un número entero aleatorio entre `min` y `max`, ambos incluidos.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInteger(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Elige un elemento al azar de una lista.
 * @template T
 * @param {T[]} list Lista de la que elegir.
 * @param {() => number} [randomSource] Generador a usar (por defecto, el de la partida).
 * @returns {T}
 */
export function randomItem(list, randomSource = random) {
  return list[Math.floor(randomSource() * list.length)];
}

/**
 * Limita un valor al intervalo [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Indica si dos rectángulos alineados con los ejes se solapan.
 * @param {{x:number, y:number, width:number, height:number}} first
 * @param {{x:number, y:number, width:number, height:number}} second
 * @returns {boolean}
 */
export function rectanglesOverlap(first, second) {
  return first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;
}
