/**
 * @file Dibujo de texto con la fuente bitmap del juego.
 *
 * Todos los caracteres se pintan una vez en blanco en un "atlas" (una tira de
 * letras). Para escribir en un color se genera una copia teñida del atlas, que
 * se guarda en caché. Escribir es copiar trocitos del atlas: rápido y siempre
 * pixelado, sin depender de fuentes instaladas en el ordenador.
 */
import { createCanvas } from '../core/canvas.js';
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
/** Copias del atlas teñidas de cada color usado. */
const tintedAtlasCache = new Map();

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
 * Devuelve (y guarda en caché) el atlas teñido de un color.
 * @param {string} color
 * @returns {HTMLCanvasElement}
 */
function getTintedAtlas(color) {
  if (!tintedAtlasCache.has(color)) {
    tintedAtlasCache.set(color, createCanvas(whiteAtlas.width, whiteAtlas.height, context => {
      context.drawImage(whiteAtlas, 0, 0);
      // 'source-in' conserva la forma de las letras y sustituye su color.
      context.globalCompositeOperation = 'source-in';
      context.fillStyle = color;
      context.fillRect(0, 0, whiteAtlas.width, whiteAtlas.height);
    }));
  }
  return tintedAtlasCache.get(color);
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

/**
 * Pinta una línea de texto en un solo color, sin alineación ni efectos.
 * @private
 */
function paintTextRun(context, text, left, top, color, scale) {
  const atlas = getTintedAtlas(color);
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === ' ') continue;
    const atlasPosition = ATLAS_INDEX.has(character) ? ATLAS_INDEX.get(character) : ATLAS_INDEX.get(FALLBACK_CHARACTER);
    context.drawImage(
      atlas,
      atlasPosition * CHARACTER_ADVANCE, 0, CHARACTER_ADVANCE, ATLAS_CELL_HEIGHT,
      left + index * CHARACTER_ADVANCE * scale, top - ACCENT_ROWS * scale, CHARACTER_ADVANCE * scale, ATLAS_CELL_HEIGHT * scale
    );
  }
}

/** Desplazamientos para dibujar un contorno de 1 píxel alrededor del texto. */
const OUTLINE_OFFSETS = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]];

/**
 * Escribe una línea de texto. El texto se convierte a mayúsculas porque la
 * fuente solo tiene letras mayúsculas (como en las consolas de 8 bits).
 *
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {string|number} text
 * @param {number} x Posición horizontal (según la alineación).
 * @param {number} y Parte superior de las letras (las tildes quedan 2 px por encima).
 * @param {string} [color] Color CSS de las letras.
 * @param {Object} [options]
 * @param {'left'|'center'|'right'} [options.align] Alineación respecto a `x`.
 * @param {number} [options.scale] Ampliación entera (2 = letras el doble de grandes).
 * @param {string} [options.shadowColor] Si se indica, dibuja una sombra desplazada.
 * @param {string} [options.outlineColor] Si se indica, dibuja un contorno alrededor.
 */
export function drawText(context, text, x, y, color = '#fcfcfc', { align = 'left', scale = 1, shadowColor, outlineColor } = {}) {
  const upperText = String(text).toUpperCase();
  let left = Math.round(x);
  if (align === 'center') left = Math.round(x - measureTextWidth(upperText, scale) / 2);
  else if (align === 'right') left = Math.round(x - measureTextWidth(upperText, scale));
  const top = Math.round(y);

  if (shadowColor) paintTextRun(context, upperText, left + scale, top + scale, shadowColor, scale);
  if (outlineColor) {
    for (const [offsetX, offsetY] of OUTLINE_OFFSETS) paintTextRun(context, upperText, left + offsetX * scale, top + offsetY * scale, outlineColor, scale);
  }
  paintTextRun(context, upperText, left, top, color, scale);
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
