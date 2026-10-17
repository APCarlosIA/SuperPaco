/**
 * @file Pantalla del juego: el canvas visible y su escalado a la ventana.
 *
 * El juego razona en coordenadas de 320×240, pero dibuja sobre un lienzo de
 * trabajo 3 veces mayor (960×720). Después, `present()` lo pasa al lienzo
 * visible con el acabado de imagen (resplandor, contraste, viñeta, temblor…).
 *
 * Este módulo no toca el documento al importarse: la pantalla se crea al
 * arrancar con {@link createGameScreen}. Así la lógica del juego se puede
 * cargar en Node (tests) sin navegador.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT, RENDER_SCALE } from '../config/constants.js';
import { createCanvas } from './canvas.js';
import { createPostProcessor } from '../graphics/postProcess.js';

/**
 * @typedef {Object} GameScreen
 * @property {HTMLCanvasElement} canvas Elemento `<canvas>` visible.
 * @property {CanvasRenderingContext2D} context Contexto de trabajo (ya ampliado) donde se dibuja cada fotograma.
 * @property {() => CanvasRenderingContext2D} beginFrame Prepara el contexto para un nuevo fotograma.
 * @property {() => void} present Aplica el acabado y muestra el fotograma.
 */

/**
 * Busca el canvas del juego en la página y prepara su contexto de dibujo.
 * @param {string} canvasElementId Identificador del `<canvas>` en el HTML.
 * @returns {GameScreen}
 */
export function createGameScreen(canvasElementId) {
  const canvas = document.getElementById(canvasElementId);
  canvas.width = SCREEN_WIDTH * RENDER_SCALE;
  canvas.height = SCREEN_HEIGHT * RENDER_SCALE;
  const sceneCanvas = createCanvas(canvas.width, canvas.height);
  const context = sceneCanvas.getContext('2d', { alpha: false });
  const postProcessor = createPostProcessor(canvas, sceneCanvas);

  function beginFrame() {
    context.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.imageSmoothingEnabled = false;
    return context;
  }
  beginFrame();
  return { canvas, context, beginFrame, present: postProcessor.present };
}

/**
 * Ajusta el tamaño CSS del canvas para que quepa en la ventana.
 * El lienzo ya tiene alta resolución, así que se puede escalar a cualquier tamaño.
 * @param {HTMLCanvasElement} canvas
 */
export function fitCanvasToWindow(canvas) {
  const scale = Math.min(window.innerWidth / SCREEN_WIDTH, window.innerHeight / SCREEN_HEIGHT);
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
