/**
 * @file Estado de los efectos de pantalla: temblor, destello, "golpe" de zoom,
 * congelación de fotogramas (hit-stop) y tono de color del nivel.
 *
 * Es un módulo solo de datos: la lógica del juego llama a `shake`, `flash`…
 * cuando ocurre algo contundente (pisotón, explosión, daño) y el procesador de
 * imagen (`postProcess.js`) lee el estado al dibujar cada fotograma.
 * No toca el navegador, así que también se puede importar desde los tests.
 */

/** Tono de color por defecto (sin corrección). */
const NO_GRADE = Object.freeze({ color: '#000000', alpha: 0, mode: 'soft-light' });

export const screenFx = {
  shakePower: 0,
  shakeStepsLeft: 0,
  shakeDuration: 1,
  flashColor: '#ffffff',
  flashAlpha: 0,
  zoomPunch: 0,
  hitStopStepsLeft: 0,
  /** Corrección de color del nivel actual. */
  grade: NO_GRADE,
  /** Fuerza del oscurecimiento de los bordes (0 a 1). */
  vignette: 0.5,
  /** Fuerza del resplandor de las zonas brillantes (0 a 1). */
  bloom: 0.28,
  /**
   * Calidad del acabado de imagen: 0 = completo, 1 = sin resplandor ni contraste,
   * 2 = solo viñeta. Baja sola en ordenadores lentos (ver main.js).
   */
  quality: 0,
  /** Intensidad actual de la distorsión de las maravillas (0 a 1) y a la que tiende. */
  wonder: 0,
  wonderTarget: 0,
  /** Reloj de las ondas de la maravilla. */
  time: 0,

  /**
   * Hace temblar la pantalla.
   * @param {number} power Desplazamiento máximo en píxeles lógicos.
   * @param {number} steps Pasos de simulación que dura.
   */
  shake(power, steps = 14) {
    if (power >= this.shakePower * (this.shakeStepsLeft / this.shakeDuration)) {
      this.shakePower = power;
      this.shakeStepsLeft = steps;
      this.shakeDuration = steps;
    }
  },

  /** Destello de color que se desvanece rápido. */
  flash(color = '#ffffff', alpha = 0.6) {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  },

  /** Pequeño acercamiento de cámara que vuelve solo. */
  punch(amount = 0.04) {
    this.zoomPunch = Math.max(this.zoomPunch, amount);
  },

  /** Congela la simulación unos pasos para dar peso a un golpe. */
  hitStop(steps = 4) {
    this.hitStopStepsLeft = Math.max(this.hitStopStepsLeft, steps);
  },

  /** Indica si la simulación debe quedarse quieta en este paso (y gasta uno). */
  consumeHitStop() {
    if (this.hitStopStepsLeft <= 0) return false;
    this.hitStopStepsLeft--;
    return true;
  },

  /** Avanza los efectos un paso (siempre, aunque la simulación esté congelada). */
  update() {
    this.time++;
    this.wonder += (this.wonderTarget - this.wonder) * 0.06;
    if (this.wonder < 0.005) this.wonder = 0;
    if (this.shakeStepsLeft > 0) this.shakeStepsLeft--;
    this.flashAlpha = Math.max(0, this.flashAlpha - 0.045);
    this.zoomPunch = Math.max(0, this.zoomPunch - 0.006);
  },

  /** Desplazamiento actual del temblor en píxeles lógicos. */
  getShakeOffset() {
    if (this.shakeStepsLeft <= 0) return { x: 0, y: 0 };
    const strength = this.shakePower * (this.shakeStepsLeft / this.shakeDuration);
    return { x: (Math.random() * 2 - 1) * strength, y: (Math.random() * 2 - 1) * strength };
  },

  /** Quita todos los efectos y el tono de color (al cambiar de pantalla). */
  reset() {
    this.shakePower = 0;
    this.shakeStepsLeft = 0;
    this.flashAlpha = 0;
    this.zoomPunch = 0;
    this.hitStopStepsLeft = 0;
    this.wonder = 0;
    this.wonderTarget = 0;
    this.grade = NO_GRADE;
    this.vignette = 0.5;
    this.bloom = 0.28;
  }
};
