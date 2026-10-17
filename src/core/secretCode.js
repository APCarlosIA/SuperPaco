/**
 * @file Detector de combinaciones secretas de botones (el truco clásico
 * ↑ ↑ ↓ ↓ ◀ ▶ ◀ ▶ B A). Es lógica pura, sin navegador.
 */
import { BUTTON } from './input.js';

/** Secuencia del truco del cocinero. */
export const CHEF_CODE = Object.freeze([
  BUTTON.UP, BUTTON.UP, BUTTON.DOWN, BUTTON.DOWN,
  BUTTON.LEFT, BUTTON.RIGHT, BUTTON.LEFT, BUTTON.RIGHT,
  BUTTON.RUN, BUTTON.JUMP
]);

/**
 * Crea un detector para una secuencia de botones.
 * @param {readonly string[]} sequence
 * @returns {{feed: (button: string) => boolean, reset: () => void}}
 */
export function createSecretCodeTracker(sequence) {
  let position = 0;
  return {
    /**
     * Anota un botón recién pulsado.
     * @returns {boolean} true si con este botón se completa la secuencia.
     */
    feed(button) {
      if (button === sequence[position]) position++;
      else position = button === sequence[0] ? 1 : 0;
      if (position < sequence.length) return false;
      position = 0;
      return true;
    },
    reset() {
      position = 0;
    }
  };
}
