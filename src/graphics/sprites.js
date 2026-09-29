/**
 * @file Conversión de los mapas de píxeles en imágenes y dibujo de sprites.
 *
 * Al arrancar, cada definición de `spriteData.js` se pinta una sola vez en un
 * canvas pequeño (y también su versión reflejada). Después, dibujar un sprite
 * es copiar esa imagen, que es muy rápido.
 */
import { createCanvas } from '../core/canvas.js';
import { PIXEL_COLORS, TRANSPARENT_PIXEL } from './palette.js';
import { SPRITE_DEFINITIONS, findSpriteDefinitionProblems } from './spriteData.js';

/**
 * @typedef {Object} Sprite
 * @property {HTMLCanvasElement} image Imagen en su orientación original.
 * @property {HTMLCanvasElement} mirroredImage Imagen reflejada horizontalmente.
 * @property {number} width
 * @property {number} height
 */

/**
 * Sprites listos para dibujar, indexados por nombre. Se rellena con {@link buildSprites}.
 * @type {Object<string, Sprite>}
 */
export const SPRITES = {};

/**
 * Pinta un mapa de píxeles en un canvas nuevo.
 * @param {string[]} rows Filas de caracteres.
 * @param {Object<string, string>} colors Paleta a usar.
 * @returns {HTMLCanvasElement}
 */
function paintPixelRows(rows, colors) {
  return createCanvas(rows[0].length, rows.length, context => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const pixel = row[x];
        if (pixel === TRANSPARENT_PIXEL) continue;
        context.fillStyle = colors[pixel];
        context.fillRect(x, y, 1, 1);
      }
    });
  });
}

/**
 * Crea la versión reflejada horizontalmente de una imagen.
 * @param {HTMLCanvasElement} image
 * @returns {HTMLCanvasElement}
 */
function createMirroredImage(image) {
  return createCanvas(image.width, image.height, context => {
    context.translate(image.width, 0);
    context.scale(-1, 1);
    context.drawImage(image, 0, 0);
  });
}

/**
 * Rellena por arriba con filas transparentes hasta alcanzar la altura deseada.
 * @param {string[]} rows
 * @param {number} [targetHeight]
 * @returns {string[]}
 */
function padRowsAtTop(rows, targetHeight) {
  if (!targetHeight || rows.length >= targetHeight) return rows;
  const emptyRow = TRANSPARENT_PIXEL.repeat(rows[0].length);
  return Array(targetHeight - rows.length).fill(emptyRow).concat(rows);
}

/**
 * Convierte todas las definiciones en imágenes. Debe llamarse una vez al arrancar.
 * Si algún sprite está mal definido, avisa por la consola.
 */
export function buildSprites() {
  const problems = findSpriteDefinitionProblems(PIXEL_COLORS);
  if (problems.length) console.warn('Sprites con problemas:', problems);

  for (const [name, definition] of Object.entries(SPRITE_DEFINITIONS)) {
    const rows = padRowsAtTop(definition.rows, definition.height);
    const colors = { ...PIXEL_COLORS, ...(definition.colors || {}) };
    const image = paintPixelRows(rows, colors);
    SPRITES[name] = { image, mirroredImage: createMirroredImage(image), width: image.width, height: image.height };
  }
}

/**
 * Dibuja un sprite.
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {Sprite} sprite
 * @param {number} x Posición en pantalla (esquina superior izquierda).
 * @param {number} y
 * @param {Object} [options]
 * @param {boolean} [options.mirrored] Dibujar reflejado horizontalmente.
 * @param {boolean} [options.upsideDown] Dibujar boca abajo (enemigo derrotado).
 * @param {number} [options.rotation] Rotación en radianes alrededor del centro.
 */
export function drawSprite(context, sprite, x, y, { mirrored = false, upsideDown = false, rotation = 0 } = {}) {
  if (!sprite) return;
  const image = mirrored ? sprite.mirroredImage : sprite.image;
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);
  if (!rotation && !upsideDown) {
    context.drawImage(image, roundedX, roundedY);
    return;
  }
  context.save();
  context.translate(roundedX + sprite.width / 2, roundedY + sprite.height / 2);
  if (rotation) context.rotate(rotation);
  if (upsideDown) context.scale(1, -1);
  context.drawImage(image, -sprite.width / 2, -sprite.height / 2);
  context.restore();
}

/**
 * Dibuja un sprite ampliado (se usa en la escena final).
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {Sprite} sprite
 * @param {number} x
 * @param {number} y
 * @param {number} scale Factor de ampliación entero.
 * @param {boolean} [mirrored]
 */
export function drawScaledSprite(context, sprite, x, y, scale, mirrored = false) {
  const image = mirrored ? sprite.mirroredImage : sprite.image;
  context.drawImage(image, Math.round(x), Math.round(y), sprite.width * scale, sprite.height * scale);
}
