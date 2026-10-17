/**
 * @file Imágenes de los decorados que no interactúan con el jugador: plantas,
 * sombrillas, farolas y el bar donde termina cada nivel.
 *
 * Se dibujan con formas vectoriales en alta resolución (contorno oscuro,
 * degradados de luz y sombra), la primera vez que se piden, y se guardan en
 * caché. Las medidas se dan en píxeles lógicos; cada imagen lleva un margen
 * de {@link DECORATION_PADDING} píxeles para el contorno.
 */
import { RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { OUTLINE_COLOR } from './hd.js';
import { drawText } from './font.js';

/** Margen (px lógicos) que rodea a cada decoración. */
export const DECORATION_PADDING = 2;
const TAU = Math.PI * 2;

/** Imágenes ya generadas, por clave. */
const decorationCache = new Map();

/**
 * Devuelve una imagen de la caché o la crea si no existe.
 * @param {string} cacheKey
 * @param {number} width Ancho lógico.
 * @param {number} height Alto lógico.
 * @param {(context: CanvasRenderingContext2D) => void} paint Pinta en coordenadas lógicas.
 * @returns {HTMLCanvasElement}
 */
function getOrCreate(cacheKey, width, height, paint) {
  if (!decorationCache.has(cacheKey)) {
    decorationCache.set(cacheKey, createCanvas((width + DECORATION_PADDING * 2) * RENDER_SCALE, (height + DECORATION_PADDING * 2) * RENDER_SCALE, context => {
      context.scale(RENDER_SCALE, RENDER_SCALE);
      context.translate(DECORATION_PADDING, DECORATION_PADDING);
      context.imageSmoothingEnabled = true;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      paint(context);
    }));
  }
  return decorationCache.get(cacheKey);
}

/** Rellena el camino actual con degradado vertical y le pone contorno. */
function fillOutlined(context, topColor, bottomColor, top, bottom, lineWidth = 0.9) {
  const gradient = context.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = OUTLINE_COLOR;
  context.lineWidth = lineWidth;
  context.stroke();
}

/** Círculo relleno con degradado y contorno. */
function blob(context, x, y, radius, topColor, bottomColor) {
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  fillOutlined(context, topColor, bottomColor, y - radius, y + radius);
}

/** Cómo se pinta cada decoración. `width` y `height` son lo que ocupa sobre el suelo. */
const DECORATION_PAINTERS = {
  arbusto: {
    width: 32, height: 16,
    paint(context) {
      for (const [x, y, radius] of [[8, 11, 6], [24, 11, 6], [16, 8, 8]]) blob(context, x, y, radius, '#6fdc62', '#2a8a3c');
      context.fillStyle = 'rgba(255,255,255,0.35)';
      for (const [x, y] of [[13, 4.5], [6, 8.5], [22, 7.5]]) { context.beginPath(); context.ellipse(x, y, 1.6, 0.8, -0.5, 0, TAU); context.fill(); }
      for (const [x, y, color] of [[10, 12, '#ff7aa8'], [21, 13, '#ffe45a'], [16, 6, '#ff7aa8']]) { context.fillStyle = color; context.beginPath(); context.arc(x, y, 0.9, 0, TAU); context.fill(); }
    }
  },
  chumbera: {
    width: 24, height: 32,
    paint(context) {
      const pad = (cx, cy, rx, ry, rotation) => {
        context.beginPath();
        context.ellipse(cx, cy, rx, ry, rotation, 0, TAU);
        fillOutlined(context, '#7ad45a', '#2a7a3a', cy - ry, cy + ry);
        context.fillStyle = '#f4ffc8';
        for (let spine = 0; spine < 5; spine++) { context.beginPath(); context.arc(cx - rx * 0.5 + spine * rx * 0.28, cy - ry * 0.4 + (spine % 2) * ry * 0.5, 0.35, 0, TAU); context.fill(); }
      };
      pad(12, 26, 6, 6.5, 0);
      pad(6.5, 16, 4.6, 5.6, -0.4);
      pad(17.5, 13, 4.6, 5.6, 0.4);
      pad(11.5, 5.5, 3.6, 4.6, 0.1);
      for (const [x, y] of [[5, 9.4], [17.6, 6.6], [11.5, 1.2], [21, 9.6]]) {
        context.beginPath(); context.ellipse(x, y, 1.5, 2, 0, 0, TAU); fillOutlined(context, '#ff6a86', '#c82a58', y - 2, y + 2, 0.7);
      }
    }
  },
  sombrilla: {
    width: 32, height: 32,
    paint(context) {
      context.fillStyle = '#4a4a54'; context.fillRect(15.2, 9, 1.6, 23);
      // Toalla.
      context.beginPath(); context.roundRect ? context.roundRect(3, 28, 26, 4, 1.4) : context.rect(3, 28, 26, 4);
      fillOutlined(context, '#7ad8ff', '#2a96d8', 28, 32, 0.8);
      for (let stripe = 6; stripe < 28; stripe += 6) { context.fillStyle = 'rgba(255,255,255,0.7)'; context.fillRect(stripe, 28.4, 2.4, 3.2); }
      // Sombrilla de gajos rojos y blancos.
      for (let segment = 0; segment < 6; segment++) {
        const a0 = Math.PI + segment * Math.PI / 6;
        const a1 = a0 + Math.PI / 6;
        context.beginPath(); context.moveTo(16, 10); context.arc(16, 10, 14.5, a0, a1); context.closePath();
        context.fillStyle = segment % 2 ? '#ffffff' : '#ff4a58'; context.fill();
        context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.6; context.stroke();
      }
      context.beginPath(); context.arc(16, 10, 14.5, Math.PI, 0); context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 1; context.stroke();
      context.fillStyle = 'rgba(255,255,255,0.35)'; context.beginPath(); context.ellipse(11, 5, 4, 1.2, -0.5, 0, TAU); context.fill();
    }
  },
  naranjo: {
    width: 24, height: 32,
    paint(context) {
      context.beginPath(); context.moveTo(10.5, 32); context.lineTo(11, 17); context.lineTo(13.5, 17); context.lineTo(14, 32); context.closePath();
      fillOutlined(context, '#9a6a3a', '#5a3818', 17, 32);
      for (const [x, y, radius] of [[6.5, 13, 6.5], [17.5, 13, 6.5], [12, 8, 8]]) blob(context, x, y, radius, '#5ec856', '#1f7a36');
      for (const [x, y] of [[6, 11], [16, 6], [11, 14], [18, 14], [9, 6]]) { blob(context, x, y, 1.9, '#ffb030', '#ee6a10'); context.fillStyle = 'rgba(255,255,255,0.5)'; context.beginPath(); context.arc(x - 0.5, y - 0.6, 0.5, 0, TAU); context.fill(); }
    }
  },
  drago: {
    width: 24, height: 32,
    paint(context) {
      context.beginPath(); context.moveTo(9, 32); context.lineTo(10.5, 16); context.lineTo(13.5, 16); context.lineTo(15, 32); context.closePath();
      fillOutlined(context, '#a89888', '#6a5a4c', 16, 32);
      for (const [x1, y1, x2, y2] of [[10.5, 18, 5, 11], [12, 16, 12, 8], [13.5, 18, 19, 11]]) {
        context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 3.4; context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
        context.strokeStyle = '#a89888'; context.lineWidth = 2.2; context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
      }
      for (const [x, y] of [[5, 10], [12, 7], [19, 10]]) {
        for (let leaf = 0; leaf < 7; leaf++) {
          const angle = -Math.PI * 0.95 + leaf * Math.PI * 0.9 / 6;
          context.beginPath(); context.moveTo(x, y); context.quadraticCurveTo(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4 - 1, x + Math.cos(angle) * 7.5, y + Math.sin(angle) * 6.5);
          context.quadraticCurveTo(x + Math.cos(angle) * 3.4, y + Math.sin(angle) * 2.4, x, y);
          fillOutlined(context, '#6ad06a', '#1f7a3a', y - 7, y + 3, 0.6);
        }
      }
    }
  },
  farola: {
    width: 12, height: 48,
    paint(context) {
      context.fillStyle = '#2a2632';
      context.beginPath(); context.roundRect ? context.roundRect(4.8, 10, 2.4, 38, 1) : context.rect(4.8, 10, 2.4, 38); context.fill();
      context.beginPath(); context.roundRect ? context.roundRect(2.6, 44, 6.8, 4, 1.4) : context.rect(2.6, 44, 6.8, 4); context.fill();
      context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.7; context.stroke();
      context.beginPath(); context.moveTo(1, 3.4); context.lineTo(11, 3.4); context.lineTo(8.6, 0); context.lineTo(3.4, 0); context.closePath();
      fillOutlined(context, '#4a4658', '#1c1a24', 0, 3.4, 0.7);
      context.beginPath(); context.roundRect ? context.roundRect(2.4, 3.2, 7.2, 8, 2.8) : context.rect(2.4, 3.2, 7.2, 8);
      fillOutlined(context, '#fff6c8', '#ffd35a', 3, 11, 0.8);
      context.fillStyle = 'rgba(255,255,255,0.7)'; context.beginPath(); context.ellipse(4.4, 6, 0.9, 1.8, 0, 0, TAU); context.fill();
    }
  }
};

/**
 * Devuelve la imagen (alta resolución, con margen) de una decoración de suelo.
 * @param {string} decorationType Clave de DECORATION_PAINTERS.
 * @returns {{image: HTMLCanvasElement, width: number, height: number}|null} `width` y `height` lógicos sin margen.
 */
export function getGroundDecorationImage(decorationType) {
  const painter = DECORATION_PAINTERS[decorationType];
  if (!painter) return null;
  return { image: getOrCreate(decorationType, painter.width, painter.height, painter.paint), width: painter.width, height: painter.height };
}

/**
 * Dibuja una imagen de decoración apoyada en el suelo.
 * @param {CanvasRenderingContext2D} context
 * @param {{image: HTMLCanvasElement, width: number, height: number}} decoration
 * @param {number} x Esquina izquierda lógica (sin margen).
 * @param {number} bottomY Altura lógica del suelo.
 */
export function drawGroundDecoration(context, decoration, x, bottomY) {
  const { image, height } = decoration;
  context.drawImage(image, x - DECORATION_PADDING, bottomY - height - DECORATION_PADDING, image.width / RENDER_SCALE, image.height / RENDER_SCALE);
}

/** Medidas del bar de la meta y posición de su puerta (relativas a su esquina). */
export const BAR_SIZE = Object.freeze({ width: 80, height: 72, doorCenterX: 44 });

/**
 * Devuelve la imagen del "BAR PACO" donde termina cada nivel.
 * @returns {HTMLCanvasElement}
 */
export function getBarImage() {
  return getOrCreate('bar', BAR_SIZE.width, BAR_SIZE.height, context => {
    const round = (x, y, w, h, r) => { context.beginPath(); context.roundRect ? context.roundRect(x, y, w, h, r) : context.rect(x, y, w, h); };
    // Fachada con luz lateral y base oscura.
    round(0, 16, 80, 56, 1);
    fillOutlined(context, '#fff3de', '#e0cba8', 16, 72, 1);
    context.fillStyle = 'rgba(30,12,60,0.18)'; context.fillRect(0, 62, 80, 10);
    // Tejado.
    context.beginPath(); context.moveTo(-3, 17); context.lineTo(6, 4); context.lineTo(74, 4); context.lineTo(83, 17); context.closePath();
    fillOutlined(context, '#e0643a', '#9a3418', 4, 17, 1);
    context.strokeStyle = 'rgba(0,0,0,0.2)'; context.lineWidth = 0.5;
    for (let x = 4; x < 78; x += 5) { context.beginPath(); context.moveTo(x + 1, 5); context.lineTo(x - 2, 16); context.stroke(); }
    // Letrero luminoso.
    round(12, 19, 56, 14, 3); fillOutlined(context, '#ffffff', '#e8e0d0', 19, 33, 1);
    drawText(context, 'BAR PACO', 40, 23.5, '#d41c1c', { align: 'center' });
    // Toldo verde y blanco con festón.
    for (let x = 0; x < 80; x += 8) {
      context.fillStyle = (x / 8) % 2 ? '#ffffff' : '#10b050';
      context.beginPath(); context.moveTo(x, 36); context.lineTo(x + 8, 36); context.lineTo(x + 8, 42); context.quadraticCurveTo(x + 4, 46, x, 42); context.closePath(); context.fill();
    }
    context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.8; context.strokeRect(0, 36, 80, 6);
    // Puerta.
    round(34, 46, 20, 26, 6); fillOutlined(context, '#6a3c1c', '#3a1c0a', 46, 72, 1);
    round(37, 49, 14, 23, 4); context.fillStyle = '#1c0c06'; context.fill();
    context.fillStyle = '#ffd35a'; context.beginPath(); context.arc(49, 61, 0.9, 0, TAU); context.fill();
    // Ventana con botellas.
    round(5, 48, 22, 16, 2); fillOutlined(context, '#bfe6ff', '#6aaee0', 48, 64, 1);
    ['#2c9c3c', '#a8322c', '#2c9c3c', '#e8b848'].forEach((color, index) => { round(8 + index * 4.6, 54, 2.8, 9, 1.2); context.fillStyle = color; context.fill(); context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.5; context.stroke(); });
    context.fillStyle = 'rgba(255,255,255,0.4)'; context.fillRect(6, 49, 5, 1);
    // Farol y maceta.
    round(60, 48, 14, 14, 2); fillOutlined(context, '#6a3c1c', '#3a1c0a', 48, 62, 1);
    round(62, 50, 10, 10, 1.4); fillOutlined(context, '#fff6c8', '#ffd870', 50, 60, 0.6);
    context.fillStyle = '#b8603c'; context.fillRect(60, 66, 12, 6);
    context.fillStyle = '#ff5a7a'; context.beginPath(); context.arc(63, 65, 2, 0, TAU); context.arc(68, 64.4, 2, 0, TAU); context.fill();
  });
}
