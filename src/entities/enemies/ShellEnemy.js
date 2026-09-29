/**
 * @file Enemigo con "caparazón": el turista (que se esconde tras su maleta) y
 * el caracol (que se mete en su concha).
 *
 * Estados:
 *   - walking: camina como un enemigo normal.
 *   - hiding: tras pisarlo, queda escondido y quieto. Al tocarlo se patea.
 *     Si nadie lo toca durante un rato, vuelve a caminar.
 *   - sliding: el caparazón pateado se desliza a toda velocidad, rebota en las
 *     paredes y derrota a los enemigos que encuentra (dando puntos en cadena).
 */
import { TILE_SIZE, GAME_RULES } from '../../config/constants.js';
import { rectanglesOverlap } from '../../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { moveHorizontally, moveVertically, hasGroundAhead } from '../../world/tileCollision.js';
import { Enemy } from './Enemy.js';

/** Estados del enemigo con caparazón. */
export const SHELL_STATE = Object.freeze({ WALKING: 'walking', HIDING: 'hiding', SLIDING: 'sliding' });
const SHELL_HEIGHT = 14;
const SLIDE_SPEED = 4.2;
/** Pasos que tarda en volver a salir del caparazón. */
const HIDING_DURATION_STEPS = 480;
/** Cuando quedan estos pasos para salir, el caparazón empieza a temblar como aviso. */
const SHAKE_WARNING_STEPS = 90;
/** Pasos tras la patada en los que el caparazón no hace daño a Paco (para poder patearlo tranquilo). */
const KICK_GRACE_STEPS = 12;

export class ShellEnemy extends Enemy {
  /**
   * @param {number} column
   * @param {number} row Fila que pisa.
   * @param {import('./enemyCatalog.js').EnemyProfile} profile
   */
  constructor(column, row, profile) {
    super(column * TILE_SIZE + 2, (row + 1) * TILE_SIZE - profile.walkingHeight, 12, profile.walkingHeight);
    this.profile = profile;
    this.catchphrases = profile.catchphrases || null;
    this.state = SHELL_STATE.WALKING;
    this.hidingStepsLeft = 0;
    this.kickGraceStepsLeft = 0;
    /** Enemigos derrotados en este deslizamiento (cada uno da más puntos). */
    this.slideKnockOuts = 0;
    this.turnsAroundOnEnemyContact = true;
  }

  /** @private Cambia la altura de la caja manteniendo los pies en el sitio. */
  resizeKeepingFeet(newHeight) {
    const feetY = this.bottom;
    this.height = newHeight;
    this.y = feetY - newHeight;
  }

  /** @private Se esconde en el caparazón. */
  hideInShell() {
    this.resizeKeepingFeet(SHELL_HEIGHT);
    this.state = SHELL_STATE.HIDING;
    this.velocityX = 0;
    this.hidingStepsLeft = HIDING_DURATION_STEPS;
    this.isHarmful = false;
    this.turnsAroundOnEnemyContact = false;
  }

  /** @private Sale del caparazón y vuelve a caminar. */
  comeOutOfShell() {
    this.resizeKeepingFeet(this.profile.walkingHeight);
    this.state = SHELL_STATE.WALKING;
    this.isHarmful = true;
    this.turnsAroundOnEnemyContact = true;
  }

  /** @private Paco patea el caparazón hacia un lado. */
  kick(direction) {
    this.state = SHELL_STATE.SLIDING;
    this.facing = direction;
    this.kickGraceStepsLeft = KICK_GRACE_STEPS;
    this.isHarmful = true;
    this.slideKnockOuts = 0;
    soundEngine.playSoundEffect(SOUND_EFFECT.KICK);
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    if (this.updateDefeatAnimation()) return;
    this.ageInSteps++;
    this.applyGravity();
    if (this.kickGraceStepsLeft > 0) this.kickGraceStepsLeft--;

    if (this.state === SHELL_STATE.WALKING) this.updateWalking(world);
    else if (this.state === SHELL_STATE.HIDING) this.updateHiding(world);
    else this.updateSliding(world);

    this.removeIfOutsideWorld(world);
  }

