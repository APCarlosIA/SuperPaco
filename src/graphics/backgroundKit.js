/**
 * @file Herramientas de dibujo para los fondos en alta resolución: mezcla de
 * colores, degradados, colinas que encajan al repetirse, edificios con luz y
 * sombra, resplandores y neblina.
 *
 * Todas las funciones reciben un contexto que ya está ampliado a RENDER_SCALE,
 * así que se dibuja en píxeles lógicos (con decimales) y sale suave.
 */
import { BACKGROUND_LAYER_WIDTH } from './backgroundConstants.js';

export const TAU = Math.PI * 2;

/** Convierte "#rrggbb", "#rgb" o "rgb(r,g,b)" en [r, g, b]. */
function parseHex(color) {
  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(color);
  if (rgbMatch) return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(character => character + character).join('');
  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
}

/** Mezcla dos colores `#rrggbb` (t = 0 da `first`, t = 1 da `second`). */
export function mix(first, second, t) {
  const a = parseHex(first);
  const b = parseHex(second);
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * t)).join(',')})`;
}

/** Aclara (amount > 0) u oscurece (amount < 0) un color `#rrggbb`. */
export function shade(color, amount) {
  return amount >= 0 ? mix(color, '#ffffff', amount) : mix(color, '#000000', -amount);
}

/** Color `#rrggbb` con transparencia. */
export function alpha(color, opacity) {
  const [r, g, b] = parseHex(color);
  return `rgba(${r},${g},${b},${opacity})`;
}

/** Degradado lineal con paradas [[posición, color], …]. */
export function linearGradient(context, x0, y0, x1, y1, stops) {
  const gradient = context.createLinearGradient(x0, y0, x1, y1);
  for (const [position, color] of stops) gradient.addColorStop(position, color);
  return gradient;
}

/**
 * Dibuja `draw(x)` en `x` y, si el objeto cruza el borde de la capa, también
 * desplazado un ancho de capa, para que la capa repetida no tenga costuras.
 */
export function wrapDraw(context, x, width, draw) {
  for (const offset of [-BACKGROUND_LAYER_WIDTH, 0, BACKGROUND_LAYER_WIDTH]) {
    if (x + offset + width > -4 && x + offset < BACKGROUND_LAYER_WIDTH + 4) draw(x + offset);
  }
}

/** Camino con las esquinas redondeadas. */
export function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

/**
 * Colina o cordillera que se repite sin costuras (suma de ondas con un número
 * entero de periodos a lo ancho de la capa).
 * @param {CanvasRenderingContext2D} context
 * @param {Object} options
 * @param {number} options.baseY Altura media de la cresta.
 * @param {number} options.amplitude Altura de las ondulaciones.
 * @param {number} options.periods Periodos enteros a lo ancho.
 * @param {number} [options.phase]
 * @param {string|CanvasGradient} options.fill
 * @param {number} [options.bottom] Hasta dónde se rellena.
 * @param {number} [options.sharpness] 0 = colinas suaves, 1 = picos.
 * @param {string} [options.rim] Color de la línea de luz de la cresta.
 */
export function ridge(context, { baseY, amplitude, periods, phase = 0, fill, bottom = 260, sharpness = 0, rim = null }) {
  const point = x => {
    const t = x / BACKGROUND_LAYER_WIDTH;
    let wave = 0.55 * Math.sin(TAU * periods * t + phase) + 0.3 * Math.sin(TAU * (periods * 2 + 1) * t + phase * 1.7) + 0.15 * Math.sin(TAU * (periods * 5 + 2) * t + phase * 0.6);
    if (sharpness) wave = wave * (1 - sharpness) + (1 - Math.abs(Math.sin(TAU * periods * t + phase))) * sharpness * 1.6 - sharpness * 0.4;
    return baseY - amplitude * wave;
  };
  context.beginPath();
  context.moveTo(0, bottom);
  for (let x = 0; x <= BACKGROUND_LAYER_WIDTH; x += 2) context.lineTo(x, point(x));
  context.lineTo(BACKGROUND_LAYER_WIDTH, bottom);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  if (rim) {
    context.beginPath();
    for (let x = 0; x <= BACKGROUND_LAYER_WIDTH; x += 2) (x ? context.lineTo(x, point(x)) : context.moveTo(x, point(x)));
    context.strokeStyle = rim;
    context.lineWidth = 0.9;
    context.stroke();
  }
  return point;
}

/** Neblina: degradado vertical de un color que se desvanece. */
export function haze(context, topY, bottomY, color, topOpacity, bottomOpacity) {
  context.fillStyle = linearGradient(context, 0, topY, 0, bottomY, [[0, alpha(color, topOpacity)], [1, alpha(color, bottomOpacity)]]);
  context.fillRect(0, topY, BACKGROUND_LAYER_WIDTH, bottomY - topY);
}

