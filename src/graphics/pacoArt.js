/**
 * @file Dibujo vectorial de Paco en alta resolución.
 *
 * Paco no se dibuja con un mapa de píxeles: se pinta con formas (cápsulas
 * para brazos y piernas, elipses para la cabeza…) siguiendo un esqueleto
 * sencillo. Así se pueden generar muchos fotogramas de animación (ciclos de
 * andar y correr, saltos, derrape) con un acabado limpio y moderno: contorno
 * grueso, sombreado de dibujos animados y proporciones exageradas.
 *
 * Las coordenadas se dan en píxeles lógicos con la esquina inferior izquierda
 * de la "caja" de Paco en (0, altura). Las imágenes se pintan a RENDER_SCALE
 * veces ese tamaño y se les añade el contorno al final.
 */
import { RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { addOutline, applyAmbientGradient, OUTLINE_COLOR } from './hd.js';

/** Margen alrededor de la caja de Paco para brazos, chanclas y contorno (píxeles lógicos). */
export const PACO_PADDING = 5;

/** Colores de cada variante del chándal. */
export const PACO_PALETTES = Object.freeze({
  normal: { jacket: '#e2301c', jacketLight: '#ff6244', jacketDark: '#9c1a10', stripe: '#ffd51c', pants: '#2a3a96', pantsDark: '#19225e', beret: '#201a2a' },
  spicy: { jacket: '#0eae4a', jacketLight: '#4ee27c', jacketDark: '#07692c', stripe: '#e8341c', pants: '#1f6a34', pantsDark: '#124020', beret: '#201a2a' },
  sugarRushGold: { jacket: '#ffd51c', jacketLight: '#fff07a', jacketDark: '#c88a08', stripe: '#fc7c00', pants: '#d05a08', pantsDark: '#8a3a04', beret: '#a83a08' },
  sugarRushWhite: { jacket: '#fcfcfc', jacketLight: '#ffffff', jacketDark: '#b4bcd0', stripe: '#3cbcfc', pants: '#2a58f0', pantsDark: '#1a3a9a', beret: '#a81c10' }
});

const SKIN = { base: '#fdbb8a', light: '#ffd9b8', dark: '#e08a62' };
const HAIR = '#6a3a1c';
const SHOE = { base: '#b8662a', dark: '#6e3412', strap: '#ffd51c' };

/** Medidas del cuerpo pequeño y grande (píxeles lógicos). */
const BODY = Object.freeze({
  small: { height: 16, headY: 4.5, headWidth: 7.4, headHeight: 6.5, shoulderY: 8.2, hipY: 11.3, torsoWidth: 5.8, thigh: 2.4, shin: 2.4, limbWidth: 2.0, armLength: 3.6 },
  big: { height: 32, headY: 7.2, headWidth: 9.6, headHeight: 8.4, shoulderY: 14.6, hipY: 23.4, torsoWidth: 8, thigh: 4.4, shin: 4.4, limbWidth: 2.9, armLength: 7.4 }
});

/** Dibuja un rectángulo con las esquinas redondeadas. */
function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

/** Cápsula (tubo con extremos redondos) con sombra en la parte inferior. */
function drawTube(context, x1, y1, x2, y2, width, color, darkColor) {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = darkColor;
  context.lineWidth = width;
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
  context.strokeStyle = color;
  context.lineWidth = width * 0.72;
  context.beginPath(); context.moveTo(x1 - 0.12, y1 - 0.16); context.lineTo(x2 - 0.12, y2 - 0.16); context.stroke();
}

/** Calcula la rodilla de una pierna de dos segmentos que llega hasta el pie (cinemática inversa). */
function solveKnee(hipX, hipY, footX, footY, thigh, shin, bendDirection) {
  let dx = footX - hipX;
  let dy = footY - hipY;
  let distance = Math.hypot(dx, dy);
  const maxReach = thigh + shin - 0.02;
  if (distance > maxReach) {
    footX = hipX + dx * maxReach / distance;
    footY = hipY + dy * maxReach / distance;
    dx = footX - hipX; dy = footY - hipY; distance = maxReach;
  }
  const along = (thigh * thigh - shin * shin + distance * distance) / (2 * distance);
  const lift = Math.sqrt(Math.max(0, thigh * thigh - along * along));
  const ux = dx / distance;
  const uy = dy / distance;
  return { kneeX: hipX + ux * along + -uy * lift * bendDirection, kneeY: hipY + uy * along + ux * lift * bendDirection, footX, footY };
}

/** Pierna completa: muslo, pantorrilla y chancla. */
function drawLeg(context, body, palette, hipX, footTarget, tilt, isBack) {
  const hipY = body.hipY;
  const { kneeX, kneeY, footX, footY } = solveKnee(hipX, hipY, footTarget.x, footTarget.y, body.thigh, body.shin, 1);
  const pants = isBack ? palette.pantsDark : palette.pants;
  const dark = isBack ? '#0e1236' : palette.pantsDark;
  drawTube(context, hipX, hipY, kneeX, kneeY, body.limbWidth, pants, dark);
  drawTube(context, kneeX, kneeY, footX, footY - 0.5, body.limbWidth * 0.92, pants, dark);
  // Chancla.
  context.save();
  context.translate(footX + 0.9, footY - 0.35);
  context.rotate(tilt);
  context.fillStyle = isBack ? '#7a4018' : SHOE.base;
  context.beginPath(); context.ellipse(0, 0, body.limbWidth * 0.95 + 0.6, 1.05, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = SHOE.dark;
  context.beginPath(); context.ellipse(0, 0.55, body.limbWidth * 0.95 + 0.6, 0.55, 0, 0, Math.PI); context.fill();
  context.fillStyle = SHOE.strap;
  context.fillRect(-0.4, -1.0, 1.0, 0.8);
  context.restore();
}

/** Brazo con manga del chándal y mano. */
function drawArm(context, body, palette, shoulderX, shoulderY, angle, bend, isBack) {
  const upper = body.armLength * 0.52;
  const lower = body.armLength * 0.52;
  const elbowX = shoulderX + Math.sin(angle) * upper;
  const elbowY = shoulderY + Math.cos(angle) * upper;
  const handAngle = angle + bend;
  const handX = elbowX + Math.sin(handAngle) * lower;
  const handY = elbowY + Math.cos(handAngle) * lower;
  const sleeve = isBack ? palette.jacketDark : palette.jacket;
  const sleeveDark = isBack ? '#5e0e08' : palette.jacketDark;
  drawTube(context, shoulderX, shoulderY, elbowX, elbowY, body.limbWidth * 0.95, sleeve, sleeveDark);
  drawTube(context, elbowX, elbowY, handX, handY, body.limbWidth * 0.85, sleeve, sleeveDark);
  context.fillStyle = isBack ? SKIN.dark : SKIN.base;
  context.beginPath(); context.arc(handX, handY + 0.2, body.limbWidth * 0.5, 0, Math.PI * 2); context.fill();
}

/** Torso del chándal con la franja amarilla central. */
function drawTorso(context, body, palette, centerX, lean) {
  const top = body.shoulderY - 1.0;
  const bottom = body.hipY + 0.6;
  context.save();
  context.translate(centerX, bottom);
  context.rotate(lean);
  context.translate(-centerX, -bottom);
  const gradient = context.createLinearGradient(centerX - body.torsoWidth / 2, 0, centerX + body.torsoWidth / 2, 0);
  gradient.addColorStop(0, palette.jacketLight);
  gradient.addColorStop(0.35, palette.jacket);
  gradient.addColorStop(1, palette.jacketDark);
  context.fillStyle = gradient;
  roundedRectPath(context, centerX - body.torsoWidth / 2, top, body.torsoWidth, bottom - top, 1.9);
  context.fill();
  // Franja amarilla y cremallera.
  context.fillStyle = palette.stripe;
  context.fillRect(centerX - 0.9, top + 0.2, 1.8, bottom - top - 0.2);
  context.fillStyle = 'rgba(20, 12, 32, 0.45)';
  context.fillRect(centerX - 0.12, top + 0.2, 0.24, bottom - top - 0.2);
  // Cuello alto del chándal.
  context.fillStyle = palette.jacketDark;
  roundedRectPath(context, centerX - 2.1, top - 0.5, 4.2, 1.5, 0.7);
  context.fill();
  // Cinturilla del pantalón.
  context.fillStyle = palette.pantsDark;
  context.fillRect(centerX - body.torsoWidth / 2 + 0.4, bottom - 0.9, body.torsoWidth - 0.8, 1.1);
  context.restore();
}

/** Cabeza: cara, boina negra, gafas de sol y bigote. Se diseña en unidades de la cabeza grande y se escala. */
function drawHead(context, body, palette, centerX, centerY, mood, tilt) {
  const width = 9.6;
  const height = 8.4;
  context.save();
  context.translate(centerX, centerY);
  context.scale(body.headWidth / width, body.headWidth / width);
  context.rotate(tilt);
  // Oreja y patilla.
  context.fillStyle = SKIN.dark;
  context.beginPath(); context.ellipse(-width * 0.4, 0.8, 1.1, 1.5, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = HAIR;
  roundedRectPath(context, -width * 0.5, -1.6, 1.7, 3.8, 0.8); context.fill();
  // Cara con degradado.
  const face = context.createRadialGradient(-width * 0.12, -height * 0.18, 0.5, 0, 0, width * 0.7);
  face.addColorStop(0, SKIN.light);
  face.addColorStop(0.55, SKIN.base);
  face.addColorStop(1, SKIN.dark);
  context.fillStyle = face;
  context.beginPath(); context.ellipse(0, 0.5, width / 2, height / 2 - 0.2, 0, 0, Math.PI * 2); context.fill();
  // Nariz.
  context.fillStyle = SKIN.dark;
  context.beginPath(); context.ellipse(width * 0.47, 1.2, 1.1, 0.95, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = SKIN.base;
  context.beginPath(); context.ellipse(width * 0.45, 1.0, 0.9, 0.75, 0, 0, Math.PI * 2); context.fill();
  // Gafas de sol.
  context.fillStyle = '#0b0912';
  roundedRectPath(context, -width * 0.18, -1.7, width * 0.74, 2.9, 1.2); context.fill();
  context.fillRect(-width * 0.5, -1.1, width * 0.34, 0.8);
  context.fillStyle = 'rgba(255,255,255,0.92)';
  context.beginPath(); context.ellipse(-width * 0.01, -0.95, 0.8, 0.32, -0.5, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(width * 0.39, -0.95, 0.7, 0.3, -0.5, 0, Math.PI * 2); context.fill();
  // Bigote y boca.
  context.fillStyle = '#4a2410';
  roundedRectPath(context, width * 0.08, 2.1, width * 0.38, 1.0, 0.5); context.fill();
  if (mood === 'open') {
    context.fillStyle = '#7a1818';
    context.beginPath(); context.ellipse(width * 0.27, 3.7, 1.15, 0.9, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#ff8a8a';
    context.beginPath(); context.ellipse(width * 0.27, 4.0, 0.7, 0.35, 0, 0, Math.PI * 2); context.fill();
  } else {
    context.fillStyle = '#8a3a2a';
    roundedRectPath(context, width * 0.1, 3.5, width * 0.3, 0.6, 0.3); context.fill();
  }
  // Boina ladeada con rabito.
  context.fillStyle = palette.beret;
  context.beginPath();
  context.ellipse(-width * 0.08, -height * 0.38, width * 0.58, height * 0.2, -0.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(255,255,255,0.22)';
  context.beginPath(); context.ellipse(-width * 0.2, -height * 0.45, width * 0.28, height * 0.06, -0.22, 0, Math.PI * 2); context.fill();
  context.fillStyle = palette.beret;
  roundedRectPath(context, -width * 0.1, -height * 0.64, 1.3, 1.1, 0.5); context.fill();
  context.restore();
}

/**
 * Parámetros del esqueleto para cada postura.
 * `phase` (0 a 1) recorre el ciclo de andar o correr.
 * @returns {Object}
 */
function describePose(pose, body) {
  const walkMatch = /^(walk|run)(\d)$/.exec(pose);
  const base = { bob: 0, lean: 0, headTilt: 0, mood: 'smile', backArm: [0.2, 0.1], frontArm: [-0.2, 0.1], backFoot: null, frontFoot: null, squashX: 1, squashY: 1 };
  const groundY = body.height - 0.2;
  const hipX = 8;
  if (walkMatch) {
    const isRun = walkMatch[1] === 'run';
    const phase = (Number(walkMatch[2]) - 1) / 8;
    const angle = phase * Math.PI * 2;
    const stride = isRun ? body.thigh * 1.15 : body.thigh * 0.9;
    const lift = isRun ? body.shin * 0.9 : body.shin * 0.5;
    const footAt = offsetAngle => {
      const a = angle + offsetAngle;
      return { x: hipX - 0.2 + Math.cos(a) * stride, y: groundY - Math.max(0, Math.sin(a)) * lift };
    };
    return {
      ...base,
      bob: -Math.abs(Math.sin(angle)) * (isRun ? 0.9 : 0.55),
      lean: isRun ? 0.2 : 0.07,
      headTilt: isRun ? 0.08 : 0.02,
      mood: isRun ? 'open' : 'smile',
      backFoot: footAt(Math.PI),
      frontFoot: footAt(0),
      backArm: [-Math.cos(angle) * (isRun ? 1.1 : 0.7) , isRun ? 1.2 : 0.6],
      frontArm: [Math.cos(angle) * (isRun ? 1.1 : 0.7), isRun ? 1.3 : 0.5]
    };
  }
  switch (pose) {
    case 'stand2':
      return { ...base, bob: 0.25, squashY: 0.985, backFoot: { x: hipX - 1.3, y: groundY }, frontFoot: { x: hipX + 1.5, y: groundY } };
    case 'jump':
    case 'jumpUp':
      return { ...base, bob: -0.2, lean: 0.06, mood: 'open', squashY: 1.06, squashX: 0.95,
        backFoot: { x: hipX - 2.0, y: groundY - body.shin * 0.7 }, frontFoot: { x: hipX + 2.0, y: groundY - body.shin * 1.1 },
        backArm: [-2.3, 0.3], frontArm: [2.0, -0.4] };
    case 'jumpDown':
      return { ...base, bob: 0, lean: -0.04, mood: 'open', squashY: 1.03, squashX: 0.98,
        backFoot: { x: hipX - 1.8, y: groundY - body.shin * 0.5 }, frontFoot: { x: hipX + 1.9, y: groundY - body.shin * 0.3 },
        backArm: [-2.0, 0.2], frontArm: [1.9, 0.0] };
    case 'skid':
      return { ...base, bob: 0.4, lean: -0.28, headTilt: -0.1, mood: 'open', squashY: 0.96, squashX: 1.04,
        backFoot: { x: hipX - 2.6, y: groundY }, frontFoot: { x: hipX + 2.4, y: groundY - 0.3 },
        backArm: [1.8, 0.3], frontArm: [-1.6, 0.2] };
    case 'crouch':
      return { ...base, bob: body.height > 20 ? 5.2 : 2.2, lean: 0.1, squashY: 0.96, squashX: 1.04,
        backFoot: { x: hipX - 2.2, y: groundY }, frontFoot: { x: hipX + 2.4, y: groundY } };
    case 'dead':
      return { ...base, bob: -0.6, mood: 'open', headTilt: 0.15,
        backFoot: { x: hipX - 2.2, y: groundY - body.shin * 0.4 }, frontFoot: { x: hipX + 2.4, y: groundY - body.shin * 0.8 },
        backArm: [-2.7, 0.2], frontArm: [2.6, -0.2] };
    case 'pole':
      return { ...base, bob: 0, backArm: [2.9, 0.1], frontArm: [2.9, 0.1],
        backFoot: { x: hipX - 0.8, y: groundY - body.shin * 0.5 }, frontFoot: { x: hipX + 0.8, y: groundY - body.shin * 0.2 } };
    default:
      return { ...base, backFoot: { x: hipX - 1.3, y: groundY }, frontFoot: { x: hipX + 1.5, y: groundY } };
  }
}

/** Lista de todas las posturas que se generan para cada tamaño y variante. */
export const PACO_POSES = Object.freeze([
  'stand', 'stand2', 'jump', 'jumpUp', 'jumpDown', 'skid', 'crouch', 'dead', 'pole',
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => `walk${n}`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => `run${n}`)
]);

/**
 * Pinta un fotograma de Paco.
 * @param {'small'|'big'} size
 * @param {string} pose Una de {@link PACO_POSES}.
 * @param {string} variant Clave de {@link PACO_PALETTES}.
 * @returns {{image: HTMLCanvasElement, padding: number, width: number, height: number}}
 */
export function createPacoSprite(size, pose, variant) {
  const body = BODY[size];
  const palette = PACO_PALETTES[variant] || PACO_PALETTES.normal;
  const description = describePose(pose, body);
  const logicalWidth = 16 + PACO_PADDING * 2;
  const logicalHeight = body.height + PACO_PADDING * 2;
  const rawCanvas = createCanvas(logicalWidth * RENDER_SCALE, logicalHeight * RENDER_SCALE, context => {
    context.scale(RENDER_SCALE, RENDER_SCALE);
    context.translate(PACO_PADDING, PACO_PADDING);
    // Aplastar o estirar desde los pies.
    context.translate(8, body.height);
    context.scale(description.squashX, description.squashY);
    context.translate(-8, -body.height);
    context.translate(0, description.bob);

    const centerX = 8;
    const shoulderX = centerX;
    const hipX = centerX;
    const shoulder = body.shoulderY;
    const lean = description.lean;

    // Capa trasera: brazo y pierna de atrás.
    drawArm(context, body, palette, shoulderX - 0.6, shoulder, description.backArm[0], description.backArm[1], true);
    drawLeg(context, { ...body, hipY: body.hipY - description.bob * 0 }, palette, hipX - 0.9, { x: description.backFoot.x, y: description.backFoot.y - description.bob }, 0.05, true);
    drawTorso(context, body, palette, centerX, lean);
    drawLeg(context, body, palette, hipX + 0.9, { x: description.frontFoot.x, y: description.frontFoot.y - description.bob }, -0.05, false);
    drawHead(context, body, palette, centerX + lean * 4 + 0.4, body.headY, description.mood, description.headTilt);
    drawArm(context, body, palette, shoulderX + 0.6, shoulder, description.frontArm[0], description.frontArm[1], false);
  });
  applyAmbientGradient(rawCanvas, 0, rawCanvas.height);
  // Contorno interior fino de cada pieza ya está sugerido por las sombras; el exterior es grueso.
  const outlined = addOutline(rawCanvas, RENDER_SCALE, OUTLINE_COLOR);
  return {
    image: outlined,
    padding: PACO_PADDING + 1,
    width: 16,
    height: body.height
  };
}
