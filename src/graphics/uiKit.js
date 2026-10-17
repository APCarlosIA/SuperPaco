/**
 * @file Elementos de interfaz con acabado moderno: paneles de cristal,
 * fondos animados, cinta con la bandera, título con rebote y la transición
 * de iris al cambiar de pantalla.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config/constants.js';
import { OUTLINE_COLOR } from './hd.js';

const TAU = Math.PI * 2;

/** Camino de un rectángulo con esquinas redondeadas. */
function roundedPath(context, x, y, width, height, radius) {
  context.beginPath();
  if (context.roundRect) context.roundRect(x, y, width, height, radius);
  else context.rect(x, y, width, height);
}

/**
 * Panel translúcido tipo cristal con borde y reflejo.
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {Object} [options]
 * @param {number} [options.radius]
 * @param {string} [options.top] Color de arriba.
 * @param {string} [options.bottom] Color de abajo.
 * @param {string} [options.border] Color del borde claro.
 */
export function drawPanel(context, x, y, width, height, { radius = 5, top = 'rgba(52,42,96,0.88)', bottom = 'rgba(14,9,36,0.92)', border = 'rgba(255,255,255,0.28)' } = {}) {
  roundedPath(context, x, y, width, height, radius);
  const gradient = context.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = OUTLINE_COLOR;
  context.lineWidth = 1.2;
  context.stroke();
  roundedPath(context, x + 0.9, y + 0.9, width - 1.8, height - 1.8, Math.max(1, radius - 1));
  context.strokeStyle = border;
  context.lineWidth = 0.5;
  context.stroke();
  context.fillStyle = 'rgba(255,255,255,0.08)';
  roundedPath(context, x + 1.5, y + 1.5, width - 3, height * 0.38, Math.max(1, radius - 1.5));
  context.fill();
}

/**
 * Fondo de pantalla animado: degradado oscuro con motas de luz que flotan.
 * @param {CanvasRenderingContext2D} context
 * @param {number} stepCounter
 * @param {{top?: string, bottom?: string, accent?: string}} [palette]
 */
export function drawBackdrop(context, stepCounter, { top = '#241a4a', bottom = '#07040f', accent = '#ffd84a' } = {}) {
  const gradient = context.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  context.save();
  context.globalCompositeOperation = 'lighter';
  for (let mote = 0; mote < 46; mote++) {
    const speed = 0.08 + (mote % 5) * 0.035;
    const x = (mote * 53.3 + stepCounter * speed) % (SCREEN_WIDTH + 24) - 12;
    const y = (mote * 37.7 + Math.sin(stepCounter / 70 + mote) * 9) % SCREEN_HEIGHT;
    const radius = 1.2 + (mote % 4) * 0.9;
    const pulse = 0.5 + 0.5 * Math.sin(stepCounter / 30 + mote * 1.7);
    const glow = context.createRadialGradient(x, y, 0, x, y, radius * 4);
    glow.addColorStop(0, mote % 3 ? `rgba(255,255,255,${0.35 * pulse})` : hexToRgba(accent, 0.5 * pulse));
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = glow;
    context.fillRect(x - radius * 4, y - radius * 4, radius * 8, radius * 8);
  }
  context.restore();
  const vignette = context.createRadialGradient(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT * 0.3, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT * 0.95);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

/** Convierte "#rrggbb" y una opacidad en un color CSS rgba. */
function hexToRgba(color, opacity) {
  const channels = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  return `rgba(${channels[0]},${channels[1]},${channels[2]},${opacity})`;
}

/**
 * Cinta ondulante con los colores de la bandera de España.
 * @param {CanvasRenderingContext2D} context
 * @param {number} top Borde superior de la cinta.
 * @param {number} height Alto de la cinta.
 * @param {number} stepCounter
 */
export function drawFlagBanner(context, top, height, stepCounter) {
  const waveAt = x => Math.sin(stepCounter / 28 + x / 38) * 2.2;
  const bandPath = (from, to) => {
    context.beginPath();
    for (let x = 0; x <= SCREEN_WIDTH; x += 4) context.lineTo(x, top + from * height + waveAt(x));
    for (let x = SCREEN_WIDTH; x >= 0; x -= 4) context.lineTo(x, top + to * height + waveAt(x));
    context.closePath();
  };
  // Sombra bajo la cinta.
  context.save();
  context.translate(0, 3);
  bandPath(0, 1);
  context.fillStyle = 'rgba(0,0,0,0.35)';
  context.fill();
  context.restore();
  for (const [from, to, color, light] of [[0, 0.25, '#c8102e', '#ff4a5a'], [0.25, 0.75, '#ffc400', '#fff07a'], [0.75, 1, '#c8102e', '#8a0a20']]) {
    bandPath(from, to);
    const gradient = context.createLinearGradient(0, top + from * height, 0, top + to * height);
    gradient.addColorStop(0, light);
    gradient.addColorStop(0.4, color);
    gradient.addColorStop(1, color);
    context.fillStyle = gradient;
    context.fill();
  }
  context.strokeStyle = OUTLINE_COLOR;
  context.lineWidth = 1.4;
  bandPath(0, 1);
  context.stroke();
  // Brillo que recorre la cinta.
  const shineX = ((stepCounter * 2.4) % (SCREEN_WIDTH + 160)) - 80;
  const shine = context.createLinearGradient(shineX - 30, 0, shineX + 30, 0);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.28)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  bandPath(0, 1);
  context.fillStyle = shine;
  context.fill();
}

/**
 * Transición de iris: la pantalla se abre desde el centro como un círculo.
 * @param {CanvasRenderingContext2D} context
 * @param {number} progress De 0 (todo negro) a 1 (todo visible).
 */
export function drawIrisOpening(context, progress) {
  if (progress >= 1) return;
  const eased = 1 - Math.pow(1 - progress, 3);
  const maxRadius = Math.hypot(SCREEN_WIDTH, SCREEN_HEIGHT) / 2;
  context.save();
  context.beginPath();
  context.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  context.arc(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, Math.max(0.01, eased * maxRadius), 0, TAU, true);
  context.fillStyle = '#07040f';
  context.fill('evenodd');
  context.restore();
}