/** Resplandor circular que se suma a lo que hay debajo. */
export function glow(context, x, y, radius, color, intensity = 0.6) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, alpha(color, intensity));
  gradient.addColorStop(1, alpha(color, 0));
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
}

/** Contorno suave de un camino ya construido, en un tono más oscuro del relleno. */
export function strokeSoft(context, color, width = 0.8, amount = -0.5) {
  context.strokeStyle = shade(color, amount);
  context.lineWidth = width;
  context.lineJoin = 'round';
  context.stroke();
}

/**
 * Cuerpo de un edificio con luz de la izquierda, sombra a la derecha, cornisa y contorno.
 * Devuelve las medidas útiles para colocar ventanas.
 */
export function buildingBody(context, { x, y, width, height, color, outline = true, roof = 'flat', roofColor = '#8c4c30', cornice = true }) {
  context.fillStyle = linearGradient(context, x, 0, x + width, 0, [[0, shade(color, 0.14)], [0.55, color], [1, shade(color, -0.2)]]);
  context.fillRect(x, y, width, height);
  // Sombra de ambiente en la base y luz arriba.
  context.fillStyle = linearGradient(context, 0, y, 0, y + height, [[0, 'rgba(255,255,255,0.1)'], [0.35, 'rgba(255,255,255,0)'], [1, 'rgba(10,6,30,0.28)']]);
  context.fillRect(x, y, width, height);
  if (roof === 'tile') {
    context.beginPath();
    context.moveTo(x - 2, y + 1);
    context.lineTo(x + width * 0.2, y - 10);
    context.lineTo(x + width * 0.8, y - 10);
    context.lineTo(x + width + 2, y + 1);
    context.closePath();
    context.fillStyle = linearGradient(context, 0, y - 10, 0, y + 1, [[0, shade(roofColor, 0.15)], [1, shade(roofColor, -0.25)]]);
    context.fill();
    if (outline) strokeSoft(context, roofColor);
    context.strokeStyle = 'rgba(0,0,0,0.18)';
    context.lineWidth = 0.4;
    for (let tileX = x + 2; tileX < x + width; tileX += 3) { context.beginPath(); context.moveTo(tileX, y - 9); context.lineTo(tileX - 1.5, y); context.stroke(); }
  } else if (cornice) {
    context.fillStyle = shade(color, -0.3);
    context.fillRect(x - 1, y - 2.5, width + 2, 3);
    context.fillStyle = shade(color, 0.25);
    context.fillRect(x - 1, y - 2.5, width + 2, 0.8);
  }
  if (outline) {
    context.strokeStyle = shade(color, -0.55);
    context.lineWidth = 0.9;
    context.strokeRect(x, y, width, height);
  }
}

/** Ventana con marco, cristal degradado y, si está encendida, un resplandor. */
export function windowPane(context, x, y, width, height, { glass = '#3c4c7c', frame = '#f2e6d0', lit = false, arched = false, sill = true }) {
  context.fillStyle = frame;
  if (arched) { context.beginPath(); context.moveTo(x - 0.6, y + height + 0.6); context.lineTo(x - 0.6, y + width / 2); context.arc(x + width / 2, y + width / 2, width / 2 + 0.6, Math.PI, 0); context.lineTo(x + width + 0.6, y + height + 0.6); context.closePath(); context.fill(); }
  else context.fillRect(x - 0.6, y - 0.6, width + 1.2, height + 1.2);
  context.fillStyle = linearGradient(context, 0, y, 0, y + height, [[0, shade(glass, 0.25)], [1, glass]]);
  if (arched) { context.beginPath(); context.moveTo(x, y + height); context.lineTo(x, y + width / 2); context.arc(x + width / 2, y + width / 2, width / 2, Math.PI, 0); context.lineTo(x + width, y + height); context.closePath(); context.fill(); }
  else context.fillRect(x, y, width, height);
  context.fillStyle = 'rgba(255,255,255,0.28)';
  context.fillRect(x + 0.4, y + (arched ? width / 2 : 0.4), width * 0.35, height * 0.35);
  if (sill) { context.fillStyle = shade(frame, -0.25); context.fillRect(x - 1, y + height + 0.4, width + 2, 0.9); }
  if (lit) glow(context, x + width / 2, y + height / 2, Math.max(width, height) * 1.4, '#ffd070', 0.4);
}

