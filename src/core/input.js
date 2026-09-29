/**
 * @file Entrada del jugador: teclado, mando (Gamepad API) y botones táctiles.
 *
 * Todas las fuentes se traducen a "botones lógicos" (izquierda, saltar, correr…),
 * así el resto del juego no necesita saber si se juega con teclado o con mando.
 *
 * El estado se congela una vez por paso de simulación con `update()`. Eso
 * permite distinguir entre un botón "mantenido" y uno "recién pulsado".
 */

/**
 * @typedef {Object} Controls
 * Interfaz de controles que usa el juego. La implementa el gestor de entrada
 * real (teclado, mando y táctil) y, en los tests, unos controles simulados.
 * @property {(button: string) => boolean} isHeld ¿Está el botón mantenido en este paso?
 * @property {(button: string) => boolean} wasPressed ¿Se ha pulsado justo en este paso?
 * @property {() => boolean} wasConfirmPressed ¿Se ha pulsado aceptar (Enter/Start o saltar)?
 */

/** Botones lógicos que entiende el juego. */
export const BUTTON = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
  JUMP: 'jump',
  RUN: 'run',
  START: 'start',
  PAUSE: 'pause',
  MUTE: 'mute',
  FULLSCREEN: 'fullscreen'
});

/** Correspondencia entre teclas físicas (`KeyboardEvent.code`) y botones lógicos. */
const KEYBOARD_LAYOUT = Object.freeze({
  ArrowLeft: BUTTON.LEFT, KeyA: BUTTON.LEFT,
  ArrowRight: BUTTON.RIGHT, KeyD: BUTTON.RIGHT,
  ArrowUp: BUTTON.UP, KeyW: BUTTON.UP,
  ArrowDown: BUTTON.DOWN, KeyS: BUTTON.DOWN,
  Space: BUTTON.JUMP, KeyZ: BUTTON.JUMP, KeyK: BUTTON.JUMP,
  ShiftLeft: BUTTON.RUN, ShiftRight: BUTTON.RUN, KeyX: BUTTON.RUN, KeyJ: BUTTON.RUN,
  Enter: BUTTON.START, NumpadEnter: BUTTON.START,
  KeyP: BUTTON.PAUSE, Escape: BUTTON.PAUSE,
  KeyM: BUTTON.MUTE,
  KeyF: BUTTON.FULLSCREEN
});

/** Umbral a partir del cual se considera inclinada la palanca analógica del mando. */
const STICK_DEAD_ZONE = 0.4;

/** Índices de botones del "mapeo estándar" de la Gamepad API. */
const GAMEPAD = Object.freeze({
  A: 0, B: 1, X: 2, Y: 3, SELECT: 8, START: 9,
  DPAD_UP: 12, DPAD_DOWN: 13, DPAD_LEFT: 14, DPAD_RIGHT: 15
});

class InputManager {
  constructor() {
    /** Botones mantenidos ahora mismo en el teclado. */
    this.keyboardHeld = {};
    /** Botones mantenidos ahora mismo en la pantalla táctil. */
    this.touchHeld = {};
    /**
     * Botones pulsados desde el último `update()`. Así no se pierde una pulsación
     * muy rápida que empiece y termine entre dos pasos de simulación.
     */
    this.pressedSinceLastUpdate = {};
    /** Estado congelado en este paso de simulación. */
    this.heldThisStep = {};
    /** Estado congelado en el paso anterior. */
    this.heldPreviousStep = {};
    /** Funciones a las que avisar cuando el jugador interactúa (para activar el audio). */
    this.interactionListeners = [];
  }

  /**
   * Empieza a escuchar el teclado y los botones táctiles.
   * @param {HTMLElement} focusTarget Elemento que recibe el foco al tocarlo (el canvas).
   */
  attach(focusTarget) {
    window.addEventListener('keydown', event => this.handleKeyDown(event));
    window.addEventListener('keyup', event => this.handleKeyUp(event));
    window.addEventListener('blur', () => this.releaseAllKeys());
    focusTarget.addEventListener('pointerdown', () => {
      this.notifyInteraction();
      focusTarget.focus();
    });
    this.attachTouchButtons();
  }

  /**
   * Registra una función a la que avisar en cada interacción del jugador.
   * Los navegadores solo dejan sonar audio después de una interacción.
   * @param {() => void} listener
   */
  onUserInteraction(listener) {
    this.interactionListeners.push(listener);
  }

  /** @private */
  notifyInteraction() {
    for (const listener of this.interactionListeners) listener();
  }

