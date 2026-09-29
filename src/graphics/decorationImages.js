/**
 * @file Imágenes de los decorados que no interactúan con el jugador: nubes,
 * plantas, sombrillas, farolas y el bar donde termina cada nivel.
 * Se generan la primera vez que se piden y se guardan en caché.
 */
import { createCanvas, fillRectangle, fillCircle, fillTriangle } from '../core/canvas.js';
import { drawText } from './font.js';

/** Imágenes ya generadas, por clave. */
const decorationCache = new Map();

/**
 * Devuelve una imagen de la caché o la crea si no existe.
 * @param {string} cacheKey
 * @param {number} width
 * @param {number} height
 * @param {(context: CanvasRenderingContext2D) => void} paint
 * @returns {HTMLCanvasElement}
 */
function getOrCreate(cacheKey, width, height, paint) {
  if (!decorationCache.has(cacheKey)) decorationCache.set(cacheKey, createCanvas(width, height, paint));
  return decorationCache.get(cacheKey);
}

/** Cómo se pinta cada decoración. `height` indica cuánto sobresale del suelo. */
const DECORATION_PAINTERS = {
  arbusto: {
    width: 32, height: 16,
    paint(context) {
      for (const [x, y, radius] of [[8, 11, 6], [17, 8, 8], [25, 11, 6]]) fillCircle(context, x, y, radius, '#1c7c2c');
      for (const [x, y, radius] of [[8, 10, 5], [17, 7, 7], [25, 10, 5]]) fillCircle(context, x, y, radius, '#3cb84c');
      fillRectangle(context, 13, 4, 2, 2, '#8cfc8c');
      fillRectangle(context, 5, 8, 2, 1, '#8cfc8c');
      fillRectangle(context, 0, 15, 32, 1, '#1c7c2c');
    }
  },
  chumbera: {
    width: 24, height: 32,
    paint(context) {
      const paintPad = (centerX, centerY, width, height) => {
        fillCircle(context, centerX, centerY, Math.max(width, height) / 2, '#2c6c2c');
        for (let offset = -height / 2; offset < height / 2; offset++) fillRectangle(context, centerX - width / 2 + 1, centerY + offset, width - 2, 1, '#4c9c4c');
      };
      paintPad(12, 25, 10, 12);
      paintPad(6, 15, 8, 10);
      paintPad(17, 12, 8, 10);
      paintPad(11, 5, 6, 8);
      for (const [x, y] of [[5, 9], [16, 6], [11, 1], [20, 9]]) fillRectangle(context, x, y, 2, 2, '#e84c6c');
      for (let spine = 0; spine < 12; spine++) fillRectangle(context, 4 + (spine * 7) % 16, 4 + (spine * 11) % 26, 1, 1, '#d8fc9c');
    }
  },
  sombrilla: {
    width: 32, height: 32,
    paint(context) {
      fillRectangle(context, 15, 8, 2, 24, '#8c8c8c');
      for (let row = 0; row < 9; row++) {
        const width = 6 + row * 3;
        fillRectangle(context, 16 - width / 2, 2 + row, width, 1, row % 2 ? '#fcfcfc' : '#fc4c4c');
      }
      for (let x = 2; x < 30; x += 8) fillRectangle(context, x, 11, 4, 1, '#fc4c4c');
      fillRectangle(context, 4, 28, 24, 3, '#3cbcfc');
      fillRectangle(context, 4, 28, 24, 1, '#8cdcfc');
    }
  },
  naranjo: {
    width: 24, height: 32,
    paint(context) {
      fillRectangle(context, 11, 18, 3, 14, '#6c4020');
      fillCircle(context, 12, 12, 10, '#2c7c2c');
      fillCircle(context, 12, 11, 8, '#3c9c3c');
      for (const [x, y] of [[7, 8], [15, 6], [10, 14], [17, 13], [5, 13]]) fillRectangle(context, x, y, 2, 2, '#fc8c00');
    }
  },
  drago: {
    width: 24, height: 32,
    paint(context) {
      fillRectangle(context, 10, 14, 4, 18, '#8c7c6c');
      fillRectangle(context, 6, 12, 2, 6, '#8c7c6c');
      fillRectangle(context, 16, 12, 2, 6, '#8c7c6c');
      for (const [x, y, radius] of [[6, 9, 5], [12, 7, 6], [18, 9, 5]]) fillCircle(context, x, y, radius, '#3c7c3c');
    }
  },
  farola: {
    width: 12, height: 48,
    paint(context) {
      fillRectangle(context, 5, 10, 2, 38, '#282828');
      fillRectangle(context, 3, 44, 6, 4, '#282828');
      fillRectangle(context, 2, 2, 8, 8, '#282828');
      fillRectangle(context, 3, 3, 6, 6, '#fce07c');
      fillTriangle(context, 1, 3, 10, 3, '#282828');
    }
  }
};

