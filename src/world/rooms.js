/**
 * @file Salas secretas reutilizables: sala de pesetas, tienda de premios y
 * sala de pruebas. Cada fábrica devuelve la función que se pasa a
 * `LevelBuilder.addRoom`; la sala se construye al entrar en ella.
 *
 * Todas llevan una moneda gigante (numerada por el nivel con
 * `reserveBigCoin`), un personaje que charla y una puerta de salida.
 */
import { LevelBuilder } from './LevelBuilder.js';
import { BLOCK_CONTENT } from './tileTypes.js';

/** Ancho de la sala de pesetas y de la tienda. */
const SMALL_ROOM_WIDTH = 38;
/** Ancho de la sala de pruebas. */
const CHALLENGE_ROOM_WIDTH = 44;

/**
 * Sala de pesetas: un arco de monedas, plataformas y la moneda gigante en lo más alto.
 * @param {Object} options
 * @param {string} options.themeName Tema de la sala ('taberna', 'bodega', 'gruta').
 * @param {number} options.bigCoinNumber Número reservado con `reserveBigCoin`.
 * @param {string[]} options.lines Lo que dice el personaje.
 * @param {string} [options.talkerLook] 'flower' o el sprite de un cameo.
 * @returns {() => import('./LevelBuilder.js').LevelData}
 */
export function createCoinRoom({ themeName, bigCoinNumber, lines, talkerLook = 'flower' }) {
  return () => {
    const room = new LevelBuilder(SMALL_ROOM_WIDTH, themeName);
    room.addCeiling(0, SMALL_ROOM_WIDTH - 1);
    room.addGround(0, SMALL_ROOM_WIDTH - 1);
    room.addTalker(7, lines, { look: talkerLook });
    room.addCoinArc(10, 11, 9, 3);
    room.addOneWayPlatform(11, 9, 3);
    room.addCoinRow(11, 8, 3);
    room.addOneWayPlatform(16, 7, 3);
    room.addCoinRow(16, 6, 3);
    room.addOneWayPlatform(21, 9, 3);
    room.addCoinRow(21, 8, 3);
    room.addNumberedBigCoin(17, 4, bigCoinNumber);
    room.addCoinArc(26, 11, 6, 2);
    room.setRoomExit(34);
    return room.build();
  };
}

/**
 * Tienda de premios: tres bloques con regalos y una moneda gigante encima.
 * @param {Object} options
 * @param {string} options.themeName
 * @param {number} options.bigCoinNumber
 * @param {string[]} options.lines
 * @param {string[]} [options.contents] Qué dan los tres bloques.
 * @param {string} [options.talkerLook]
 * @returns {() => import('./LevelBuilder.js').LevelData}
 */
export function createShopRoom({ themeName, bigCoinNumber, lines, contents = [BLOCK_CONTENT.POWER_UP, BLOCK_CONTENT.CHURROS, BLOCK_CONTENT.POWER_UP], talkerLook = 'flower' }) {
  return () => {
    const room = new LevelBuilder(SMALL_ROOM_WIDTH, themeName);
    room.addCeiling(0, SMALL_ROOM_WIDTH - 1);
    room.addGround(0, SMALL_ROOM_WIDTH - 1);
    room.addTalker(6, lines, { look: talkerLook });
    room.addQuestionBlock(14, 9, contents[0]);
    room.addQuestionBlock(18, 9, contents[1]);
    room.addQuestionBlock(22, 9, contents[2]);
    room.addOneWayPlatform(17, 5, 3);
    room.addNumberedBigCoin(18, 3, bigCoinNumber);
    room.addCoinRow(26, 8, 5);
    room.setRoomExit(34);
    return room.build();
  };
}

/**
 * Sala de pruebas: un foso largo que se cruza saltando entre plataformas con
 * un enemigo volador; la moneda gigante espera al otro lado, en lo alto.
 * @param {Object} options
 * @param {string} options.themeName
 * @param {number} options.bigCoinNumber
 * @param {string[]} options.lines
 * @returns {() => import('./LevelBuilder.js').LevelData}
 */
export function createChallengeRoom({ themeName, bigCoinNumber, lines }) {
  return () => {
    const room = new LevelBuilder(CHALLENGE_ROOM_WIDTH, themeName);
    room.addCeiling(0, CHALLENGE_ROOM_WIDTH - 1);
    room.addGround(0, 6);
    room.addTalker(4, lines);
    // Foso de 24 columnas salvado con plataformas cada vez más estrechas.
    const steps = [[9, 10, 3], [14, 8, 3], [19, 10, 2], [23, 7, 2], [27, 9, 2], [31, 8, 2]];
    for (const [column, row, length] of steps) {
      room.addOneWayPlatform(column, row, length);
      room.addCoinRow(column, row - 1, length);
    }
    room.addEnemy('mosquito', 21, 6);
    room.addGround(35, CHALLENGE_ROOM_WIDTH - 1);
    room.addOneWayPlatform(37, 8, 3);
    room.addNumberedBigCoin(38, 6, bigCoinNumber);
    room.setRoomExit(41);
    return room.build();
  };
}
