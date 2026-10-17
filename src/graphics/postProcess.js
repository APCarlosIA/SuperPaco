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
  // Cadena de reducciones a la mitad: barata y sin saltos de calidad.
  const bloomHalf = createCanvas(WIDTH / 2, HEIGHT / 2);
  const bloomQuarter = createCanvas(WIDTH / 4, HEIGHT / 4);
  const bloomEighth = createCanvas(WIDTH / 8, HEIGHT / 8);
  const bloomTemporary = createCanvas(WIDTH / 8, HEIGHT / 8);
  const bloomTiny = createCanvas(WIDTH / 16, HEIGHT / 16);
  const bloomHalfContext = bloomHalf.getContext('2d');
  const bloomQuarterContext = bloomQuarter.getContext('2d');
  const bloomEighthContext = bloomEighth.getContext('2d');
  const bloomTemporaryContext = bloomTemporary.getContext('2d');
  const bloomTinyContext = bloomTiny.getContext('2d');
  for (const context of [bloomHalfContext, bloomQuarterContext, bloomEighthContext, bloomTemporaryContext, bloomTinyContext]) {
    context.imageSmoothingEnabled = true;
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
    bloomHalfContext.drawImage(sceneCanvas, 0, 0, bloomHalf.width, bloomHalf.height);
    bloomQuarterContext.drawImage(bloomHalf, 0, 0, bloomQuarter.width, bloomQuarter.height);
    bloomEighthContext.globalCompositeOperation = 'source-over';
    bloomEighthContext.drawImage(bloomQuarter, 0, 0, bloomEighth.width, bloomEighth.height);
    // Elevar al cuadrado (multiplicar consigo mismo) deja solo las zonas claras.
    bloomTemporaryContext.drawImage(bloomEighth, 0, 0);
    bloomEighthContext.globalCompositeOperation = 'multiply';
    bloomEighthContext.drawImage(bloomTemporary, 0, 0);
    bloomEighthContext.drawImage(bloomTemporary, 0, 0);
    bloomEighthContext.drawImage(bloomTemporary, 0, 0);
    bloomEighthContext.globalCompositeOperation = 'source-over';
    // Segundo nivel de desenfoque, sumado al primero en el lienzo pequeño.
    bloomTinyContext.drawImage(bloomEighth, 0, 0, bloomTiny.width, bloomTiny.height);
    bloomEighthContext.globalCompositeOperation = 'lighter';
    bloomEighthContext.globalAlpha = 0.8;
    bloomEighthContext.drawImage(bloomTiny, 0, 0, bloomEighth.width, bloomEighth.height);
    bloomEighthContext.globalAlpha = 1;
    bloomEighthContext.globalCompositeOperation = 'source-over';
    display.save();
    display.imageSmoothingEnabled = true;
    display.globalCompositeOperation = 'lighter';
    display.globalAlpha = strength * 1.6;
    display.drawImage(bloomEighth, 0, 0, WIDTH, HEIGHT);
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

    if (screenFx.quality === 0 && screenFx.bloom > 0) applyBloom(screenFx.bloom * 0.55);

    // Contraste y saturación: mezclar la imagen consigo misma en modo "overlay".
    if (screenFx.quality === 0) {
      display.save();
      display.globalCompositeOperation = 'overlay';
      display.globalAlpha = 0.22;
      display.drawImage(sceneCanvas, 0, 0);
      display.restore();
    }

    const grade = screenFx.grade;
    if (screenFx.quality < 2 && grade.alpha > 0) {
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
