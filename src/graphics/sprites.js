/**
 * @file Conversión de los mapas de píxeles en imágenes y dibujo de sprites.
 *
 * Al arrancar, cada definición de `spriteData.js` se pinta una vez en un
 * canvas pequeño y se convierte en una imagen de alta resolución (ampliación
 * suavizada, luz y sombra, contorno grueso). Después, dibujar un sprite es
 * copiar esa imagen, que es muy rápido. También se guarda su versión reflejada.
 */
import { RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { PIXEL_COLORS, TRANSPARENT_PIXEL } from './palette.js';
import { SPRITE_DEFINITIONS, findSpriteDefinitionProblems } from './spriteData.js';
import { createHdSprite } from './hd.js';
import { PACO_POSES, PACO_PALETTES, createPacoSprite } from './pacoArt.js';
import { pacoSpriteName } from './spriteData.js';

/**
 * @typedef {Object} Sprite
 * @property {HTMLCanvasElement} image Imagen en alta resolución (con margen para el contorno).
 * @property {HTMLCanvasElement} mirroredImage Imagen reflejada horizontalmente.
 * @property {number} width Ancho lógico (sin el margen).
 * @property {number} height Alto lógico (sin el margen).
 * @property {number} padding Margen del contorno, en píxeles lógicos.
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
    const { image, padding } = createHdSprite(paintPixelRows(rows, colors));
    SPRITES[name] = {
      image,
      mirroredImage: createMirroredImage(image),
      width: rows[0].length,
      height: rows.length,
      padding
    };
  }
  buildPacoSprites();
}

/** Sustituye los sprites pixelados de Paco por su dibujo vectorial animado. */
function buildPacoSprites() {
  for (const variant of Object.keys(PACO_PALETTES)) {
    for (const size of ['small', 'big']) {
      for (const pose of PACO_POSES) {
        const { image, padding, width, height } = createPacoSprite(size, pose, variant);
        SPRITES[pacoSpriteName(size, pose, variant)] = { image, mirroredImage: createMirroredImage(image), width, height, padding };
      }
    }
  }
}

/**
 * Dibuja un sprite.
 * @param {CanvasRenderingContext2D} context Dónde dibujar (ya ampliado a alta resolución).
 * @param {Sprite} sprite
 * @param {number} x Posición lógica (esquina superior izquierda del dibujo, sin contorno).
 * @param {number} y
 * @param {Object} [options]
 * @param {boolean} [options.mirrored] Dibujar reflejado horizontalmente.
 * @param {boolean} [options.upsideDown] Dibujar boca abajo (enemigo derrotado).
 * @param {number} [options.rotation] Rotación en radianes alrededor del centro.
 * @param {number} [options.scaleX] Estiramiento horizontal desde el centro de los pies (1 = normal).
 * @param {number} [options.scaleY] Estiramiento vertical desde los pies (1 = normal).
 * @param {number} [options.alpha] Opacidad (1 = opaco).
 */
export function drawSprite(context, sprite, x, y, { mirrored = false, upsideDown = false, rotation = 0, scaleX = 1, scaleY = 1, alpha = 1 } = {}) {
  if (!sprite) return;
  const image = mirrored ? sprite.mirroredImage : sprite.image;
  const drawWidth = image.width / RENDER_SCALE;
  const drawHeight = image.height / RENDER_SCALE;
  const snappedX = Math.round(x * RENDER_SCALE) / RENDER_SCALE;
  const snappedY = Math.round(y * RENDER_SCALE) / RENDER_SCALE;
  const previousAlpha = context.globalAlpha;
  if (alpha !== 1) context.globalAlpha = previousAlpha * alpha;

  const isTransformed = rotation || upsideDown || scaleX !== 1 || scaleY !== 1;
  if (!isTransformed) {
    context.drawImage(image, snappedX - sprite.padding, snappedY - sprite.padding, drawWidth, drawHeight);
  } else if (rotation || upsideDown) {
    context.save();
    context.translate(snappedX + sprite.width / 2, snappedY + sprite.height / 2);
    if (rotation) context.rotate(rotation);
    if (upsideDown) context.scale(1, -1);
    context.scale(scaleX, scaleY);
    context.drawImage(image, -sprite.width / 2 - sprite.padding, -sprite.height / 2 - sprite.padding, drawWidth, drawHeight);
    context.restore();
  } else {
    // Estirar y aplastar: el punto fijo son los pies (centro de la base).
    context.save();
    context.translate(snappedX + sprite.width / 2, snappedY + sprite.height);
    context.scale(scaleX, scaleY);
    context.drawImage(image, -sprite.width / 2 - sprite.padding, -sprite.height - sprite.padding, drawWidth, drawHeight);
    context.restore();
  }
  if (alpha !== 1) context.globalAlpha = previousAlpha;
}

/**
 * Dibuja un sprite ampliado (se usa en la escena final).
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {Sprite} sprite
 * @param {number} x
 * @param {number} y
 * @param {number} scale Factor de ampliación.
 * @param {boolean} [mirrored]
 */
export function drawScaledSprite(context, sprite, x, y, scale, mirrored = false) {
  const image = mirrored ? sprite.mirroredImage : sprite.image;
  context.drawImage(
    image,
    x - sprite.padding * scale, y - sprite.padding * scale,
    image.width / RENDER_SCALE * scale, image.height / RENDER_SCALE * scale
  );
}

/**
 * Dibuja un sprite encajado en un rectángulo (iconos del marcador).
 * @param {CanvasRenderingContext2D} context
 * @param {Sprite} sprite
 * @param {number} x
 * @param {number} y
 * @param {number} width Ancho del dibujo (sin contorno).
 * @param {number} height Alto del dibujo (sin contorno).
 */
export function drawSpriteFitted(context, sprite, x, y, width, height) {
  const scaleX = width / sprite.width;
  const scaleY = height / sprite.height;
  context.drawImage(
    sprite.image,
    x - sprite.padding * scaleX, y - sprite.padding * scaleY,
    sprite.image.width / RENDER_SCALE * scaleX, sprite.image.height / RENDER_SCALE * scaleY
  );
}
