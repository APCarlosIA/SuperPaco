/**
 * @file Efectos visuales de corta duración que no interactúan con nada:
 * pesetas que saltan de un bloque, trozos de ladrillo, textos flotantes,
 * chispas, polvo y "puf" de humo.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../config/constants.js';
import { clamp } from '../../core/math.js';
import { fillRectangle, fillCircle } from '../../core/canvas.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { drawText, measureTextWidth } from '../../graphics/font.js';

/** Tipos de efecto disponibles. */
export const EFFECT_KIND = Object.freeze({
  BLOCK_COIN: 'blockCoin',
  BRICK_DEBRIS: 'brickDebris',
  FLOATING_TEXT: 'floatingText',
  SPARK: 'spark',
  DUST: 'dust',
  PUFF: 'puff'
});

/** Pasos que dura la peseta saltando desde un bloque. */
const BLOCK_COIN_LIFETIME = 26;
/** Pasos que dura una nube de humo. */
const PUFF_LIFETIME = 12;
/** Orden de los fotogramas de la peseta girando. */
const COIN_SPIN_FRAMES = [0, 1, 2, 1];

export class VisualEffect {
  /**
   * @param {string} kind Uno de {@link EFFECT_KIND}.
   * @param {number} x Posición en el mundo (píxeles).
   * @param {number} y
   * @param {Object} [settings]
   * @param {number} [settings.velocityX]
   * @param {number} [settings.velocityY]
   * @param {string} [settings.text] Para textos flotantes.
   * @param {string} [settings.color]
   * @param {number} [settings.lifetime] Duración en pasos.
   * @param {() => void} [settings.onFinished] Se llama al terminar el efecto.
   */
  constructor(kind, x, y, { velocityX = 0, velocityY = 0, text = '', color = '#fcfcfc', lifetime = 40, onFinished = null } = {}) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.text = text;
    this.color = color;
    this.lifetime = lifetime;
    this.onFinished = onFinished;
    this.ageInSteps = 0;
    this.shouldBeRemoved = false;
  }

  /** Avanza la animación un paso. */
  update() {
    this.ageInSteps++;
    switch (this.kind) {
      case EFFECT_KIND.BLOCK_COIN:
        this.velocityY += 0.35;
        this.y += this.velocityY;
        if (this.ageInSteps > BLOCK_COIN_LIFETIME) this.finish();
        break;
      case EFFECT_KIND.BRICK_DEBRIS:
        this.velocityY += 0.3;
        this.x += this.velocityX;
        this.y += this.velocityY;
        if (this.y > SCREEN_HEIGHT) this.finish();
        break;
      case EFFECT_KIND.FLOATING_TEXT:
        // Sube deprisa al principio y luego casi se queda quieto para poder leerlo.
        this.y -= this.ageInSteps < 30 ? 0.7 : 0.15;
        if (this.ageInSteps > this.lifetime) this.finish();
        break;
      case EFFECT_KIND.SPARK:
      case EFFECT_KIND.DUST:
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.kind === EFFECT_KIND.DUST ? -0.02 : 0.05;
        if (this.ageInSteps > this.lifetime) this.finish();
        break;
      case EFFECT_KIND.PUFF:
        if (this.ageInSteps > PUFF_LIFETIME) this.finish();
        break;
    }
  }

  /** @private Marca el efecto para eliminarlo y avisa si alguien esperaba su final. */
  finish() {
    this.shouldBeRemoved = true;
    if (this.onFinished) this.onFinished(this);
  }

  /**
   * Dibuja el efecto.
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const screenX = this.x - cameraX;
    switch (this.kind) {
      case EFFECT_KIND.BLOCK_COIN: {
        const frame = COIN_SPIN_FRAMES[(this.ageInSteps >> 2) % COIN_SPIN_FRAMES.length];
        drawSprite(context, SPRITES[`peseta_spin${frame}`], screenX - 8, this.y - 7);
        break;
      }
      case EFFECT_KIND.BRICK_DEBRIS:
        fillRectangle(context, screenX, this.y, 6, 6, this.color);
        fillRectangle(context, screenX, this.y, 6, 1, '#fcfcfc80');
        break;
      case EFFECT_KIND.FLOATING_TEXT: {
        // Se mantiene dentro de la pantalla aunque el origen esté en un borde.
        const halfWidth = measureTextWidth(this.text.toUpperCase()) / 2 + 2;
        drawText(context, this.text, clamp(screenX, halfWidth, SCREEN_WIDTH - halfWidth), this.y, this.color, { align: 'center', outlineColor: '#000000' });
        break;
      }
      case EFFECT_KIND.SPARK:
        fillRectangle(context, screenX, this.y, 2, 2, this.ageInSteps % 4 < 2 ? this.color : '#fcfcfc');
        break;
      case EFFECT_KIND.DUST:
        fillCircle(context, screenX, this.y, Math.max(1, 3 - (this.ageInSteps >> 3)), '#d8c8a8');
        break;
      case EFFECT_KIND.PUFF:
        fillCircle(context, screenX, this.y, 2 + (this.ageInSteps >> 1), this.ageInSteps < 6 ? '#fcfcfc' : '#fc9c00');
        break;
    }
  }
}
