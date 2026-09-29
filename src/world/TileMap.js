/**
 * @file Rejilla de baldosas de un nivel.
 */
import { TILE, isSolidTile } from './tileTypes.js';

/**
 * Mapa de baldosas de un nivel: una rejilla de `widthInTiles × heightInTiles`.
 *
 * Reglas en los bordes:
 *   - A izquierda y derecha del nivel hay "muros" invisibles (se devuelve suelo),
 *     para que nadie pueda salirse del mapa por los lados.
 *   - Por encima y por debajo no hay nada (se devuelve vacío): se puede saltar
 *     por encima de la pantalla y caer por los fosos.
 */
export class TileMap {
  /**
   * @param {number} widthInTiles
   * @param {number} heightInTiles
   */
  constructor(widthInTiles, heightInTiles) {
    this.widthInTiles = widthInTiles;
    this.heightInTiles = heightInTiles;
    /** Una fila por cada altura; cada fila guarda el tipo de baldosa de cada columna. */
    this.rows = Array.from({ length: heightInTiles }, () => new Uint8Array(widthInTiles));
  }

  /**
   * Devuelve el tipo de baldosa de una casilla.
   * @param {number} column
   * @param {number} row
   * @returns {number} Uno de los valores de TILE.
   */
  getTile(column, row) {
    if (column < 0 || column >= this.widthInTiles) return TILE.GROUND;
    if (row < 0 || row >= this.heightInTiles) return TILE.EMPTY;
    return this.rows[row][column];
  }

  /**
   * Cambia el tipo de baldosa de una casilla. Las casillas fuera del mapa se ignoran.
   * @param {number} column
   * @param {number} row
   * @param {number} tileId
   */
  setTile(column, row, tileId) {
    if (column < 0 || column >= this.widthInTiles || row < 0 || row >= this.heightInTiles) return;
    this.rows[row][column] = tileId;
  }

  /**
   * ¿Bloquea el paso la casilla indicada?
   * @param {number} column
   * @param {number} row
   * @returns {boolean}
   */
  isSolid(column, row) {
    return isSolidTile(this.getTile(column, row));
  }

  /**
   * Busca la primera casilla sólida de una columna empezando desde arriba.
   * Se usa para colocar a Paco de pie sobre el suelo al empezar o reaparecer.
   * @param {number} column
   * @param {number} [fromRow] Fila desde la que empezar (por defecto 2, para saltarse el techo).
   * @returns {number} Fila encontrada, o -1 si la columna no tiene suelo.
   */
  findFirstSolidRow(column, fromRow = 2) {
    for (let row = fromRow; row < this.heightInTiles; row++) {
      if (this.isSolid(column, row)) return row;
    }
    return -1;
  }
}
