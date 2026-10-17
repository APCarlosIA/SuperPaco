/**
 * @file Dibujo de texto con la fuente bitmap del juego.
 *
 * Todos los caracteres se pintan una vez en blanco en un "atlas" (una tira de
 * letras). Cada texto distinto se convierte en una imagen de alta resolución
 * (letras suavizadas, degradado, contorno y sombra) que se guarda en caché.
 * Así el aspecto es el mismo en cualquier ordenador, sin depender de las
 * fuentes instaladas.
 */
import { RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { scale3x, addOutline } from './hd.js';
import { GLYPH_BITMAPS, ACCENT_MARKS, ACCENTED_CHARACTERS, GLYPH_WIDTH } from './fontGlyphs.js';

/** Ancho que ocupa cada carácter en pantalla (5 píxeles de letra + 1 de separación). */
export const CHARACTER_ADVANCE = GLYPH_WIDTH + 1;
/** Alto de cada celda del atlas: 2 filas para tildes + 7 de letra + 1 de margen. */
const ATLAS_CELL_HEIGHT = 10;
/** Filas reservadas encima de la letra para las tildes. */
const ACCENT_ROWS = 2;

const ALL_CHARACTERS = Object.keys(GLYPH_BITMAPS).concat(Object.keys(ACCENTED_CHARACTERS));
/** Posición de cada carácter dentro del atlas. */
const ATLAS_INDEX = new Map(ALL_CHARACTERS.map((character, index) => [character, index]));
const FALLBACK_CHARACTER = '?';

/** Atlas en blanco con todas las letras; se crea al llamar a {@link buildFont}. */
let whiteAtlas = null;

/**
 * Pinta una matriz de bits en el atlas.
 * @param {CanvasRenderingContext2D} context
 * @param {string[]} bitRows Filas de '0' y '1'.
 * @param {number} left Coordenada X de la celda.
 * @param {number} top Coordenada Y donde empieza a pintar.
 */
function paintBitRows(context, bitRows, left, top) {
  bitRows.forEach((row, rowIndex) => {
    for (let column = 0; column < row.length; column++) {
      if (row[column] === '1') context.fillRect(left + column, top + rowIndex, 1, 1);
    }
  });
}

/** Crea el atlas de letras. Debe llamarse una vez al arrancar el juego. */
export function buildFont() {
  whiteAtlas = createCanvas(ALL_CHARACTERS.length * CHARACTER_ADVANCE, ATLAS_CELL_HEIGHT, context => {
    context.fillStyle = '#ffffff';
    ALL_CHARACTERS.forEach((character, index) => {
      const cellLeft = index * CHARACTER_ADVANCE;
      const accented = ACCENTED_CHARACTERS[character];
      const baseCharacter = accented ? accented[0] : character;
      paintBitRows(context, GLYPH_BITMAPS[baseCharacter].split(' '), cellLeft, ACCENT_ROWS);
      if (accented) paintBitRows(context, ACCENT_MARKS[accented[1]], cellLeft, 0);
    });
  });
}

/**
 * Calcula el ancho en píxeles que ocupará un texto.
 * @param {string} text
 * @param {number} [scale] Factor de ampliación.
 * @returns {number}
 */
export function measureTextWidth(text, scale = 1) {
  return text.length ? (text.length * CHARACTER_ADVANCE - 1) * scale : 0;
}

/** Imágenes de texto ya generadas (la clave incluye texto, color y estilo). */
const textImageCache = new Map();
const MAX_CACHED_TEXT_IMAGES = 600;

/**
 * Aclara (`amount` > 0) u oscurece (`amount` < 0) un color `#rrggbb`.
 * Los demás formatos se devuelven sin cambios.
 */
function shiftColor(color, amount) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  const channels = [0, 2, 4].map(offset => parseInt(match[1].slice(offset, offset + 2), 16));
  const shifted = channels.map(value => Math.round(amount > 0 ? value + (255 - value) * amount : value * (1 + amount)));
  return `rgb(${shifted[0]}, ${shifted[1]}, ${shifted[2]})`;
}

/** Pinta el texto en blanco con el atlas, a tamaño original (1 píxel por píxel de la fuente). */
function paintWhiteText(text) {
  return createCanvas(text.length * CHARACTER_ADVANCE, ATLAS_CELL_HEIGHT, context => {
    for (let index = 0; index < text.length; index++) {
      const character = text[index];
      if (character === ' ') continue;
      const atlasPosition = ATLAS_INDEX.has(character) ? ATLAS_INDEX.get(character) : ATLAS_INDEX.get(FALLBACK_CHARACTER);
      context.drawImage(whiteAtlas, atlasPosition * CHARACTER_ADVANCE, 0, CHARACTER_ADVANCE, ATLAS_CELL_HEIGHT, index * CHARACTER_ADVANCE, 0, CHARACTER_ADVANCE, ATLAS_CELL_HEIGHT);
    }
  });
}

/**
 * Genera la imagen de alta resolución de un texto: letras suavizadas con
 * degradado, contorno grueso opcional y sombra opcional.
 * @private
 * @returns {{canvas: HTMLCanvasElement, padding: number}} `padding` en píxeles de alta resolución.
 */
