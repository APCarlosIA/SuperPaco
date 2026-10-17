/**
 * @file Comportamiento común de todos los enemigos.
 *
 * Cada enemigo puede terminar de dos formas:
 *   - Aplastado (pisado): se queda plano un momento y desaparece.
 *   - Noqueado (pimiento, caparazón, churros, golpe desde abajo): da un saltito,
 *     se pone boca abajo y cae fuera de la pantalla.
 */
import { ENEMY_PHYSICS, GAME_RULES, SCREEN_HEIGHT } from '../../config/constants.js';
import { random } from '../../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { Entity } from '../Entity.js';

/** Pasos que un enemigo aplastado se queda en el suelo antes de desaparecer. */
const SQUASHED_DISPLAY_STEPS = 30;
/**
 * Holgura (px) para considerar que Paco cae encima del enemigo: sus pies tenían
 * que estar, en el paso anterior, como mucho estos píxeles por debajo de la
 * cabeza del enemigo.
 */
export const STOMP_TOLERANCE = 8;
const KNOCK_OUT_JUMP_SPEED = 3.5;
const KNOCK_OUT_HORIZONTAL_SPEED = 0.8;
const KNOCK_OUT_GRAVITY = 0.3;

export class Enemy extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.isEnemy = true;
    /** ¿Se le puede derrotar saltándole encima? */
    this.canBeStomped = true;
    /** ¿Hace daño a Paco al tocarlo? */
    this.isHarmful = true;
    /** ¿Resiste los pimientos picantes? */
    this.isFireproof = false;
    /** ¿Resiste el contacto con Paco invencible (churros)? */
    this.resistsInvincibleTouch = false;
    /** ¿Resiste caparazones deslizantes, explosiones y golpes desde abajo? */
    this.resistsShellsAndExplosions = false;
    /** ¿Se da la vuelta al chocar con otro enemigo que camina? */
    this.turnsAroundOnEnemyContact = false;
    this.isKnockedOut = false;
    this.squashedStepsLeft = 0;
    /** Frases que puede decir al ser derrotado (o null). */
    this.catchphrases = null;
  }

  /** Aplica la gravedad de los enemigos. */
  applyGravity(strength = ENEMY_PHYSICS.gravity) {
    this.velocityY = Math.min(this.velocityY + strength, ENEMY_PHYSICS.maxFallSpeed);
  }

  /**
   * Noquea al enemigo: salta, se pone boca abajo y cae de la pantalla.
   * @param {number} [direction] Hacia dónde sale despedido (-1, 1 o 0 para al azar).
   */
  knockOut(direction = 0) {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.isKnockedOut = true;
    this.isHarmful = false;
    this.velocityY = -KNOCK_OUT_JUMP_SPEED;
    const horizontalDirection = direction || (random() < 0.5 ? -1 : 1);
    this.velocityX = horizontalDirection * KNOCK_OUT_HORIZONTAL_SPEED;
  }

  /** Aplasta al enemigo (se queda plano en el suelo un momento). */
  squash() {
    this.isDefeated = true;
    this.isHarmful = false;
    this.squashedStepsLeft = SQUASHED_DISPLAY_STEPS;
    this.velocityX = 0;
  }

  /**
   * Avanza la animación de derrota si la hay.
   * @returns {boolean} true si el enemigo está derrotado (y no debe hacer nada más).
   */
  updateDefeatAnimation() {
    if (this.isKnockedOut) {
      this.velocityY += KNOCK_OUT_GRAVITY;
      this.x += this.velocityX;
      this.y += this.velocityY;
      if (this.y > SCREEN_HEIGHT + 40) this.shouldBeRemoved = true;
      return true;
    }
    if (this.squashedStepsLeft > 0) {
      this.squashedStepsLeft--;
      if (this.squashedStepsLeft === 0) this.shouldBeRemoved = true;
      return true;
    }
    return false;
  }

  /**
   * ¿Está Paco cayendo sobre la cabeza del enemigo?
   * @param {import('../Player.js').Player} player
   * @returns {boolean}
   */
  isStompedBy(player) {
    const previousFeetY = player.bottom - player.velocityY;
    return player.velocityY > 0 && previousFeetY <= this.y + STOMP_TOLERANCE;
  }

  /**
   * Qué pasa al ser pisado. Por defecto, se aplasta.
   * @param {import('../Player.js').Player} player
   * @param {import('../../game/World.js').World} world
   */
  onStomped(player, world) {
    this.squash();
    world.rewardStomp(this, player);
    soundEngine.playSoundEffect(SOUND_EFFECT.STOMP);
  }

  /**
   * Paco toca al enemigo: invencible lo noquea, desde arriba lo pisa y, si no,
   * Paco recibe daño.
   * @param {import('../Player.js').Player} player
   * @param {import('../../game/World.js').World} world
   */
  onPlayerContact(player, world) {
    if (player.isInvincible && !this.resistsInvincibleTouch) {
      this.knockOut(player.centerX < this.centerX ? 1 : -1);
      world.awardPoints(GAME_RULES.pointsForEnemyDefeatedByFire, this.centerX, this.y);
      soundEngine.playSoundEffect(SOUND_EFFECT.KICK);
      return;
    }
    if (this.canBeStomped && this.isStompedBy(player)) {
      this.onStomped(player, world);
      player.bounceOffEnemy();
      return;
    }
    if (this.isHarmful) player.takeHit(world);
  }

  /**
   * Le alcanza un pimiento picante.
   * @param {import('../PlayerFireball.js').PlayerFireball} fireball
   * @param {import('../../game/World.js').World} world
   * @returns {boolean} true si el enemigo ha sido derrotado.
   */
  onHitByFireball(fireball, world) {
    if (this.isFireproof) return false;
    this.knockOut(fireball.velocityX > 0 ? 1 : -1);
    world.awardPoints(GAME_RULES.pointsForEnemyDefeatedByFire, this.centerX, this.y);
    soundEngine.playSoundEffect(SOUND_EFFECT.KICK);
    return true;
  }

  /** Marca para eliminar al enemigo si ha caído a un foso o se ha quedado muy atrás. */
  removeIfOutsideWorld(world) {
    if (this.y > SCREEN_HEIGHT + 40 || this.x < world.cameraX - 96) this.shouldBeRemoved = true;
  }

  /**
   * Dibuja un sprite centrado en la caja de colisión y apoyado en su base.
   * Los enemigos derrotados por noqueo se dibujan boca abajo.
   * @param {CanvasRenderingContext2D} context
   * @param {string} spriteName
   * @param {number} cameraX
   * @param {{mirrored?: boolean, offsetX?: number}} [options]
   */
  drawCenteredSprite(context, spriteName, cameraX, { mirrored = false, offsetX = 0 } = {}) {
    const sprite = SPRITES[spriteName];
    drawSprite(context, sprite, this.centerX - sprite.width / 2 - cameraX + offsetX, this.bottom - sprite.height, { mirrored, upsideDown: this.isKnockedOut });
  }

  /**
   * Nombre del sprite del fotograma actual de una animación con cualquier
   * número de fotogramas (`<prefijo>_frame1`, `<prefijo>_frame2`…).
   * @param {string} prefix
   * @param {number} [stepsPerFrame] Pasos de simulación que dura cada fotograma.
   * @returns {string}
   */
  getFrameName(prefix, stepsPerFrame = 8) {
    let frameCount = 0;
    while (SPRITES[`${prefix}_frame${frameCount + 1}`]) frameCount++;
    return `${prefix}_frame${(Math.floor(this.ageInSteps / stepsPerFrame) % Math.max(1, frameCount)) + 1}`;
  }

  /**
   * Fotograma de la animación de dos pasos (cambia cada 8 pasos de simulación).
   * @param {number} [stepsPerFrame]
   * @returns {1|2}
   */
  getAnimationFrame(stepsPerFrame = 8) {
    return Math.floor(this.ageInSteps / stepsPerFrame) % 2 ? 2 : 1;
  }
}