  /** @private @param {KeyboardEvent} event */
  handleKeyDown(event) {
    const button = KEYBOARD_LAYOUT[event.code];
    if (button) {
      if (!this.keyboardHeld[button]) this.pressedSinceLastUpdate[button] = true;
      this.keyboardHeld[button] = true;
      event.preventDefault();
    }
    this.notifyInteraction();
  }

  /** @private @param {KeyboardEvent} event */
  handleKeyUp(event) {
    const button = KEYBOARD_LAYOUT[event.code];
    if (button) {
      this.keyboardHeld[button] = false;
      event.preventDefault();
    }
  }

  /** @private Si la ventana pierde el foco, se sueltan todas las teclas para no quedarse "pegadas". */
  releaseAllKeys() {
    for (const button of Object.keys(this.keyboardHeld)) this.keyboardHeld[button] = false;
  }

  /**
   * @private
   * Conecta los botones táctiles del HTML (elementos con `data-button`) y los
   * muestra solo en dispositivos con pantalla táctil.
   */
  attachTouchButtons() {
    document.querySelectorAll('[data-button]').forEach(element => {
      const button = element.dataset.button;
      const press = event => {
        event.preventDefault();
        this.touchHeld[button] = true;
        this.pressedSinceLastUpdate[button] = true;
        element.classList.add('is-pressed');
        this.notifyInteraction();
      };
      const release = event => {
        event.preventDefault();
        this.touchHeld[button] = false;
        element.classList.remove('is-pressed');
      };
      element.addEventListener('pointerdown', press);
      element.addEventListener('pointerup', release);
      element.addEventListener('pointercancel', release);
      element.addEventListener('pointerleave', release);
    });
    const hasTouchScreen = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (hasTouchScreen) document.body.classList.add('has-touch-controls');
  }

  /**
   * @private
   * Lee todos los mandos conectados y devuelve qué botones lógicos están pulsados.
   * @returns {Object<string, boolean>}
   */
  readGamepadButtons() {
    const held = {};
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gamepad of gamepads) {
      if (!gamepad) continue;
      const isPressed = index => Boolean(gamepad.buttons[index] && gamepad.buttons[index].pressed);
      const stickX = gamepad.axes[0] || 0;
      const stickY = gamepad.axes[1] || 0;
      if (isPressed(GAMEPAD.DPAD_LEFT) || stickX < -STICK_DEAD_ZONE) held[BUTTON.LEFT] = true;
      if (isPressed(GAMEPAD.DPAD_RIGHT) || stickX > STICK_DEAD_ZONE) held[BUTTON.RIGHT] = true;
      if (isPressed(GAMEPAD.DPAD_UP) || stickY < -0.6) held[BUTTON.UP] = true;
      if (isPressed(GAMEPAD.DPAD_DOWN) || stickY > 0.6) held[BUTTON.DOWN] = true;
      if (isPressed(GAMEPAD.A) || isPressed(GAMEPAD.Y)) held[BUTTON.JUMP] = true;
      if (isPressed(GAMEPAD.B) || isPressed(GAMEPAD.X)) held[BUTTON.RUN] = true;
      if (isPressed(GAMEPAD.START)) held[BUTTON.START] = true;
      if (isPressed(GAMEPAD.SELECT)) held[BUTTON.PAUSE] = true;
    }
    return held;
  }

  /**
   * Congela el estado de todos los botones para este paso de simulación.
   * Debe llamarse exactamente una vez al principio de cada paso.
   */
  update() {
    const gamepadHeld = this.readGamepadButtons();
    for (const button of Object.values(BUTTON)) {
      this.heldPreviousStep[button] = this.heldThisStep[button];
      this.heldThisStep[button] = Boolean(
        this.keyboardHeld[button] || this.touchHeld[button] || gamepadHeld[button] || this.pressedSinceLastUpdate[button]
      );
      this.pressedSinceLastUpdate[button] = false;
    }
  }

  /**
   * ¿Está el botón mantenido en este paso?
   * @param {string} button Uno de los valores de {@link BUTTON}.
   * @returns {boolean}
   */
  isHeld(button) {
    return Boolean(this.heldThisStep[button]);
  }

  /**
   * ¿Se ha pulsado el botón justo en este paso (antes no lo estaba)?
   * @param {string} button Uno de los valores de {@link BUTTON}.
   * @returns {boolean}
   */
  wasPressed(button) {
    return Boolean(this.heldThisStep[button]) && !this.heldPreviousStep[button];
  }

  /**
   * ¿Se ha pulsado un botón de "aceptar" (Enter/Start o saltar) en este paso?
   * @returns {boolean}
   */
  wasConfirmPressed() {
    return this.wasPressed(BUTTON.START) || this.wasPressed(BUTTON.JUMP);
  }
}

/** Instancia única compartida por todo el juego. */
export const input = new InputManager();