/** Nube suave formada por círculos con degradado de luz. */
export function softCloud(context, x, y, scale, { top = '#ffffff', bottom = '#c8d8f0', opacity = 1 } = {}) {
  context.save();
  context.globalAlpha = opacity;
  const puffs = [[0, 0, 11], [11, -4, 14], [24, 0, 12], [35, 3, 9], [-9, 4, 8]];
  for (const [offsetX, offsetY, radius] of puffs) {
    const centerX = x + offsetX * scale;
    const centerY = y + offsetY * scale;
    const gradient = context.createLinearGradient(0, centerY - radius * scale, 0, centerY + radius * scale);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, radius * scale, 0, TAU);
    context.fill();
  }
  context.restore();
}

/** Árbol redondeado con tronco, copa con luz y sombra. */
export function roundTree(context, x, groundY, height, { trunk = '#6a4426', leaves = '#3f9a47', outline = true } = {}) {
  const trunkHeight = height * 0.45;
  context.fillStyle = trunk;
  context.fillRect(x - 1.3, groundY - trunkHeight, 2.6, trunkHeight);
  const crownRadius = height * 0.34;
  const crownY = groundY - trunkHeight - crownRadius * 0.55;
  for (const [offsetX, offsetY, factor] of [[-0.55, 0.35, 0.78], [0.6, 0.3, 0.8], [0, -0.1, 1]]) {
    const cx = x + offsetX * crownRadius;
    const cy = crownY + offsetY * crownRadius;
    const r = crownRadius * factor;
    context.beginPath();
    context.arc(cx, cy, r, 0, TAU);
    context.fillStyle = linearGradient(context, cx - r, cy - r, cx + r, cy + r, [[0, shade(leaves, 0.25)], [0.5, leaves], [1, shade(leaves, -0.35)]]);
    context.fill();
    if (outline) strokeSoft(context, leaves, 0.7, -0.55);
  }
}

/** Palmera con tronco curvo y hojas largas. */
export function palmTree(context, x, groundY, height, lean = 6, { leaves = '#2f9a4a', trunk = '#9a6a38' } = {}) {
  const topX = x + lean;
  const topY = groundY - height;
  context.strokeStyle = shade(trunk, -0.45);
  context.lineWidth = 3.6;
  context.lineCap = 'round';
  context.beginPath(); context.moveTo(x, groundY); context.quadraticCurveTo(x - lean * 0.2, groundY - height * 0.55, topX, topY); context.stroke();
  context.strokeStyle = trunk;
  context.lineWidth = 2.6;
  context.beginPath(); context.moveTo(x, groundY); context.quadraticCurveTo(x - lean * 0.2, groundY - height * 0.55, topX, topY); context.stroke();
  context.strokeStyle = shade(trunk, -0.3);
  context.lineWidth = 0.5;
  for (let ring = 1; ring < 9; ring++) {
    const t = ring / 9;
    const ringX = x + (topX - x) * t * t - lean * 0.2 * 2 * t * (1 - t);
    const ringY = groundY - height * t;
    context.beginPath(); context.moveTo(ringX - 1.2, ringY); context.lineTo(ringX + 1.2, ringY - 0.5); context.stroke();
  }
  const fronds = 8;
  for (let frond = 0; frond < fronds; frond++) {
    const angle = -Math.PI + (frond + 0.5) * Math.PI / fronds;
    const length = 17 + (frond % 2) * 4;
    const endX = topX + Math.cos(angle) * length;
    const endY = topY + Math.sin(angle) * length * 0.55 + length * 0.42;
    const controlX = topX + Math.cos(angle) * length * 0.55;
    const controlY = topY + Math.sin(angle) * length * 0.55 - 5;
    context.beginPath();
    context.moveTo(topX, topY);
    context.quadraticCurveTo(controlX, controlY - 2.2, endX, endY);
    context.quadraticCurveTo(controlX, controlY + 2.4, topX, topY);
    context.fillStyle = linearGradient(context, topX, topY - 8, topX, topY + 10, [[0, shade(leaves, 0.2)], [1, shade(leaves, -0.3)]]);
    context.fill();
    strokeSoft(context, leaves, 0.6, -0.55);
  }
  context.fillStyle = '#5a3a1c';
  context.beginPath(); context.arc(topX - 1, topY + 1.5, 1.4, 0, TAU); context.arc(topX + 1.4, topY + 1.8, 1.2, 0, TAU); context.fill();
}

/** Polígono relleno a partir de una lista de puntos [x, y]. */
export function polygon(context, points, fill, outlineAmount = null) {
  context.beginPath();
  points.forEach(([px, py], index) => (index ? context.lineTo(px, py) : context.moveTo(px, py)));
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  if (outlineAmount !== null) strokeSoft(context, typeof fill === 'string' && fill[0] === '#' ? fill : '#808080', 0.8, outlineAmount);
}
