/**
 * @file Movimiento con colisiones contra el mapa de baldosas.
 *
 * El movimiento se resuelve eje por eje: primero en horizontal y luego en
 * vertical. Si tras moverse el cuerpo queda dentro de una baldosa sólida, se
 * le recoloca justo en su borde. Separar los ejes evita que los personajes se
 * "enganchen" en las esquinas.
 *
 * Todas las funciones trabajan con un "cuerpo": cualquier objeto con
 * `x, y, width, height, velocityX, velocityY, isOnGround` (en píxeles).
 */
import { TILE_SIZE } from '../config/constants.js';
import { TILE, isSolidTile } from './tileTypes.js';

/** Margen para que un borde que toca exactamente una baldosa no cuente como "dentro". */
const EDGE_EPSILON = 0.01;
/** Máximo solape (px) con la esquina de un bloque que se corrige empujando a un lado. */
const CORNER_CORRECTION_PIXELS = 5;

/**
 * Convierte una coordenada en píxeles a índice de baldosa.
 * @param {number} pixel
 * @returns {number}
 */
export function pixelToTile(pixel) {
  return Math.floor(pixel / TILE_SIZE);
}

/**
 * ¿Está libre de baldosas sólidas todo un rectángulo?
 * @param {import('./TileMap.js').TileMap} tileMap
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
export function isAreaFree(tileMap, x, y, width, height) {
  const firstColumn = pixelToTile(x);
  const lastColumn = pixelToTile(x + width - EDGE_EPSILON);
  const firstRow = pixelToTile(y);
  const lastRow = pixelToTile(y + height - EDGE_EPSILON);
  for (let row = firstRow; row <= lastRow; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      if (tileMap.isSolid(column, row)) return false;
    }
  }
  return true;
}

/**
 * Mueve el cuerpo en horizontal según `velocityX` y lo detiene contra las paredes.
 * @param {Object} body
 * @param {import('./TileMap.js').TileMap} tileMap
 * @returns {boolean} true si ha chocado con una pared.
 */
export function moveHorizontally(body, tileMap) {
  if (!body.velocityX) return false;
  body.x += body.velocityX;
  const firstRow = pixelToTile(body.y);
  const lastRow = pixelToTile(body.y + body.height - EDGE_EPSILON);
  const movingRight = body.velocityX > 0;
  const leadingColumn = movingRight ? pixelToTile(body.x + body.width - EDGE_EPSILON) : pixelToTile(body.x);
  for (let row = firstRow; row <= lastRow; row++) {
    if (tileMap.isSolid(leadingColumn, row)) {
      body.x = movingRight ? leadingColumn * TILE_SIZE - body.width : (leadingColumn + 1) * TILE_SIZE;
      return true;
    }
  }
  return false;
}

/**
 * @typedef {Object} HeadBump Resultado de chocar con la cabeza contra el techo.
 * @property {number} row Fila de las baldosas golpeadas.
 * @property {number[]} columns Columnas de las baldosas golpeadas.
 */

/**
 * Mueve el cuerpo en vertical según `velocityY`. Al caer, se posa sobre suelos y
 * plataformas de un sentido; al subir, choca con los techos.
 *
 * @param {Object} body
 * @param {import('./TileMap.js').TileMap} tileMap
 * @param {Object} [options]
 * @param {boolean} [options.isPlayer] Solo el jugador descubre bloques ocultos y
 *   disfruta de la corrección de esquinas.
 * @returns {HeadBump|null} Las baldosas golpeadas con la cabeza, o null.
 */
export function moveVertically(body, tileMap, { isPlayer = false } = {}) {
  const previousBottom = body.y + body.height;
  const previousTop = body.y;
  body.y += body.velocityY;
  body.isOnGround = false;
  const firstColumn = pixelToTile(body.x);
  const lastColumn = pixelToTile(body.x + body.width - EDGE_EPSILON);

  if (body.velocityY >= 0) {
    // Cayendo (o quieto): buscar suelo bajo los pies.
    const feetRow = pixelToTile(body.y + body.height - EDGE_EPSILON);
    for (let column = firstColumn; column <= lastColumn; column++) {
      const tile = tileMap.getTile(column, feetRow);
      // Una plataforma de un sentido solo sostiene si antes estábamos por encima de ella.
      const landsOnOneWayPlatform = tile === TILE.ONE_WAY_PLATFORM && previousBottom <= feetRow * TILE_SIZE + 0.5;
      if (isSolidTile(tile) || landsOnOneWayPlatform) {
        body.y = feetRow * TILE_SIZE - body.height;
        body.velocityY = 0;
        body.isOnGround = true;
        return null;
      }
    }
    return null;
  }

  // Subiendo: buscar techo sobre la cabeza.
  const headRow = pixelToTile(body.y);
  const hitColumns = [];
  for (let column = firstColumn; column <= lastColumn; column++) {
    const tile = tileMap.getTile(column, headRow);
    // Un bloque oculto solo se descubre si la cabeza venía desde debajo de él.
    const hitsHiddenBlock = isPlayer && tile === TILE.HIDDEN_BLOCK && previousTop >= (headRow + 1) * TILE_SIZE - 0.5;
    if (isSolidTile(tile) || hitsHiddenBlock) hitColumns.push(column);
  }
  if (isPlayer && hitColumns.length === 1 && firstColumn !== lastColumn && slideAroundCorner(body, tileMap, hitColumns[0], firstColumn, lastColumn)) {
    return null;
  }
  if (hitColumns.length) {
    body.y = (headRow + 1) * TILE_SIZE;
    body.velocityY = 0;
    return { row: headRow, columns: hitColumns };
  }
  return null;
}

/**
 * Corrección de esquinas: si el jugador solo roza con la cabeza el borde de un
 * bloque, se le desplaza un poco hacia un lado para que siga subiendo en vez de
 * frenarse en seco. Hace que los saltos se sientan más justos.
 * @returns {boolean} true si se ha corregido la posición.
 */
function slideAroundCorner(body, tileMap, hitColumn, firstColumn, lastColumn) {
  const blockLeft = hitColumn * TILE_SIZE;
  const blockRight = blockLeft + TILE_SIZE;
  if (hitColumn === lastColumn && body.x + body.width - blockLeft <= CORNER_CORRECTION_PIXELS &&
      isAreaFree(tileMap, blockLeft - body.width, body.y, body.width, body.height)) {
    body.x = blockLeft - body.width;
    return true;
  }
  if (hitColumn === firstColumn && blockRight - body.x <= CORNER_CORRECTION_PIXELS &&
      isAreaFree(tileMap, blockRight, body.y, body.width, body.height)) {
    body.x = blockRight;
    return true;
  }
  return false;
}

/**
 * ¿Hay suelo justo delante de los pies del cuerpo en la dirección en que mira?
 * Lo usan los enemigos "listos" para darse la vuelta en los bordes.
 * @param {Object} body Debe tener además `facing` (-1 izquierda, 1 derecha).
 * @param {import('./TileMap.js').TileMap} tileMap
 * @returns {boolean}
 */
export function hasGroundAhead(body, tileMap) {
  const probeX = body.facing > 0 ? body.x + body.width + 1 : body.x - 1;
  const tile = tileMap.getTile(pixelToTile(probeX), pixelToTile(body.y + body.height + 1));
  return isSolidTile(tile) || tile === TILE.ONE_WAY_PLATFORM;
}
