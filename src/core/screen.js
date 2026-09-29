/**
 * @file Pantalla del juego: el canvas visible y su escalado a la ventana.
 *
 * El juego dibuja siempre sobre un lienzo pequeño de 320×240 píxeles y el
 * navegador lo amplía con `image-rendering: pixelated`, de modo que cada píxel
 * del juego se ve como un bloque nítido, igual que en una consola de 8 bits.
 *
 * Este módulo no toca el documento al importarse: la pantalla se crea al
 * arrancar con {@link createGameScreen}. Así la lógica del juego se puede
 * cargar en Node (tests) sin navegador.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config/constants.js';

/**
 * @typedef {Object} GameScreen
 * @property {HTMLCanvasElement} canvas Elemento `<canvas>` visible.
 * @property {CanvasRenderingContext2D} context Contexto donde se dibuja cada fotograma.
 */

/**
 * Busca el canvas del juego en la página y prepara su contexto de dibujo.
 * @param {string} canvasElementId Identificador del `<canvas>` en el HTML.
 * @returns {GameScreen}
 */
export function createGameScreen(canvasElementId) {
  const canvas = document.getElementById(canvasElementId);
  const context = canvas.getContext('2d', { alpha: false });
  context.imageSmoothingEnabled = false;
  return { canvas, context };
}

/**
 * Ajusta el tamaño CSS del canvas para que quepa en la ventana.
 * Si hay espacio para ampliar al menos al doble, usa un factor entero
 * (2×, 3×, 4×…) para que todos los píxeles tengan exactamente el mismo tamaño.
 * @param {HTMLCanvasElement} canvas
 */
export function fitCanvasToWindow(canvas) {
  const availableScale = Math.min(window.innerWidth / SCREEN_WIDTH, window.innerHeight / SCREEN_HEIGHT);
  const scale = availableScale >= 2 ? Math.floor(availableScale) : availableScale;
  canvas.style.width = Math.floor(SCREEN_WIDTH * scale) + 'px';
  canvas.style.height = Math.floor(SCREEN_HEIGHT * scale) + 'px';
}

/**
 * Ajusta el canvas ahora y cada vez que cambie el tamaño de la ventana.
 * @param {HTMLCanvasElement} canvas
 */
export function keepCanvasFittedToWindow(canvas) {
  fitCanvasToWindow(canvas);
  window.addEventListener('resize', () => fitCanvasToWindow(canvas));
}

/** Activa o desactiva la pantalla completa (si el navegador lo permite). */
export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => { /* el navegador lo ha rechazado */ });
  } catch (error) {
    // Algunos navegadores o marcos incrustados no permiten pantalla completa.
  }
}
