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

/** Identificador del `<canvas>` en `page.html`. */
const CANVAS_ELEMENT_ID = 'game';
/** Añadiendo "?debug" a la dirección, el juego queda accesible desde la consola para probarlo. */
const IS_DEBUG_MODE = new URLSearchParams(window.location.search).has('debug');

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
  if (IS_DEBUG_MODE) window.superPacoDebug = { game, input, soundEngine, sprites: SPRITES };

  startFixedStepGameLoop({
    update() {
      input.update();
      game.update();
    },
    render() {
      game.draw(screen.beginFrame());
      screen.present();
    }
  });
  screen.canvas.focus();
}

startSuperPaco();