/**
 * Devuelve la imagen de una decoración de suelo (arbusto, chumbera, farola…).
 * @param {string} decorationType Clave de DECORATION_PAINTERS.
 * @returns {HTMLCanvasElement|null}
 */
export function getGroundDecorationImage(decorationType) {
  const painter = DECORATION_PAINTERS[decorationType];
  if (!painter) return null;
  return getOrCreate(decorationType, painter.width, painter.height, painter.paint);
}

/**
 * Devuelve la imagen de una nube (azulada y oscura si es de noche).
 * @param {boolean} isNight
 * @returns {HTMLCanvasElement}
 */
export function getCloudImage(isNight) {
  return getOrCreate(isNight ? 'cloudNight' : 'cloudDay', 48, 24, context => {
    const bodyColor = isNight ? '#3c4468' : '#fcfcfc';
    const shadowColor = isNight ? '#2c3458' : '#c8e0fc';
    for (const [x, y, radius] of [[14, 15, 8], [34, 15, 8], [24, 11, 10]]) fillCircle(context, x, y, radius, shadowColor);
    for (const [x, y, radius] of [[14, 14, 7], [34, 14, 7], [24, 10, 9]]) fillCircle(context, x, y, radius, bodyColor);
    fillRectangle(context, 8, 14, 32, 7, bodyColor);
  });
}

/** Medidas del bar de la meta y posición de su puerta (relativas a su esquina). */
export const BAR_SIZE = Object.freeze({ width: 80, height: 72, doorCenterX: 44 });

/**
 * Devuelve la imagen del "BAR PACO" donde termina cada nivel.
 * @returns {HTMLCanvasElement}
 */
export function getBarImage() {
  return getOrCreate('bar', BAR_SIZE.width, BAR_SIZE.height, context => {
    // Fachada y tejado.
    fillRectangle(context, 0, 16, 80, 56, '#f4ead8');
    fillRectangle(context, 0, 16, 80, 3, '#c8b898');
    fillRectangle(context, -2, 8, 84, 10, '#b84c28');
    fillTriangle(context, -2, 10, 84, 6, '#8c3418');
    // Letrero.
    fillRectangle(context, 14, 20, 52, 13, '#fcfcfc');
    fillRectangle(context, 14, 20, 52, 1, '#282828');
    fillRectangle(context, 14, 32, 52, 1, '#282828');
    drawText(context, 'BAR PACO', 40, 23, '#c81818', { align: 'center' });
    // Toldo verde y blanco.
    for (let x = 0; x < 80; x += 8) fillRectangle(context, x, 36, 8, 6, (x / 8) % 2 ? '#fcfcfc' : '#00a844');
    fillRectangle(context, 0, 42, 80, 1, '#006020');
    // Puerta, ventana con botellas y farol.
    fillRectangle(context, 34, 44, 20, 28, '#3c2410');
    fillRectangle(context, 36, 46, 16, 26, '#1c0c04');
    fillRectangle(context, 6, 48, 20, 14, '#3c2410');
    fillRectangle(context, 8, 50, 16, 10, '#7cb8e8');
    ['#2c7c2c', '#8c2c1c', '#2c7c2c', '#c8a040'].forEach((bottleColor, index) => fillRectangle(context, 10 + index * 4, 53, 2, 7, bottleColor));
    fillRectangle(context, 60, 48, 14, 14, '#3c2410');
    fillRectangle(context, 62, 50, 10, 10, '#fcd87c');
    fillRectangle(context, 58, 64, 16, 2, '#8c8c8c');
    fillRectangle(context, 65, 66, 2, 6, '#8c8c8c');
  });
}
