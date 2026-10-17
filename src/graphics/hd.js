/**
 * @file Herramientas para convertir arte pixelado en imágenes de alta
 * resolución con un acabado moderno: ampliación suavizada (Scale3x), luz y
 * sombra en los bordes, degradado ambiental y contorno grueso.
 *
 * Todas las funciones trabajan sobre canvas y solo se usan en el navegador.
 */
import { RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';

/** Color del contorno de los personajes (casi negro con un toque azulado). */
export const OUTLINE_COLOR = '#140c20';

/**
 * Amplía una imagen 3 veces con el algoritmo Scale3x: las diagonales quedan
 * suaves y los píxeles aislados (ojos, brillos) se conservan nítidos.
 * @param {HTMLCanvasElement} source
 * @returns {HTMLCanvasElement} Imagen de 3× el tamaño.
 */
export function scale3x(source) {
  const width = source.width;
  const height = source.height;
  const input = source.getContext('2d').getImageData(0, 0, width, height);
  const pixels = new Uint32Array(input.data.buffer);
  const output = new ImageData(width * 3, height * 3);
  const result = new Uint32Array(output.data.buffer);
  const outputWidth = width * 3;

  const at = (x, y) => {
    const clampedX = x < 0 ? 0 : x >= width ? width - 1 : x;
    const clampedY = y < 0 ? 0 : y >= height ? height - 1 : y;
    const value = pixels[clampedY * width + clampedX];
    return (value >>> 24) === 0 ? 0 : value;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const A = at(x - 1, y - 1), B = at(x, y - 1), C = at(x + 1, y - 1);
      const D = at(x - 1, y), E = at(x, y), F = at(x + 1, y);
      const G = at(x - 1, y + 1), H = at(x, y + 1), I = at(x + 1, y + 1);
      let e0 = E, e1 = E, e2 = E, e3 = E, e5 = E, e6 = E, e7 = E, e8 = E;
      if (B !== H && D !== F) {
        e0 = D === B ? D : E;
        e1 = (D === B && E !== C) || (B === F && E !== A) ? B : E;
        e2 = B === F ? F : E;
        e3 = (D === B && E !== G) || (D === H && E !== A) ? D : E;
        e5 = (B === F && E !== I) || (H === F && E !== C) ? F : E;
        e6 = D === H ? D : E;
        e7 = (D === H && E !== I) || (H === F && E !== G) ? H : E;
        e8 = H === F ? F : E;
      }
      const base = y * 3 * outputWidth + x * 3;
      result[base] = e0; result[base + 1] = e1; result[base + 2] = e2;
      result[base + outputWidth] = e3; result[base + outputWidth + 1] = E; result[base + outputWidth + 2] = e5;
      result[base + 2 * outputWidth] = e6; result[base + 2 * outputWidth + 1] = e7; result[base + 2 * outputWidth + 2] = e8;
    }
  }
  const canvas = createCanvas(width * 3, height * 3);
  canvas.getContext('2d').putImageData(output, 0, 0);
  return canvas;
}

/**
 * Aplica luz de arriba-izquierda a los píxeles del borde: aclara los que dan
 * al cielo y oscurece los que dan al suelo. Da volumen al dibujo.
 * @param {HTMLCanvasElement} source Imagen original (se modifica una copia).
 * @param {{light?: number, shade?: number}} [options]
 * @returns {HTMLCanvasElement}
 */
