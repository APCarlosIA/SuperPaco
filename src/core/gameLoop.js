/**
 * @file Bucle principal con paso de simulación fijo.
 *
 * El navegador pide fotogramas a la frecuencia de la pantalla (60 Hz, 120 Hz…),
 * pero la física debe avanzar siempre al mismo ritmo para que el juego vaya
 * igual de rápido en cualquier ordenador. Por eso se acumula el tiempo real y se
 * ejecutan tantos pasos fijos de 1/60 s como quepan; después se dibuja una vez.
 */
import { SIMULATION_STEPS_PER_SECOND } from '../config/constants.js';

/** Tiempo máximo que se recupera tras una pausa larga (p. ej. al cambiar de pestaña). */
const MAX_CATCH_UP_MILLISECONDS = 100;

/**
 * Arranca el bucle infinito del juego.
 * @param {Object} callbacks
 * @param {() => void} callbacks.update Avanza la simulación un paso fijo.
 * @param {() => void} callbacks.render Dibuja el estado actual en pantalla.
 */
export function startFixedStepGameLoop({ update, render }) {
  const millisecondsPerStep = 1000 / SIMULATION_STEPS_PER_SECOND;
  let previousTimestamp = performance.now();
  let accumulatedMilliseconds = 0;

  function runFrame(timestamp) {
    accumulatedMilliseconds += Math.min(MAX_CATCH_UP_MILLISECONDS, timestamp - previousTimestamp);
    previousTimestamp = timestamp;
    while (accumulatedMilliseconds >= millisecondsPerStep) {
      update();
      accumulatedMilliseconds -= millisecondsPerStep;
    }
    render();
    requestAnimationFrame(runFrame);
  }

  requestAnimationFrame(runFrame);
}
