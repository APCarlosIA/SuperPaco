/**
 * @file Acabado de imagen: pasa el fotograma dibujado en el lienzo de trabajo
 * al lienzo visible aplicando temblor, resplandor (bloom), contraste, tono de
 * color, viñeta y destellos. Todo con operaciones estándar del canvas 2D, sin
 * depender de filtros que algunos navegadores no tienen.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT, RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from '../core/canvas.js';
import { screenFx } from './screenFx.js';

const WIDTH = SCREEN_WIDTH * RENDER_SCALE;
const HEIGHT = SCREEN_HEIGHT * RENDER_SCALE;

/**
 * Crea el procesador de imagen.
 * @param {HTMLCanvasElement} displayCanvas Lienzo visible.
 * @param {HTMLCanvasElement} sceneCanvas Lienzo donde dibuja el juego.
 * @returns {{present: () => void}}
 */
export function createPostProcessor(displayCanvas, sceneCanvas) {
  const display = displayCanvas.getContext('2d', { alpha: false });
  const bloomLarge = createCanvas(WIDTH / 4, HEIGHT / 4);
  const bloomTemporary = createCanvas(WIDTH / 4, HEIGHT / 4);
  const bloomSmall = createCanvas(WIDTH / 16, HEIGHT / 16);
  const bloomLargeContext = bloomLarge.getContext('2d');
  const bloomTemporaryContext = bloomTemporary.getContext('2d');
  const bloomSmallContext = bloomSmall.getContext('2d');
  for (const context of [bloomLargeContext, bloomTemporaryContext, bloomSmallContext]) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
  }

  const vignetteImage = createCanvas(WIDTH, HEIGHT, context => {
    const gradient = context.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.38, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.95);
    gradient.addColorStop(0, 'rgba(8, 4, 20, 0)');
    gradient.addColorStop(1, 'rgba(8, 4, 20, 1)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, WIDTH, HEIGHT);
  });

  /** Resplandor: se queda solo con lo muy brillante, lo difumina y lo suma encima. */
  function applyBloom(strength) {
    bloomLargeContext.globalCompositeOperation = 'source-over';
    bloomLargeContext.drawImage(sceneCanvas, 0, 0, bloomLarge.width, bloomLarge.height);
    // Elevar al cuadrado (multiplicar consigo mismo) deja solo las zonas claras.
    bloomTemporaryContext.drawImage(bloomLarge, 0, 0);
    bloomLargeContext.globalCompositeOperation = 'multiply';
    bloomLargeContext.drawImage(bloomTemporary, 0, 0);
    bloomLargeContext.drawImage(bloomTemporary, 0, 0);
    bloomLargeContext.drawImage(bloomTemporary, 0, 0);
    bloomLargeContext.globalCompositeOperation = 'source-over';
    bloomSmallContext.drawImage(bloomLarge, 0, 0, bloomSmall.width, bloomSmall.height);
    display.save();
    display.imageSmoothingEnabled = true;
    display.imageSmoothingQuality = 'high';
    display.globalCompositeOperation = 'lighter';
    display.globalAlpha = strength;
    display.drawImage(bloomSmall, 0, 0, WIDTH, HEIGHT);
    display.globalAlpha = strength * 0.7;
    display.drawImage(bloomLarge, 0, 0, WIDTH, HEIGHT);
    display.restore();
  }

  function present() {
    const shake = screenFx.getShakeOffset();
    const zoom = 1 + screenFx.zoomPunch + (screenFx.shakeStepsLeft > 0 ? 0.012 : 0);
    const isTransformed = shake.x !== 0 || shake.y !== 0 || zoom !== 1;

    display.save();
    display.globalCompositeOperation = 'source-over';
    display.globalAlpha = 1;
    if (isTransformed) {
      display.imageSmoothingEnabled = true;
      display.translate(WIDTH / 2 + shake.x * RENDER_SCALE, HEIGHT / 2 + shake.y * RENDER_SCALE);
      display.scale(zoom, zoom);
      display.translate(-WIDTH / 2, -HEIGHT / 2);
    }
    display.drawImage(sceneCanvas, 0, 0);
    display.restore();

    if (screenFx.bloom > 0) applyBloom(screenFx.bloom * 0.55);

    // Contraste y saturación: mezclar la imagen consigo misma en modo "overlay".
    display.save();
    display.globalCompositeOperation = 'overlay';
    display.globalAlpha = 0.22;
    display.drawImage(sceneCanvas, 0, 0);
    display.restore();

    const grade = screenFx.grade;
    if (grade.alpha > 0) {
      display.save();
      display.globalCompositeOperation = grade.mode;
      display.globalAlpha = grade.alpha;
      display.fillStyle = grade.color;
      display.fillRect(0, 0, WIDTH, HEIGHT);
      display.restore();
    }

    if (screenFx.vignette > 0) {
      display.save();
      display.globalAlpha = screenFx.vignette;
      display.drawImage(vignetteImage, 0, 0);
      display.restore();
    }

    if (screenFx.flashAlpha > 0.01) {
      display.save();
      display.globalAlpha = screenFx.flashAlpha;
      display.fillStyle = screenFx.flashColor;
      display.fillRect(0, 0, WIDTH, HEIGHT);
      display.restore();
    }
  }

  return { present };
}