export function applyEdgeLighting(source, { light = 0.28, shade = 0.24 } = {}) {
  const width = source.width;
  const height = source.height;
  const image = source.getContext('2d').getImageData(0, 0, width, height);
  const original = new Uint8ClampedArray(image.data);
  const data = image.data;
  const isOpaque = (x, y) => x >= 0 && y >= 0 && x < width && y < height && original[(y * width + x) * 4 + 3] > 8;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (original[index + 3] <= 8) continue;
      let amount = 0;
      if (!isOpaque(x, y - 1)) amount += light;
      else if (!isOpaque(x - 1, y)) amount += light * 0.5;
      if (!isOpaque(x, y + 1)) amount -= shade;
      else if (!isOpaque(x + 1, y)) amount -= shade * 0.5;
      if (amount === 0) continue;
      for (let channel = 0; channel < 3; channel++) {
        const value = original[index + channel];
        data[index + channel] = amount > 0 ? value + (255 - value) * amount : value * (1 + amount);
      }
    }
  }
  return createCanvas(width, height, context => context.putImageData(image, 0, 0));
}

/**
 * Añade un contorno grueso del color indicado alrededor de la silueta.
 * @param {HTMLCanvasElement} source Imagen en alta resolución.
 * @param {number} thickness Grosor en píxeles de alta resolución.
 * @param {string} [color]
 * @returns {HTMLCanvasElement} Imagen con `thickness` píxeles de margen por cada lado.
 */
export function addOutline(source, thickness, color = OUTLINE_COLOR) {
  const tinted = createCanvas(source.width, source.height, context => {
    context.drawImage(source, 0, 0);
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = color;
    context.fillRect(0, 0, source.width, source.height);
  });
  return createCanvas(source.width + thickness * 2, source.height + thickness * 2, context => {
    for (let offsetY = -thickness; offsetY <= thickness; offsetY++) {
      for (let offsetX = -thickness; offsetX <= thickness; offsetX++) {
        if (offsetX * offsetX + offsetY * offsetY > thickness * thickness + 1) continue;
        context.drawImage(tinted, thickness + offsetX, thickness + offsetY);
      }
    }
    context.drawImage(source, thickness, thickness);
  });
}

/**
 * Superpone un degradado suave que aclara la parte alta y oscurece la baja.
 * Solo afecta a los píxeles ya dibujados.
 * @param {HTMLCanvasElement} canvas Imagen en alta resolución (se modifica).
 * @param {number} top Altura donde empieza la imagen original (para ignorar el margen).
 * @param {number} bodyHeight Altura de la imagen original.
 */
export function applyAmbientGradient(canvas, top, bodyHeight) {
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, top, 0, top + bodyHeight);
  gradient.addColorStop(0, 'rgba(255, 244, 220, 0.16)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(20, 10, 60, 0.26)');
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
}

/**
 * Convierte un dibujo pixelado en un sprite de alta resolución listo para usar.
 * @param {HTMLCanvasElement} source Mapa de píxeles original.
 * @param {Object} [options]
 * @param {boolean} [options.outline] Añadir contorno grueso (por defecto sí).
 * @param {number} [options.outlineThickness] Grosor del contorno en píxeles lógicos.
 * @returns {{image: HTMLCanvasElement, padding: number}} `padding` en píxeles lógicos.
 */
export function createHdSprite(source, { outline = true, outlineThickness = 1 } = {}) {
  const lit = applyEdgeLighting(source);
  const big = scale3x(lit);
  applyAmbientGradient(big, 0, big.height);
  if (!outline) return { image: big, padding: 0 };
  const thickness = Math.round(outlineThickness * RENDER_SCALE);
  return { image: addOutline(big, thickness), padding: outlineThickness };
}

/**
 * Dibuja una imagen de alta resolución en el contexto (que ya está ampliado)
 * haciendo que 1 píxel de la imagen sea 1 píxel real de pantalla.
 * @param {CanvasRenderingContext2D} context
 * @param {HTMLCanvasElement} image Imagen creada con las funciones de este módulo.
 * @param {number} x Posición lógica de la esquina superior izquierda.
 * @param {number} y
 */
export function drawHdImage(context, image, x, y) {
  context.drawImage(image, Math.round(x * RENDER_SCALE) / RENDER_SCALE, Math.round(y * RENDER_SCALE) / RENDER_SCALE, image.width / RENDER_SCALE, image.height / RENDER_SCALE);
}
