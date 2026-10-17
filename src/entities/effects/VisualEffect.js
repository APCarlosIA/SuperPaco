/**
 * @file Efectos visuales de corta duración que no interactúan con nada:
 * pesetas que saltan de un bloque, trozos de ladrillo, textos flotantes,
 * chispas brillantes, polvo, nubes de humo, ondas de impacto y estrellitas.
 * Se dibujan en alta resolución con degradados y brillo aditivo.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../config/constants.js';
import { clamp } from '../../core/math.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { drawText, measureTextWidth } from '../../graphics/font.js';
import { OUTLINE_COLOR } from '../../graphics/hd.js';

/** Tipos de efecto disponibles. */
export const EFFECT_KIND = Object.freeze({
  BLOCK_COIN: 'blockCoin',
  BRICK_DEBRIS: 'brickDebris',
  FLOATING_TEXT: 'floatingText',
  SPARK: 'spark',
  DUST: 'dust',
  PUFF: 'puff',
  RING: 'ring',
  STAR: 'star'
});

/** Pasos que dura la peseta saltando desde un bloque. */
const BLOCK_COIN_LIFETIME = 26;
/** Pasos que dura una nube de humo. */
const PUFF_LIFETIME = 16;
/** Pasos que dura una onda de impacto. */
const RING_LIFETIME = 12;
/** Orden de los fotogramas de la peseta girando. */
const COIN_SPIN_FRAMES = [0, 1, 2, 1];
const TAU = Math.PI * 2;

