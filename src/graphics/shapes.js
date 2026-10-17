/**
 * @file Formas vectoriales con contorno oscuro y degradado, y resplandores
 * aditivos. Las usan los decorados, enemigos y efectos para tener todos el
 * mismo aspecto de dibujo animado.
 */
import { OUTLINE_COLOR } from './hd.js';

/** Camino de un rectángulo con esquinas redondeadas (compatible con navegadores sin roundRect). */
export function roundedPath(context, x, y, width, height, radius) {
  context.beginPath();
  if (context.roundRect) context.roundRect(x, y, width, height, radius);
  else context.rect(x, y, width, height);
}

/**
 * Rellena el camino actual con un degradado vertical y le dibuja el contorno oscuro.
 * @param {CanvasRenderingContext2D} context
 * @param {string} topColor
 * @param {string} bottomColor
 * @param {number} top Altura donde empieza el degradado.
 * @param {number} bottom Altura donde termina.
 * @param {number} [lineWidth]
 */
export function fillWithOutline(context, topColor, bottomColor, top, bottom, lineWidth = 0.8) {
  const gradient = context.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = OUTLINE_COLOR;
  context.lineWidth = lineWidth;
  context.lineJoin = 'round';
  context.stroke();
}

/** Círculo con degradado y contorno. */
export function outlinedCircle(context, x, y, radius, topColor, bottomColor, lineWidth = 0.8) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  fillWithOutline(context, topColor, bottomColor, y - radius, y + radius, lineWidth);
}

/**
 * Resplandor aditivo circular.
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {string} rgb Componentes "r, g, b" del color.
 * @param {number} intensity Opacidad en el centro (0 a 1).
 */
export function addGlow(context, x, y, radius, rgb, intensity) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb}, ${intensity})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
}
