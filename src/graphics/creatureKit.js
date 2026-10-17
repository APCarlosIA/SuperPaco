/**
 * @file Herramientas para dibujar criaturas y objetos con formas vectoriales
 * en alta resolución: tubos para brazos y patas, ojos expresivos, elipses con
 * luz y sombra, y el generador de sprites con contorno grueso.
 *
 * Las coordenadas se dan en píxeles lógicos con el origen en la esquina
 * superior izquierda de la caja del personaje y los pies en la última fila.
 */
import { RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { addOutline, applyAmbientGradient, OUTLINE_COLOR } from './hd.js';
import { roundedPath } from './shapes.js';

export const TAU = Math.PI * 2;

/** Margen (px lógicos) que se deja alrededor de cada criatura para alas, antenas y contorno. */
export const CREATURE_PADDING = 4;

/** Aclara (amount > 0) u oscurece (amount < 0) un color `#rrggbb`. */
export function tone(color, amount) {
  const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(color);
  const channels = rgbMatch
    ? [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
    : [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  const shifted = channels.map(value => Math.round(amount > 0 ? value + (255 - value) * amount : value * (1 + amount)));
  return `rgb(${shifted.join(',')})`;
}

/**
 * Convierte un dibujo en un sprite con contorno grueso y degradado ambiental.
 * @param {number} width Ancho lógico de la caja.
 * @param {number} height Alto lógico de la caja.
 * @param {(context: CanvasRenderingContext2D) => void} paint Pinta en coordenadas lógicas.
 * @param {{outline?: number, ambient?: boolean}} [options]
 * @returns {{image: HTMLCanvasElement, padding: number, width: number, height: number}}
 */
export function createCreatureSprite(width, height, paint, { outline = RENDER_SCALE, ambient = true } = {}) {
  const raw = createCanvas((width + CREATURE_PADDING * 2) * RENDER_SCALE, (height + CREATURE_PADDING * 2) * RENDER_SCALE, context => {
    context.scale(RENDER_SCALE, RENDER_SCALE);
    context.translate(CREATURE_PADDING, CREATURE_PADDING);
    context.imageSmoothingEnabled = true;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    paint(context);
  });
  if (ambient) applyAmbientGradient(raw, 0, raw.height);
  const outlined = addOutline(raw, outline, OUTLINE_COLOR);
  return { image: outlined, padding: CREATURE_PADDING + outline / RENDER_SCALE, width, height };
}

/** Tubo con extremos redondos y sombra inferior (patas, brazos, tentáculos). */
export function tube(context, x1, y1, x2, y2, width, color, darkColor = tone(color, -0.35)) {
  context.lineCap = 'round';
  context.strokeStyle = darkColor;
  context.lineWidth = width;
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
  context.strokeStyle = color;
  context.lineWidth = width * 0.7;
  context.beginPath(); context.moveTo(x1 - 0.1, y1 - 0.15); context.lineTo(x2 - 0.1, y2 - 0.15); context.stroke();
}

/** Curva gruesa con sombra (colas, tentáculos, cuellos). */
export function curveTube(context, points, width, color, darkColor = tone(color, -0.35)) {
  const trace = () => {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length - 1; index++) {
      const midX = (points[index][0] + points[index + 1][0]) / 2;
      const midY = (points[index][1] + points[index + 1][1]) / 2;
      context.quadraticCurveTo(points[index][0], points[index][1], midX, midY);
    }
    const last = points[points.length - 1];
    context.lineTo(last[0], last[1]);
  };
  context.lineCap = 'round';
  context.strokeStyle = darkColor; context.lineWidth = width; trace(); context.stroke();
  context.strokeStyle = color; context.lineWidth = width * 0.7; trace(); context.stroke();
}

/** Elipse con degradado radial: luz arriba a la izquierda y sombra abajo a la derecha. */
export function shadedEllipse(context, cx, cy, rx, ry, base, { light = tone(base, 0.4), dark = tone(base, -0.35), rotation = 0 } = {}) {
  const gradient = context.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, Math.min(rx, ry) * 0.1, cx, cy, Math.max(rx, ry) * 1.05);
  gradient.addColorStop(0, light);
  gradient.addColorStop(0.5, base);
  gradient.addColorStop(1, dark);
  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(cx, cy, rx, ry, rotation, 0, TAU);
  context.fill();
}

/** Rectángulo redondeado con degradado lateral (torsos, cajas, ropa). */
export function shadedRect(context, x, y, width, height, radius, base, { light = tone(base, 0.25), dark = tone(base, -0.3), vertical = false } = {}) {
  const gradient = vertical
    ? context.createLinearGradient(0, y, 0, y + height)
    : context.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, light);
  gradient.addColorStop(0.45, base);
  gradient.addColorStop(1, dark);
  context.fillStyle = gradient;
  roundedPath(context, x, y, width, height, radius);
  context.fill();
}

/**
 * Ojo con esclerótica, pupila, brillo y párpado enfadado opcional.
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {{lookX?: number, lookY?: number, angry?: number, pupil?: string, blink?: boolean}} [options]
 *   `angry` inclina un párpado oscuro (positivo = hacia el centro); `blink` cierra el ojo.
 */
