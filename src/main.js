/**
 * @file Punto de entrada de Súper Paco: La Tortilla Perdida.
 *
 * Es el único módulo que conecta el juego con el navegador: crea la pantalla,
 * prepara los gráficos, conecta el teclado y el sonido, y arranca el bucle.
 * El resto del código recibe lo que necesita como parámetro, por eso puede
 * probarse en Node sin navegador.
 */
import { createGameScreen, keepCanvasFittedToWindow } from './core/screen.js';
import { input } from './core/input.js';
import { startFixedStepGameLoop } from './core/gameLoop.js';
import { soundEngine } from './audio/soundEngine.js';
import { buildFont } from './graphics/font.js';
import { buildSprites, SPRITES } from './graphics/sprites.js';
import { Game } from './game/Game.js';
import { screenFx } from './graphics/screenFx.js';

/** Identificador del `<canvas>` en `page.html`. */
const CANVAS_ELEMENT_ID = 'game';
/** Añadiendo "?debug" a la dirección, el juego queda accesible desde la consola para probarlo. */
const IS_DEBUG_MODE = new URLSearchParams(window.location.search).has('debug');

/** Calidad forzada con "?quality=0|1|2" (si no se indica, se ajusta sola). */
const FORCED_QUALITY = new URLSearchParams(window.location.search).get('quality');
/** Fotogramas que se miden antes de decidir si el equipo va justo. */
const QUALITY_CHECK_FRAMES = 90;
/** Si el fotograma medio tarda más de esto (ms), se baja la calidad un nivel. */
const SLOW_FRAME_MILLISECONDS = 24;

/** Baja la calidad del acabado de imagen si los fotogramas tardan demasiado. */
function createQualityMonitor() {
  let lastTimestamp = 0;
  let measuredFrames = 0;
  let totalMilliseconds = 0;
  return function onFrame(timestamp) {
    if (FORCED_QUALITY !== null) return;
    if (lastTimestamp) {
      totalMilliseconds += timestamp - lastTimestamp;
      measuredFrames++;
    }
    lastTimestamp = timestamp;
    if (measuredFrames < QUALITY_CHECK_FRAMES) return;
    if (totalMilliseconds / measuredFrames > SLOW_FRAME_MILLISECONDS && screenFx.quality < 2) screenFx.quality++;
    measuredFrames = 0;
    totalMilliseconds = 0;
  };
}

function startSuperPaco() {
  const screen = createGameScreen(CANVAS_ELEMENT_ID);
  keepCanvasFittedToWindow(screen.canvas);
  buildFont();
  buildSprites();

  input.attach(screen.canvas);
  // El audio solo puede empezar tras una interacción del jugador.
  input.onUserInteraction(() => soundEngine.unlock());

  const game = new Game({ controls: input });
  game.start();
  if (IS_DEBUG_MODE) window.superPacoDebug = { game, input, soundEngine, sprites: SPRITES, screen, fx: screenFx };

  if (FORCED_QUALITY !== null) screenFx.quality = Math.min(2, Math.max(0, Number(FORCED_QUALITY) || 0));
  const monitorQuality = createQualityMonitor();
  startFixedStepGameLoop({
    update() {
      input.update();
      game.update();
    },
    render() {
      monitorQuality(performance.now());
      game.draw(screen.beginFrame());
      screen.present();
    }
  });
  screen.canvas.focus();
}

startSuperPaco();
