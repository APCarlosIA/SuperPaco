/**
 * @file Don Hacienda, el jefe final.
 *
 * Se pasea por el puente del castillo, salta de vez en cuando y lanza facturas
 * (en arco o en línea recta). Tiene 6 puntos de vida:
 *   - Cada pisotón le quita 2.
 *   - Cada pimiento picante le quita 1.
 * Cuanta menos vida le queda, más rápido se mueve y más a menudo ataca.
 * Tras recibir daño parpadea unos instantes y no se le puede volver a dañar.
 */
import { TILE_SIZE, SCREEN_HEIGHT, GAME_RULES } from '../../config/constants.js';
import { random, randomInteger, randomItem, clamp } from '../../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { moveVertically } from '../../world/tileCollision.js';
import { GAMEPLAY_MESSAGES } from '../../world/texts.js';
import { TaxInvoice } from '../hazards/TaxInvoice.js';
import { Enemy } from './Enemy.js';

const MAX_HEALTH = 6;
const STOMP_DAMAGE = 2;
const FIREBALL_DAMAGE = 1;
const INVULNERABLE_STEPS_AFTER_STOMP = 80;
const INVULNERABLE_STEPS_AFTER_FIREBALL = 20;
const BASE_WALK_SPEED = 0.5;
/** Velocidad extra por cada punto de vida perdido. */
const WALK_SPEED_PER_DAMAGE = 0.12;
const JUMP_SPEED = 6;
const JUMP_INTERVAL = { min: 120, max: 220 };
const ATTACK_INTERVAL = { min: 60, max: 110 };
/** Pasos que se acorta el intervalo de ataque por cada punto de vida perdido. */
const ATTACK_SPEED_UP_PER_DAMAGE = 7;
/** Probabilidad por paso de cambiar de dirección al pasear. */
const TURN_PROBABILITY = 0.008;
const PLAYER_BOUNCE_SPEED = -6.5;
const SAYINGS = ['¡ESO NO DESGRAVA!', '¡PAGUE LA MULTA!', '¡HACIENDA SOMOS TODOS!', '¡INSPECCIÓN SORPRESA!', '¡CON IVA, POR FAVOR!'];

export class TaxInspectorBoss extends Enemy {
  /**
   * @param {number} column
   * @param {number} row Fila que pisa.
   * @param {{firstColumn: number, lastColumn: number}} arena Zona del combate.
   */
  constructor(column, row, arena) {
    super(column * TILE_SIZE, (row + 1) * TILE_SIZE - 30, 24, 30);
    this.arena = arena;
    this.health = MAX_HEALTH;
    this.invulnerableSteps = 0;
    this.stepsUntilAttack = 100;
    this.stepsUntilJump = 180;
    this.hasStartedFight = false;
    /** Si Paco está a su izquierda (el sprite se refleja para mirarle siempre). */
    this.isFacingPlayerOnLeft = true;
    this.hasFallenIntoLava = false;
    this.minimumX = (arena.firstColumn + 3) * TILE_SIZE;
    this.maximumX = (arena.lastColumn - 1) * TILE_SIZE - this.width;
    this.resistsShellsAndExplosions = true;
    this.resistsInvincibleTouch = true;
  }

  /** Vida perdida hasta ahora (hace que el jefe se vuelva más agresivo). */
  get damageTaken() {
    return MAX_HEALTH - this.health;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    this.isFacingPlayerOnLeft = world.player.centerX < this.centerX;
    if (this.isDefeated) {
      this.fallIntoLava(world);
      return;
    }
    if (!this.hasStartedFight) {
      // El combate empieza cuando la cámara se detiene en la arena.
      if (!world.isCameraAtBossArena()) return;
      this.hasStartedFight = true;
      world.startBossFight();
    }
    if (this.invulnerableSteps > 0) this.invulnerableSteps--;
    this.patrolBridge(world);
    this.maybeJump();
    this.maybeAttack(world);
  }

  /** @private Pasea de un lado a otro del puente. */
  patrolBridge(world) {
    this.applyGravity(0.3);
    if (random() < TURN_PROBABILITY) this.facing *= -1;
    this.x += this.facing * (BASE_WALK_SPEED + this.damageTaken * WALK_SPEED_PER_DAMAGE);
    if (this.x < this.minimumX) { this.x = this.minimumX; this.facing = 1; }
    if (this.x > this.maximumX) { this.x = this.maximumX; this.facing = -1; }
    moveVertically(this, world.tileMap);
  }