export function eye(context, x, y, radius, { lookX = -0.35, lookY = 0.1, angry = 0, pupil = '#140c20', blink = false } = {}) {
  if (blink) {
    context.strokeStyle = pupil;
    context.lineWidth = 0.7;
    context.beginPath(); context.moveTo(x - radius, y); context.quadraticCurveTo(x, y + radius * 0.6, x + radius, y); context.stroke();
    return;
  }
  context.fillStyle = '#ffffff';
  context.beginPath(); context.arc(x, y, radius, 0, TAU); context.fill();
  context.strokeStyle = 'rgba(20,12,32,0.55)';
  context.lineWidth = 0.35;
  context.stroke();
  context.fillStyle = pupil;
  context.beginPath(); context.arc(x + lookX * radius * 0.5, y + lookY * radius * 0.5, radius * 0.55, 0, TAU); context.fill();
  context.fillStyle = 'rgba(255,255,255,0.9)';
  context.beginPath(); context.arc(x + lookX * radius * 0.5 - radius * 0.18, y + lookY * radius * 0.5 - radius * 0.2, radius * 0.17, 0, TAU); context.fill();
  if (angry) {
    context.fillStyle = '#140c20';
    context.beginPath();
    context.moveTo(x - radius * 1.1, y - radius * (0.9 + angry * 0.9));
    context.lineTo(x + radius * 1.1, y - radius * (0.9 - angry * 0.9));
    context.lineTo(x + radius * 1.1, y - radius * 0.1);
    context.lineTo(x - radius * 1.1, y - radius * 0.1);
    context.closePath();
    context.fill();
  }
}

/** Boca: 'smile', 'open' (gritando), 'flat' o 'grin' (dientes). */
export function mouth(context, x, y, width, kind = 'smile', color = '#7a1818') {
  context.strokeStyle = '#140c20';
  context.lineWidth = 0.55;
  if (kind === 'open') {
    context.fillStyle = color;
    context.beginPath(); context.ellipse(x, y + width * 0.15, width * 0.5, width * 0.4, 0, 0, TAU); context.fill(); context.stroke();
    context.fillStyle = '#ff8a8a';
    context.beginPath(); context.ellipse(x, y + width * 0.32, width * 0.3, width * 0.14, 0, 0, TAU); context.fill();
  } else if (kind === 'grin') {
    context.fillStyle = '#ffffff';
    roundedPath(context, x - width / 2, y - width * 0.15, width, width * 0.5, width * 0.2); context.fill(); context.stroke();
    context.beginPath(); context.moveTo(x, y - width * 0.15); context.lineTo(x, y + width * 0.35); context.stroke();
  } else if (kind === 'flat') {
    context.beginPath(); context.moveTo(x - width / 2, y); context.lineTo(x + width / 2, y); context.stroke();
  } else {
    context.beginPath(); context.moveTo(x - width / 2, y - width * 0.1); context.quadraticCurveTo(x, y + width * 0.5, x + width / 2, y - width * 0.1); context.stroke();
  }
}

/** Cinemática inversa de una pierna de dos segmentos (la rodilla se dobla hacia `bend`). */
export function solveLeg(hipX, hipY, footX, footY, thigh, shin, bend = -1) {
  let dx = footX - hipX;
  let dy = footY - hipY;
  let distance = Math.hypot(dx, dy) || 0.001;
  const reach = thigh + shin - 0.02;
  if (distance > reach) {
    footX = hipX + dx * reach / distance;
    footY = hipY + dy * reach / distance;
    dx = footX - hipX; dy = footY - hipY; distance = reach;
  }
  const along = (thigh * thigh - shin * shin + distance * distance) / (2 * distance);
  const lift = Math.sqrt(Math.max(0, thigh * thigh - along * along));
  const ux = dx / distance;
  const uy = dy / distance;
  return { kneeX: hipX + ux * along - uy * lift * bend, kneeY: hipY + uy * along + ux * lift * bend, footX, footY };
}

/** Pierna completa con rodilla; devuelve la posición del pie para poner el calzado. */
export function leg(context, hipX, hipY, footX, footY, thigh, shin, width, color, bend = -1) {
  const { kneeX, kneeY, footX: endX, footY: endY } = solveLeg(hipX, hipY, footX, footY, thigh, shin, bend);
  tube(context, hipX, hipY, kneeX, kneeY, width, color);
  tube(context, kneeX, kneeY, endX, endY, width * 0.92, color);
  return { x: endX, y: endY };
}

/** Zapato o pezuña ovalado en un punto. */
export function shoe(context, x, y, length, color, { tilt = 0 } = {}) {
  context.save();
  context.translate(x, y);
  context.rotate(tilt);
  shadedEllipse(context, -length * 0.15, 0, length * 0.55, length * 0.3, color);
  context.restore();
}

/** Brillo blanco semitransparente (reflejos sobre superficies). */
export function sheen(context, x, y, rx, ry, rotation = -0.4, opacity = 0.55) {
  context.fillStyle = `rgba(255,255,255,${opacity})`;
  context.beginPath();
  context.ellipse(x, y, rx, ry, rotation, 0, TAU);
  context.fill();
}

/** Estrella de cuatro puntas (destellos, brillos de monedas). */
export function sparkle(context, x, y, radius, color = '#ffffff') {
  context.beginPath();
  for (let point = 0; point < 8; point++) {
    const angle = point * Math.PI / 4;
    const length = point % 2 ? radius * 0.25 : radius;
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
}
