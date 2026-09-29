/**
 * @file Tipos de baldosa del mapa y contenidos de los bloques.
 *
 * El mapa de cada nivel es una rejilla de números pequeños; cada número indica
 * qué hay en esa casilla. Se guardan en `Uint8Array`, por eso son enteros.
 */

/** Identificador de cada tipo de baldosa. */
export const TILE = Object.freeze({
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION_BLOCK: 3,
  USED_BLOCK: 4,
  /** Bloque de azulejo: sólido e indestructible (escaleras, muros). */
  AZULEJO: 5,
  /** El tonel ocupa 2 columnas: tapa izquierda/derecha y cuerpo izquierdo/derecho. */
  BARREL_TOP_LEFT: 6,
  BARREL_TOP_RIGHT: 7,
  BARREL_BODY_LEFT: 8,
  BARREL_BODY_RIGHT: 9,
  /** Plataforma que se atraviesa desde abajo y se pisa desde arriba (toldos, balcones). */
  ONE_WAY_PLATFORM: 10,
  /** Bloque invisible que solo aparece al golpearlo desde abajo. */
  HIDDEN_BLOCK: 11,
  LAVA: 12,
  WATER: 13,
  BRIDGE: 14,
  COIN: 16
});

/** Baldosas que bloquean el paso en todas las direcciones. */
const SOLID_TILES = new Set([
  TILE.GROUND, TILE.BRICK, TILE.QUESTION_BLOCK, TILE.USED_BLOCK, TILE.AZULEJO,
  TILE.BARREL_TOP_LEFT, TILE.BARREL_TOP_RIGHT, TILE.BARREL_BODY_LEFT, TILE.BARREL_BODY_RIGHT,
  TILE.BRIDGE
]);

/**
 * ¿Bloquea el paso esta baldosa?
 * @param {number} tileId
 * @returns {boolean}
 */
export function isSolidTile(tileId) {
  return SOLID_TILES.has(tileId);
}

/**
 * ¿Es un líquido mortal o de relleno de fosos (lava o agua)?
 * @param {number} tileId
 * @returns {boolean}
 */
export function isLiquidTile(tileId) {
  return tileId === TILE.LAVA || tileId === TILE.WATER;
}

/** Qué sale de un bloque al golpearlo desde abajo. */
export const BLOCK_CONTENT = Object.freeze({
  /** Una peseta. */
  COIN: 'coin',
  /** Varias pesetas: da una por golpe hasta agotarse. */
  MULTI_COIN: 'multiCoin',
  /** Bocadillo si Paco es pequeño; pimiento de Padrón si ya es grande. */
  POWER_UP: 'powerUp',
  /** Churros con chocolate: invencibilidad temporal. */
  CHURROS: 'churros',
  /** Décimo de lotería: vida extra. */
  EXTRA_LIFE: 'extraLife'
});
