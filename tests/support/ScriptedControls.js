/**
 * @file Controles simulados para los tests.
 *
 * Implementan la misma interfaz `Controls` que el teclado real (`isHeld`,
 * `wasPressed`, `wasConfirmPressed`), pero los botones se "pulsan" desde el
 * código del test. Igual que el gestor real, el estado se congela en cada paso
 * con `update()`, que debe llamarse antes de avanzar el juego.
 */
import { BUTTON } from '../../src/core/input.js';

export class ScriptedControls {
  constructor() {
    /** Botones que el test mantiene pulsados. */
    this.buttonsBeingHeld = new Set();
    /** Botones que se pulsan solo durante el siguiente paso. */
    this.buttonsTappedForNextStep = new Set();
    this.heldThisStep = new Set();
    this.heldPreviousStep = new Set();
  }

  /** Mantiene pulsado un botón hasta que se suelte. */
  hold(button) {
    this.buttonsBeingHeld.add(button);
  }

  /** Suelta un botón. */
  release(button) {
    this.buttonsBeingHeld.delete(button);
  }

  /** Suelta todos los botones. */
  releaseAll() {
    this.buttonsBeingHeld.clear();
  }

  /** Pulsa un botón durante un único paso (una pulsación rápida). */
  tap(button) {
    this.buttonsTappedForNextStep.add(button);
  }

  /** Congela el estado de los botones para el siguiente paso de simulación. */
  update() {
    this.heldPreviousStep = this.heldThisStep;
    this.heldThisStep = new Set([...this.buttonsBeingHeld, ...this.buttonsTappedForNextStep]);
    this.buttonsTappedForNextStep.clear();
  }

  isHeld(button) {
    return this.heldThisStep.has(button);
  }

  wasPressed(button) {
    return this.heldThisStep.has(button) && !this.heldPreviousStep.has(button);
  }

  wasConfirmPressed() {
    return this.wasPressed(BUTTON.START) || this.wasPressed(BUTTON.JUMP);
  }
}