  /** @private */
  maybeJump() {
    if (--this.stepsUntilJump > 0 || !this.isOnGround) return;
    this.velocityY = -JUMP_SPEED;
    this.stepsUntilJump = randomInteger(JUMP_INTERVAL.min, JUMP_INTERVAL.max);
  }

  /** @private Lanza una factura en arco hacia Paco o en línea recta. */
  maybeAttack(world) {
    if (--this.stepsUntilAttack > 0) return;
    this.stepsUntilAttack = randomInteger(ATTACK_INTERVAL.min, ATTACK_INTERVAL.max) - this.damageTaken * ATTACK_SPEED_UP_PER_DAMAGE;
    const player = world.player;
    if (random() < 0.5) {
      const horizontalSpeed = clamp((player.centerX - this.centerX) / 50, -3, 3);
      world.addEntity(TaxInvoice.createArcing(this.centerX, this.y + 4, horizontalSpeed));
    } else {
      const direction = player.centerX < this.centerX ? -1 : 1;
      world.addEntity(TaxInvoice.createStraight(this.centerX, this.y + 14, direction));
    }
    soundEngine.playSoundEffect(SOUND_EFFECT.THROW);
    if (random() < 0.3) world.showFloatingText(randomItem(SAYINGS), this.centerX, this.y - 10, '#fcd800');
  }

  /** @private Tras ser derrotado cae boca abajo a la lava y avisa al mundo. */
  fallIntoLava(world) {
    this.velocityY += 0.2;
    this.y += this.velocityY;
    if (this.y > SCREEN_HEIGHT + 60 && !this.hasFallenIntoLava) {
      this.hasFallenIntoLava = true;
      world.onBossFallen();
    }
  }

  /**
   * @param {number} amount Puntos de vida que pierde.
   * @param {number} invulnerableSteps
   * @param {import('../../game/World.js').World} world
   */
  receiveDamage(amount, invulnerableSteps, world) {
    this.health -= amount;
    this.invulnerableSteps = invulnerableSteps;
    soundEngine.playSoundEffect(SOUND_EFFECT.BOSS_HIT);
    world.showFloatingText(randomItem(SAYINGS), this.centerX, this.y - 10, '#fcd800');
    world.shakeScreen(6);
    if (this.health <= 0) this.defeat(world);
  }

  /** @private */
  defeat(world) {
    this.isDefeated = true;
    this.isHarmful = false;
    this.velocityY = -5;
    world.awardPoints(GAME_RULES.pointsForBossDefeat, this.centerX, this.y);
    world.showBanner(GAMEPLAY_MESSAGES.bossDefeated, 160);
    soundEngine.stopMusic();
    soundEngine.playSoundEffect(SOUND_EFFECT.EXPLOSION);
  }

  /** Pisarle hace daño; tocarle de lado, no (le hace daño a Paco). */
  onPlayerContact(player, world) {
    if (this.isDefeated) return;
    const isFromAbove = player.velocityY > 0 && player.bottom - player.velocityY <= this.y + 12;
    if (isFromAbove) {
      player.bounceOffEnemy(PLAYER_BOUNCE_SPEED);
      if (this.invulnerableSteps === 0) this.receiveDamage(STOMP_DAMAGE, INVULNERABLE_STEPS_AFTER_STOMP, world);
      return;
    }
    if (!player.isInvincible) player.takeHit(world);
  }

  /** Los pimientos le quitan un punto de vida. */
  onHitByFireball(fireball, world) {
    if (!this.isDefeated && this.invulnerableSteps === 0) this.receiveDamage(FIREBALL_DAMAGE, INVULNERABLE_STEPS_AFTER_FIREBALL, world);
    return true;
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const isBlinking = this.invulnerableSteps > 0 && (this.invulnerableSteps >> 2) % 2 === 0 && !this.isDefeated;
    if (isBlinking) return;
    const looksHurt = this.isDefeated || this.invulnerableSteps > INVULNERABLE_STEPS_AFTER_STOMP - 20;
    const spriteName = looksHurt ? 'hacienda_hurt' : this.getFrameName('hacienda', 12);
    // Siempre mira hacia Paco (el sprite original mira a la izquierda).
    const sprite = SPRITES[spriteName];
    drawSprite(context, sprite, this.centerX - 16 - cameraX, this.bottom - sprite.height, { mirrored: !this.isFacingPlayerOnLeft, upsideDown: this.isDefeated });
  }

}