/** Dibuja una estrella de cuatro puntas. */
function paintSparkle(context, x, y, radius, color) {
  context.beginPath();
  for (let point = 0; point < 8; point++) {
    const angle = point * Math.PI / 4;
    const length = point % 2 ? radius * 0.28 : radius;
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

/** Resplandor aditivo circular. */
function paintGlow(context, x, y, radius, color, opacity) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color.replace('ALPHA', String(opacity)));
  gradient.addColorStop(1, color.replace('ALPHA', '0'));
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
}

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
   * @param {number} [settings.size] Tamaño base (ondas, estrellas y polvo).
   * @param {() => void} [settings.onFinished] Se llama al terminar el efecto.
   */
  constructor(kind, x, y, { velocityX = 0, velocityY = 0, text = '', color = '#fcfcfc', lifetime = 40, size = 8, onFinished = null } = {}) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.text = text;
    this.color = color;
    this.lifetime = lifetime;
    this.size = size;
    this.onFinished = onFinished;
    this.ageInSteps = 0;
    this.spin = (x * 7.31 + y * 3.17) % TAU;
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
      case EFFECT_KIND.STAR:
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.kind === EFFECT_KIND.DUST ? -0.012 : 0.05;
        if (this.kind !== EFFECT_KIND.STAR) { this.velocityX *= 0.97; }
        if (this.ageInSteps > this.lifetime) this.finish();
        break;
      case EFFECT_KIND.PUFF:
        if (this.ageInSteps > PUFF_LIFETIME) this.finish();
        break;
      case EFFECT_KIND.RING:
        if (this.ageInSteps > RING_LIFETIME) this.finish();
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
    const progress = this.lifetime > 0 ? this.ageInSteps / this.lifetime : 0;
    switch (this.kind) {
      case EFFECT_KIND.BLOCK_COIN: {
        const frame = COIN_SPIN_FRAMES[(this.ageInSteps >> 2) % COIN_SPIN_FRAMES.length];
        paintGlow(context, screenX, this.y, 14, 'rgba(255,214,90,ALPHA)', 0.5);
        drawSprite(context, SPRITES[`peseta_spin${frame}`], screenX - 8, this.y - 7);
        break;
      }
      case EFFECT_KIND.BRICK_DEBRIS: {
        context.save();
        context.translate(screenX, this.y);
        context.rotate(this.spin + this.ageInSteps * 0.28);
        context.fillStyle = this.color;
        context.strokeStyle = OUTLINE_COLOR;
        context.lineWidth = 0.8;
        context.beginPath();
        context.rect(-3, -2.6, 6, 5.2);
        context.fill();
        context.stroke();
        context.fillStyle = 'rgba(255,255,255,0.35)';
        context.fillRect(-2.4, -2.1, 4.8, 0.9);
        context.restore();
        break;
      }
      case EFFECT_KIND.FLOATING_TEXT: {
        // Se mantiene dentro de la pantalla aunque el origen esté en un borde.
        const halfWidth = measureTextWidth(this.text.toUpperCase()) / 2 + 2;
        const x = clamp(screenX, halfWidth, SCREEN_WIDTH - halfWidth);
        // Rebote de aparición.
        const pop = this.ageInSteps < 8 ? 1 + 0.55 * Math.sin((1 - this.ageInSteps / 8) * Math.PI * 0.5) : 1;
        const fade = this.ageInSteps > this.lifetime - 10 ? (this.lifetime - this.ageInSteps) / 10 : 1;
        const previousAlpha = context.globalAlpha;
        context.globalAlpha = previousAlpha * clamp(fade, 0, 1);
        context.save();
        context.translate(x, this.y + 3);
        context.scale(pop, pop);
        drawText(context, this.text, 0, -3, this.color, { align: 'center', outlineColor: '#1a1020' });
        context.restore();
        context.globalAlpha = previousAlpha;
        break;
      }
      case EFFECT_KIND.SPARK: {
        const fade = 1 - progress;
        paintGlow(context, screenX, this.y, 6, 'rgba(255,230,140,ALPHA)', 0.6 * fade);
        context.globalAlpha = fade;
        paintSparkle(context, screenX, this.y, 1.6 + fade, this.ageInSteps % 4 < 2 ? this.color : '#ffffff');
        context.globalAlpha = 1;
        break;
      }
      case EFFECT_KIND.STAR: {
        const fade = 1 - progress;
        context.save();
        context.globalAlpha = fade;
        context.translate(screenX, this.y);
        context.rotate(this.ageInSteps * 0.12);
        paintGlow(context, 0, 0, this.size * 1.6, 'rgba(255,240,170,ALPHA)', 0.55);
        paintSparkle(context, 0, 0, this.size * (0.6 + fade * 0.6), this.color);
        context.restore();
        break;
      }
      case EFFECT_KIND.DUST: {
        const radius = 1.6 + progress * 3.4;
        context.save();
        context.globalAlpha = 0.55 * (1 - progress);
        const gradient = context.createRadialGradient(screenX, this.y, 0, screenX, this.y, radius);
        gradient.addColorStop(0, '#f4ead4');
        gradient.addColorStop(1, 'rgba(216,200,168,0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(screenX, this.y, radius, 0, TAU);
        context.fill();
        context.restore();
        break;
      }
      case EFFECT_KIND.PUFF: {
        const t = this.ageInSteps / PUFF_LIFETIME;
        const radius = 3 + t * 11;
        paintGlow(context, screenX, this.y, radius * 1.8, 'rgba(255,170,60,ALPHA)', 0.65 * (1 - t));
        context.save();
        context.globalAlpha = 1 - t;
        const gradient = context.createRadialGradient(screenX, this.y, 0, screenX, this.y, radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#ffd36a');
        gradient.addColorStop(1, 'rgba(252,120,0,0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(screenX, this.y, radius, 0, TAU);
        context.fill();
        context.restore();
        break;
      }
      case EFFECT_KIND.RING: {
        const t = this.ageInSteps / RING_LIFETIME;
        const eased = 1 - (1 - t) * (1 - t);
        context.save();
        context.globalAlpha = 1 - t;
        context.strokeStyle = this.color;
        context.lineWidth = 2.4 * (1 - t) + 0.4;
        context.beginPath();
        context.ellipse(screenX, this.y, this.size * eased, this.size * eased * 0.55, 0, 0, TAU);
        context.stroke();
        context.restore();
        break;
      }
    }
  }
}
