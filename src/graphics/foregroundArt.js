/**
 * @file Capa de primer plano: siluetas oscuras y desenfocadas (hojas, farolas,
 * guirnaldas, tuberías, estalactitas…) que pasan POR DELANTE de Paco, más
 * deprisa que el suelo. Dan sensación de profundidad.
 *
 * Se pinta a media resolución y se amplía con suavizado, lo que la desenfoca
 * de forma natural (como una lente enfocada más atrás).
 */
import { SCREEN_HEIGHT, RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { BACKGROUND_LAYER_WIDTH } from './backgroundConstants.js';
import { wrapDraw, mix, linearGradient, TAU } from './backgroundKit.js';

/** Resolución relativa de la capa (la mitad de la del juego). */
export const FOREGROUND_SCALE = RENDER_SCALE / 2;

const W = BACKGROUND_LAYER_WIDTH;

/** Matas de hierba o helechos pegados al borde inferior. */
function foliageBottom(context, random, color, { count = 22, height = 26, wide = false } = {}) {
  for (let index = 0; index < count; index++) {
    const x = (index + random() * 0.8) * (W / count);
    const bladeHeight = height * (0.5 + random() * 0.7);
    wrapDraw(context, x - 14, 28, px => {
      for (let blade = 0; blade < (wide ? 7 : 5); blade++) {
        const angle = -Math.PI / 2 + (blade - 2) * 0.3 + (random() - 0.5) * 0.2;
        const length = bladeHeight * (0.7 + random() * 0.5);
        const baseX = px + 14 + (blade - 2) * 2;
        context.beginPath();
        context.moveTo(baseX - 1.6, SCREEN_HEIGHT + 4);
        context.quadraticCurveTo(baseX + Math.cos(angle) * length * 0.5, SCREEN_HEIGHT - length * 0.6, baseX + Math.cos(angle) * length, SCREEN_HEIGHT - length + 8);
        context.quadraticCurveTo(baseX + Math.cos(angle) * length * 0.4 + 2, SCREEN_HEIGHT - length * 0.5, baseX + 1.6, SCREEN_HEIGHT + 4);
        context.closePath();
        context.fillStyle = color;
        context.fill();
      }
    });
  }
}

/** Hojas y lianas que cuelgan del borde superior. */
function foliageTop(context, random, color, { count = 8, length = 34 } = {}) {
  for (let index = 0; index < count; index++) {
    const x = (index + random() * 0.8) * (W / count);
    const drop = length * (0.5 + random() * 0.8);
    wrapDraw(context, x - 20, 40, px => {
      context.strokeStyle = color; context.lineWidth = 1.2; context.lineCap = 'round';
      context.beginPath(); context.moveTo(px + 20, -4); context.quadraticCurveTo(px + 20 + (random() - 0.5) * 8, drop * 0.5, px + 20 + (random() - 0.5) * 10, drop); context.stroke();
      context.fillStyle = color;
      for (let leaf = 1; leaf < 6; leaf++) {
        const t = leaf / 6;
        context.beginPath(); context.ellipse(px + 20 + Math.sin(leaf * 2) * 3, drop * t, 4.2, 1.7, (leaf % 2 ? 0.7 : -0.7), 0, TAU); context.fill();
      }
    });
  }
}

/** Farolas de forja a lo largo del borde inferior. */
function lampPosts(context, color, spacing = 170) {
  for (let x = 40; x < W; x += spacing) {
    wrapDraw(context, x - 10, 20, px => {
      context.fillStyle = color;
      context.fillRect(px + 9, SCREEN_HEIGHT - 120, 2.4, 124);
      context.fillRect(px + 6, SCREEN_HEIGHT - 8, 8, 12);
      context.beginPath(); context.moveTo(px + 4, SCREEN_HEIGHT - 124); context.lineTo(px + 16, SCREEN_HEIGHT - 124); context.lineTo(px + 13, SCREEN_HEIGHT - 132); context.lineTo(px + 7, SCREEN_HEIGHT - 132); context.closePath(); context.fill();
      context.fillRect(px + 5, SCREEN_HEIGHT - 146, 10, 14);
    });
  }
}

/** Guirnalda de banderines que cruza la parte alta. */
function bunting(context, color, y = 6, sag = 14) {
  for (let x = 0; x < W; x += 128) {
    context.strokeStyle = color; context.lineWidth = 0.7;
    context.beginPath(); context.moveTo(x, y); context.quadraticCurveTo(x + 64, y + sag, x + 128, y); context.stroke();
    for (let flag = 1; flag < 14; flag++) {
      const t = flag / 14;
      const px = x + 128 * t; const py = y + 2 * (1 - t) * t * sag;
      context.fillStyle = color; context.beginPath(); context.moveTo(px - 3, py); context.lineTo(px + 3, py); context.lineTo(px, py + 8); context.closePath(); context.fill();
    }
  }
}

/** Tuberías y cables que cruzan el techo. */
function pipesTop(context, random, color) {
  context.fillStyle = color;
  for (const y of [3, 9]) {
    context.fillRect(0, y, W, 3.4);
    for (let x = 0; x < W; x += 48 + random() * 20) { context.fillRect(x, y - 2, 4, 8); }
  }
  context.strokeStyle = color; context.lineWidth = 1;
  for (let x = 20; x < W; x += 90) { context.beginPath(); context.moveTo(x, 12); context.quadraticCurveTo(x + 30, 30, x + 60, 12); context.stroke(); }
}

/** Estalactitas y estalagmitas. */
function stalactites(context, random, color, { top = true, bottom = true } = {}) {
  for (let x = 0; x < W; x += 24 + random() * 18) {
    const h = 20 + random() * 44;
    if (top) { context.fillStyle = color; context.beginPath(); context.moveTo(x, -4); context.lineTo(x + 14, -4); context.lineTo(x + 7, h); context.closePath(); context.fill(); }
    if (bottom && random() > 0.5) { const bh = 14 + random() * 30; context.fillStyle = color; context.beginPath(); context.moveTo(x + 4, SCREEN_HEIGHT + 4); context.lineTo(x + 14, SCREEN_HEIGHT + 4); context.lineTo(x + 9, SCREEN_HEIGHT - bh); context.closePath(); context.fill(); }
  }
}

/** Pelotas de luz difusas que flotan (polvo, luciérnagas, ceniza). */
function floatingLights(context, random, rgb, count = 18) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  for (let index = 0; index < count; index++) {
    const x = random() * W; const y = 30 + random() * 160; const r = 3 + random() * 6;
    const gradient = context.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(${rgb}, 0.45)`); gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    context.fillStyle = gradient; context.fillRect(x - r, y - r, r * 2, r * 2);
  }
  context.restore();
}

/** Qué siluetas lleva cada tema. */
const FOREGROUND_PAINTERS = {
  madrid(context, random, dark) { lampPosts(context, dark); bunting(context, dark); foliageBottom(context, random, dark, { count: 14, height: 18 }); },
  benidorm(context, random, dark) { foliageTop(context, random, dark, { count: 5, length: 44 }); foliageBottom(context, random, dark, { count: 12, height: 22, wide: true }); },
  sevilla(context, random, dark) { bunting(context, dark, 8, 18); foliageBottom(context, random, dark, { count: 14, height: 20 }); floatingLights(context, random, '255, 190, 90', 14); },
  pamplona(context, random, dark) { bunting(context, dark, 4, 10); foliageBottom(context, random, dark, { count: 18, height: 16 }); },
  metro(context, random, dark) { pipesTop(context, random, dark); stalactites(context, random, dark, { top: false, bottom: false }); },
  galicia(context, random, dark) { foliageTop(context, random, dark, { count: 9, length: 38 }); foliageBottom(context, random, dark, { count: 26, height: 30, wide: true }); },
  valencia(context, random, dark) { bunting(context, dark, 4, 12); foliageBottom(context, random, dark, { count: 12, height: 16 }); floatingLights(context, random, '255, 120, 200', 16); },
  mancha(context, random, dark) { foliageBottom(context, random, dark, { count: 22, height: 24 }); floatingLights(context, random, '170, 200, 255', 22); },
  canarias(context, random, dark) { foliageTop(context, random, dark, { count: 5, length: 30 }); foliageBottom(context, random, dark, { count: 14, height: 26, wide: true }); floatingLights(context, random, '255, 150, 60', 26); },
  hacienda(context, random, dark) { pipesTop(context, random, dark); floatingLights(context, random, '255, 160, 90', 16); },
  taberna(context, random, dark) { lampPosts(context, dark, 200); floatingLights(context, random, '255, 190, 100', 12); },
  bodega(context, random, dark) { pipesTop(context, random, dark); floatingLights(context, random, '200, 130, 255', 14); },
  gruta(context, random, dark) { stalactites(context, random, dark); floatingLights(context, random, '120, 255, 230', 26); }
};

/**
 * Crea la capa de primer plano de un tema.
 * @param {import('../world/themes.js').Theme} theme
 * @param {() => number} random
 * @returns {HTMLCanvasElement}
 */
export function createForegroundLayer(theme, random) {
  const dark = mix(theme.skyColors[2], '#000000', 0.88);
  return createCanvas(Math.round(W * FOREGROUND_SCALE), Math.round(SCREEN_HEIGHT * FOREGROUND_SCALE), context => {
    context.scale(FOREGROUND_SCALE, FOREGROUND_SCALE);
    context.imageSmoothingEnabled = true;
    FOREGROUND_PAINTERS[theme.name](context, random, dark);
    // Se desvanece un poco hacia el centro para no tapar la acción.
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = linearGradient(context, 0, 0, 0, SCREEN_HEIGHT, [[0, 'rgba(0,0,0,0)'], [0.22, 'rgba(0,0,0,0)'], [0.38, 'rgba(0,0,0,1)'], [0.7, 'rgba(0,0,0,1)'], [0.86, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]);
    context.fillRect(0, 0, W, SCREEN_HEIGHT);
  });
}
