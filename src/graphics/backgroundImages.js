/**
 * @file Fondos con efecto parallax para cada ciudad, en alta resolución.
 *
 * Cada fondo tiene cuatro partes:
 *   - `sky`: el cielo con su degradado, el sol o las estrellas (no se mueve).
 *   - `farLayer`, `midLayer`, `nearLayer`: tres capas de paisaje que se
 *     desplazan a distinta velocidad (más lejos = más despacio).
 * Las capas miden 512 píxeles lógicos de ancho y se repiten en horizontal;
 * se pintan con RENDER_SCALE veces más píxeles para que salgan nítidas.
 * Los dibujos de cada ciudad están en `cityBackgrounds.js`.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT, RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { createSeededRandom } from '../core/math.js';
import { BACKGROUND_LAYER_WIDTH } from './backgroundConstants.js';
import { CITY_PAINTERS } from './cityBackgrounds.js';
import { linearGradient, glow, mix, shade, softCloud, TAU } from './backgroundKit.js';

/** Crea una capa transparente cuyo contexto ya está ampliado. */
function createLayer() {
  const canvas = createCanvas(BACKGROUND_LAYER_WIDTH * RENDER_SCALE, SCREEN_HEIGHT * RENDER_SCALE);
  const context = canvas.getContext('2d');
  context.scale(RENDER_SCALE, RENDER_SCALE);
  context.imageSmoothingEnabled = true;
  return { canvas, context };
}

/** Pinta el cielo: degradado de tres tonos, resplandor del horizonte, sol o estrellas. */
function paintSky(context, theme, random) {
  const [topSky, middleSky, lowSky] = theme.skyColors;
  context.fillStyle = linearGradient(context, 0, 0, 0, SCREEN_HEIGHT, [
    [0, shade(topSky, -0.1)], [0.4, middleSky], [0.8, lowSky], [1, shade(lowSky, 0.12)]
  ]);
  context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  if (theme.isNight) {
    for (let star = 0; star < 90; star++) {
      const x = random() * SCREEN_WIDTH;
      const y = random() * SCREEN_HEIGHT * 0.6;
      context.fillStyle = random() > 0.8 ? '#ffffff' : '#9aaadc';
      context.beginPath(); context.arc(x, y, random() > 0.85 ? 0.9 : 0.5, 0, TAU); context.fill();
    }
  }
  if (theme.sun) {
    const { x, y, radius, color } = theme.sun;
    glow(context, x, y, radius * 7, color, 0.5);
    glow(context, x, y, radius * 3, '#ffffff', 0.35);
    context.fillStyle = linearGradient(context, 0, y - radius, 0, y + radius, [[0, '#ffffff'], [1, color]]);
    context.beginPath(); context.arc(x, y, radius, 0, TAU); context.fill();
  }
  // Brillo cálido en el horizonte.
  context.fillStyle = linearGradient(context, 0, SCREEN_HEIGHT * 0.55, 0, SCREEN_HEIGHT * 0.9, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,240,220,0.18)']]);
  context.fillRect(0, SCREEN_HEIGHT * 0.55, SCREEN_WIDTH, SCREEN_HEIGHT * 0.35);
}

/** Capa de nubes suaves, con sombra azulada abajo y luz arriba. */
function createCloudLayer(theme, random) {
  const layer = createLayer();
  const horizon = theme.skyColors[2];
  const count = 7;
  for (let index = 0; index < count; index++) {
    const x = (index + random() * 0.6) * (BACKGROUND_LAYER_WIDTH / count);
    const y = 24 + random() * 92;
    const scale = 0.8 + random() * 0.9;
    for (const offset of [-BACKGROUND_LAYER_WIDTH, 0, BACKGROUND_LAYER_WIDTH]) {
      softCloud(layer.context, x + offset, y, scale, { top: '#ffffff', bottom: mix('#cfe0f6', horizon, 0.35), opacity: 0.92 });
    }
  }
  return layer.canvas;
}

/**
 * @typedef {Object} BackgroundImages
 * @property {HTMLCanvasElement} sky Cielo del tamaño de la pantalla (alta resolución).
 * @property {HTMLCanvasElement|null} cloudLayer Nubes que se desplazan despacio (null si el tema no tiene).
 * @property {HTMLCanvasElement} farLayer
 * @property {HTMLCanvasElement} midLayer
 * @property {HTMLCanvasElement} nearLayer
 */

/**
 * Genera el fondo de una ciudad.
 * @param {import('../world/themes.js').Theme} theme
 * @returns {BackgroundImages}
 */
export function createBackgroundImages(theme) {
  const random = createSeededRandom(theme.name.length * 131 + 17);
  const far = createLayer();
  const mid = createLayer();
  const near = createLayer();
  CITY_PAINTERS[theme.name]({ far: far.context, mid: mid.context, near: near.context }, random, { skyHorizon: theme.skyColors[2], theme });
  const sky = createCanvas(SCREEN_WIDTH * RENDER_SCALE, SCREEN_HEIGHT * RENDER_SCALE, context => {
    context.scale(RENDER_SCALE, RENDER_SCALE);
    paintSky(context, theme, random);
  });
  return { sky, cloudLayer: theme.hasClouds ? createCloudLayer(theme, random) : null, farLayer: far.canvas, midLayer: mid.canvas, nearLayer: near.canvas };
}