  /** @private */
  updateWalking(world) {
    this.velocityX = this.facing * this.profile.walkSpeed;
    if (moveHorizontally(this, world.tileMap)) this.facing *= -1;
    moveVertically(this, world.tileMap);
    if (this.profile.turnsAtEdges && this.isOnGround && !hasGroundAhead(this, world.tileMap)) this.facing *= -1;
  }

  /** @private */
  updateHiding(world) {
    this.velocityX = 0;
    moveVertically(this, world.tileMap);
    this.hidingStepsLeft--;
    if (this.hidingStepsLeft <= 0) this.comeOutOfShell();
  }

  /** @private Se desliza, rebota y derrota a los enemigos que encuentra. */
  updateSliding(world) {
    this.velocityX = this.facing * SLIDE_SPEED;
    if (moveHorizontally(this, world.tileMap)) {
      this.facing *= -1;
      if (world.isVisible(this)) soundEngine.playSoundEffect(SOUND_EFFECT.BUMP);
    }
    moveVertically(this, world.tileMap);
    for (const other of world.entities) {
      if (other === this || !other.isEnemy || other.isDefeated || other.resistsShellsAndExplosions) continue;
      if (rectanglesOverlap(this, other.getHitbox())) {
        other.knockOut(this.facing);
        this.slideKnockOuts++;
        world.awardPoints(world.getComboPoints(this.slideKnockOuts), other.centerX, other.y);
        soundEngine.playSoundEffect(SOUND_EFFECT.KICK);
      }
    }
  }

  /**
   * @param {import('../Player.js').Player} player
   * @param {import('../../game/World.js').World} world
   */
  onPlayerContact(player, world) {
    if (player.isInvincible) {
      this.knockOut(player.centerX < this.centerX ? 1 : -1);
      world.awardPoints(GAME_RULES.pointsForEnemyDefeatedByFire, this.centerX, this.y);
      soundEngine.playSoundEffect(SOUND_EFFECT.KICK);
      return;
    }
    const isFromAbove = this.isStompedBy(player);
    switch (this.state) {
      case SHELL_STATE.WALKING:
        if (!isFromAbove) {
          player.takeHit(world);
          return;
        }
        this.hideInShell();
        world.rewardStomp(this, player);
        soundEngine.playSoundEffect(SOUND_EFFECT.STOMP);
        player.bounceOffEnemy();
        return;
      case SHELL_STATE.HIDING:
        // Tocarlo desde cualquier lado lo patea en dirección contraria a Paco.
        this.kick(player.centerX < this.centerX ? 1 : -1);
        world.awardPoints(GAME_RULES.pointsForKickingShell, this.centerX, this.y);
        if (isFromAbove) player.bounceOffEnemy();
        return;
      case SHELL_STATE.SLIDING:
        if (isFromAbove) {
          // Pisar un caparazón en marcha lo detiene.
          this.state = SHELL_STATE.HIDING;
          this.velocityX = 0;
          this.hidingStepsLeft = HIDING_DURATION_STEPS;
          this.isHarmful = false;
          world.rewardStomp(this, player);
          soundEngine.playSoundEffect(SOUND_EFFECT.STOMP);
          player.bounceOffEnemy();
        } else if (this.kickGraceStepsLeft === 0) {
          player.takeHit(world);
        }
        return;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    if (this.state === SHELL_STATE.WALKING && !this.isKnockedOut) {
      this.drawCenteredSprite(context, `${this.profile.spriteName}_frame${this.getAnimationFrame()}`, cameraX, { mirrored: this.facing > 0 });
      return;
    }
    const isAboutToComeOut = this.state === SHELL_STATE.HIDING && this.hidingStepsLeft < SHAKE_WARNING_STEPS;
    const shakeOffset = isAboutToComeOut ? ((this.ageInSteps >> 1) & 1 ? 1 : -1) : 0;
    this.drawCenteredSprite(context, this.profile.shellSpriteName, cameraX, { offsetX: shakeOffset });
  }
}