function createTextImage(text, color, scale, shadowColor, outlineColor) {
  const targetScale = RENDER_SCALE * scale;
  const white = paintWhiteText(text);
  // Las letras pequeñas se amplían tal cual (así se leen mejor); los títulos grandes
  // pasan por Scale3x para redondear las diagonales.
  const enlarged = scale > 1 ? scale3x(white) : white;
  const fill = createCanvas(white.width * targetScale, white.height * targetScale, context => {
    context.imageSmoothingEnabled = scale > 1;
    context.imageSmoothingQuality = 'high';
    context.drawImage(enlarged, 0, 0, white.width * targetScale, white.height * targetScale);
    const gradient = context.createLinearGradient(0, ACCENT_ROWS * targetScale, 0, (ACCENT_ROWS + 7) * targetScale);
    gradient.addColorStop(0, shiftColor(color, 0.3));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, shiftColor(color, -0.22));
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = gradient;
    context.fillRect(0, 0, white.width * targetScale, white.height * targetScale);
  });

  const outlineThickness = outlineColor ? Math.max(2, Math.round(targetScale * 0.85)) : 0;
  const shadowOffset = shadowColor ? Math.max(2, Math.round(targetScale * 0.9)) : 0;
  const padding = Math.max(outlineThickness, 0) + (shadowOffset ? 1 : 0);
  const body = outlineColor ? addOutline(fill, outlineThickness, outlineColor) : fill;
  const bodyPadding = outlineColor ? outlineThickness : 0;
  const canvas = createCanvas(fill.width + (bodyPadding + padding) + shadowOffset, fill.height + (bodyPadding + padding) + shadowOffset, context => {
    if (shadowColor) {
      const shadow = createCanvas(body.width, body.height, shadowContext => {
        shadowContext.drawImage(body, 0, 0);
        shadowContext.globalCompositeOperation = 'source-in';
        shadowContext.fillStyle = shadowColor;
        shadowContext.fillRect(0, 0, body.width, body.height);
      });
      context.drawImage(shadow, padding + shadowOffset, padding + shadowOffset);
    }
    context.drawImage(body, padding, padding);
  });
  return { canvas, padding: padding + bodyPadding };
}

/** Devuelve (y guarda en caché) la imagen de un texto con su estilo. */
function getTextImage(text, color, scale, shadowColor, outlineColor) {
  const cacheKey = `${text}|${color}|${scale}|${shadowColor || ''}|${outlineColor || ''}`;
  let image = textImageCache.get(cacheKey);
  if (!image) {
    if (textImageCache.size >= MAX_CACHED_TEXT_IMAGES) textImageCache.clear();
    image = createTextImage(text, color, scale, shadowColor, outlineColor);
    textImageCache.set(cacheKey, image);
  }
  return image;
}

/**
 * Escribe una línea de texto. El texto se convierte a mayúsculas porque la
 * fuente solo tiene letras mayúsculas (como en las consolas de 8 bits).
 *
 * @param {CanvasRenderingContext2D} context Dónde dibujar (ya ampliado a alta resolución).
 * @param {string|number} text
 * @param {number} x Posición horizontal (según la alineación).
 * @param {number} y Parte superior de las letras (las tildes quedan 2 px por encima).
 * @param {string} [color] Color CSS de las letras.
 * @param {Object} [options]
 * @param {'left'|'center'|'right'} [options.align] Alineación respecto a `x`.
 * @param {number} [options.scale] Ampliación (2 = letras el doble de grandes).
 * @param {string} [options.shadowColor] Si se indica, dibuja una sombra desplazada.
 * @param {string} [options.outlineColor] Si se indica, dibuja un contorno alrededor.
 */
export function drawText(context, text, x, y, color = '#fcfcfc', { align = 'left', scale = 1, shadowColor, outlineColor } = {}) {
  const upperText = String(text).toUpperCase();
  if (!upperText.length) return;
  let left = x;
  if (align === 'center') left = x - measureTextWidth(upperText, scale) / 2;
  else if (align === 'right') left = x - measureTextWidth(upperText, scale);
  const { canvas, padding } = getTextImage(upperText, color, scale, shadowColor, outlineColor);
  const snappedLeft = Math.round(left * RENDER_SCALE) / RENDER_SCALE;
  const snappedTop = Math.round(y * RENDER_SCALE) / RENDER_SCALE;
  context.drawImage(
    canvas,
    snappedLeft - padding / RENDER_SCALE,
    snappedTop - ACCENT_ROWS * scale - padding / RENDER_SCALE,
    canvas.width / RENDER_SCALE,
    canvas.height / RENDER_SCALE
  );
}

/**
 * Escribe un texto de varias líneas separadas por '\n'.
 * @param {CanvasRenderingContext2D} context
 * @param {string} text
 * @param {number} x
 * @param {number} y Parte superior de la primera línea.
 * @param {string} color
 * @param {Object} [options] Las mismas opciones que {@link drawText} más `lineHeight`.
 * @returns {number} Alto total ocupado.
 */
export function drawTextLines(context, text, x, y, color, options = {}) {
  const lineHeight = options.lineHeight || 11;
  const lines = String(text).split('\n');
  lines.forEach((line, index) => drawText(context, line, x, y + index * lineHeight, color, options));
  return lines.length * lineHeight;
}
